'use strict';

// Suppress AWS SDK warnings
const path = require('path');
require(path.join(__dirname, '..', 'utils', 'suppressWarnings'));

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const { Sequelize } = require('sequelize');
const TCGdex = require('@tcgdex/sdk').default;

// --- DB Setup ---
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Missing DATABASE_URL in environment.');

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

// --- R2 Setup ---
const R2 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME_PKM;
const BASE_URL = process.env.R2_URL_PKM;

// --- Helpers ---
function cleanJSON(obj) {
  if (Array.isArray(obj)) return obj.map(cleanJSON);
  if (obj && typeof obj === 'object')
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, cleanJSON(v)])
    );
  return obj === undefined ? null : obj;
}

async function getExistingImageFilenames(prefix) {
  const existing = new Set();
  let ContinuationToken;
  do {
    const res = await R2.listObjectsV2({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken,
    }).promise();
    for (const obj of res.Contents || []) {
      const key = obj.Key.replace(prefix, '');
      existing.add(key);
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : null;
  } while (ContinuationToken);
  return existing;
}

async function uploadToR2(prefix, filename, buffer) {
  await R2.putObject({
    Bucket: R2_BUCKET_NAME,
    Key: `${prefix}${filename}`,
    Body: buffer,
    ContentType: 'image/jpeg',
  }).promise();
}

// --- MAIN ---
async function main() {
  if (!BASE_URL) throw new Error('Missing R2_URL in environment.');

  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected to database.');

  const queryInterface = sequelize.getQueryInterface();

  console.log('Fetching existing cards from DB...');
  const [existingCards] = await sequelize.query(
    'SELECT card_id, name FROM cards'
  );
  const cardNameToId = new Map(existingCards.map((c) => [c.name, c.card_id]));
  console.log(`Found ${cardNameToId.size} existing cards.`);

  console.log('Fetching existing images from DB...');
  const [existingImages] = await sequelize.query(
    'SELECT image_url_small FROM card_images'
  );
  const existingImageURLs = new Set(
    existingImages.map((i) => i.image_url_small)
  );
  console.log(`Found ${existingImageURLs.size} existing image rows.`);

  console.log('Fetching Pokémon cards from TCGdex...');
  const tcgdex = new TCGdex('en');
  const resumes = await tcgdex.card.list(); // CardResume[]
  console.log(`Total cards to process: ${resumes.length}`);

  console.log('Fetching existing R2 image files...');
  const existingFiles = {
    original: await getExistingImageFilenames('original/'),
    low_resolution: await getExistingImageFilenames('low_resolution/'),
    cropped: await getExistingImageFilenames('cropped/'),
  };
  console.log(
    `R2 files:
  - Original: ${existingFiles.original.size}
  - Low resolution: ${existingFiles.low_resolution.size}
  - Cropped: ${existingFiles.cropped.size}`
  );

  const newCardRows = [];
  const newImageRows = [];
  let missingImageCount = 0;
  let uploadedImageCount = 0;

  // --- PROCESS BATCHES ---
  const batchSize = 50;
  for (let i = 0; i < resumes.length; i += batchSize) {
    const batch = resumes.slice(i, i + batchSize);
    const fullCards = await Promise.all(
      batch.map(async (resume) => {
        try {
          const card = await tcgdex.card.get(resume.id);
          return card;
        } catch {
          return null;
        }
      })
    );

    for (const card of fullCards) {
      if (!card) continue;
      const existingCardId = cardNameToId.get(card.name);
      const cardId = existingCardId || uuidv4();

      // Insert new card if missing
      if (!existingCardId) {
        const meta = cleanJSON({
          id: card.id,
          name: card.name,
          hp: card.hp || null,
          types: card.types || [],
          stage: card.stage || null,
          abilities: card.abilities || [],
          attacks: card.attacks || [],
          retreat: card.retreat || null,
          rarity: card.rarity || null,
          set: card.set?.name || null,
          set_id: card.set?.id || null,
          series: card.set?.serie || null,
          dexId: card.dexId || [],
          illustrator: card.illustrator || null,
          variants: card.variants || null,
          regulationMark: card.regulationMark || null,
        });

        const defaultOriginal = card.image
          ? `${BASE_URL}/original/${card.id}.jpg`
          : null;
        const defaultLowRes = card.image
          ? `${BASE_URL}/low_resolution/${card.id}.jpg`
          : null;
        const defaultCropped = card.image
          ? `${BASE_URL}/cropped/${card.id}.jpg`
          : null;

        newCardRows.push({
          card_id: cardId,
          name: card.name,
          rarity: card.rarity || 'Unknown',
          card_domain_id: '22222222-2222-2222-2222-222222222222',
          image_normal_url: defaultLowRes,
          image_large_url: defaultOriginal,
          image_thumb_url: defaultCropped,
          meta_data: JSON.stringify(meta),
        });
      }

      // Upload image to R2 if missing
      if (card.image) {
        const filename = `${card.id}.jpg`;
        const formats = [
          { prefix: 'original/', field: 'image' },
          { prefix: 'low_resolution/', field: 'image' },
          { prefix: 'cropped/', field: 'image' },
        ];

        for (const { prefix } of formats) {
          const key = prefix.replace('/', '');
          if (!existingFiles[key].has(filename)) {
            missingImageCount++;
            try {
              const imageRes = await fetch(card.image);
              const buffer = await imageRes.arrayBuffer();
              await uploadToR2(prefix, filename, Buffer.from(buffer));
              uploadedImageCount++;
              existingFiles[key].add(filename);
            } catch (e) {
              console.error(
                `Failed to upload ${prefix}${filename}: ${e.message}`
              );
            }
          }
        }

        // Insert image row if missing in DB
        const smallUrl = `${BASE_URL}/low_resolution/${card.id}.jpg`;
        if (!existingImageURLs.has(smallUrl)) {
          newImageRows.push({
            card_image_id: uuidv4(),
            card_id: cardId,
            image_url: `${BASE_URL}/original/${card.id}.jpg`,
            image_url_small: smallUrl,
            image_url_cropped: `${BASE_URL}/cropped/${card.id}.jpg`,
            is_default: true,
            meta_data: JSON.stringify(null),
          });
          existingImageURLs.add(smallUrl);
        }
      }
    }

    console.log(`Processed batch ${i / batchSize + 1}`);
  }

  // --- SUMMARY ---
  console.log(`\nSummary before DB insert:`);
  console.log(`New cards to insert: ${newCardRows.length}`);
  console.log(`New images to insert: ${newImageRows.length}`);
  console.log(`Missing images detected: ${missingImageCount}`);
  console.log(`Images uploaded to R2: ${uploadedImageCount}`);

  // --- DB INSERT ---
  const transaction = await sequelize.transaction();
  try {
    const insertBatch = 500;
    for (let i = 0; i < newCardRows.length; i += insertBatch) {
      const batch = newCardRows.slice(i, i + insertBatch);
      await queryInterface.bulkInsert('cards', batch, { transaction });
    }

    for (let i = 0; i < newImageRows.length; i += insertBatch) {
      const batch = newImageRows.slice(i, i + insertBatch);
      await queryInterface.bulkInsert('card_images', batch, { transaction });
    }

    await transaction.commit();
    console.log('✅ Pokémon cards and images synced successfully.');
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Transaction failed:', err);
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => console.error('Fatal error:', err));
