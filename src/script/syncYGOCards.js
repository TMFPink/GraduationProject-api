'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const { Sequelize } = require('sequelize');

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
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME_YGO;
const BASE_URL = process.env.R2_URL_YGO;

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

  console.log('Fetching YGOProDeck API data...');
  const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
  const { data } = await res.json();
  console.log(`\n\nFetched ${data.length} cards from YGO API.`);

  console.log('Checking existing R2 image files...');
  const existingFiles = {
    original: await getExistingImageFilenames('original/'),
    low_resolution: await getExistingImageFilenames('low_resolution/'),
    cropped: await getExistingImageFilenames('cropped/'),
  };
  console.log(`Fetched R2 image file list:
  - Original: ${existingFiles.original.size}
  - Low resolution: ${existingFiles.low_resolution.size}`);

  const newCardRows = [];
  const newImageRows = [];
  let missingImageCount = 0;
  let uploadedImageCount = 0;

  // --- SCAN ALL CARDS ---
  for (const card of data) {
    const existingCardId = cardNameToId.get(card.name);
    const cardId = existingCardId || uuidv4();

    // Insert new card if missing
    if (!existingCardId) {
      const meta = cleanJSON({
        type: card.type,
        desc: card.desc,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        archetype: card.archetype,
        sets: card.card_sets || [],
      });

      const firstImg = (card.card_images && card.card_images[0]) || null;
      const defaultOriginal = firstImg
        ? `${BASE_URL}/original/${firstImg.id}.jpg`
        : null;
      const defaultLowRes = firstImg
        ? `${BASE_URL}/low_resolution/${firstImg.id}.jpg`
        : null;
      const defaultCropped = firstImg
        ? `${BASE_URL}/cropped/${firstImg.id}.jpg`
        : null;

      newCardRows.push({
        card_id: cardId,
        name: card.name,
        rarity: card.card_sets?.[0]?.set_rarity || 'Unknown',
        card_domain_id: '11111111-1111-1111-1111-111111111111',
        image_normal_url: defaultLowRes,
        image_large_url: defaultOriginal,
        image_thumb_url: defaultCropped,
        meta_data: JSON.stringify(meta),
      });
    }

    // Check and upload missing images in R2
    for (const [index, img] of (card.card_images || []).entries()) {
      const filename = `${img.id}.jpg`;
      const formats = [
        { prefix: 'original/', field: 'image_url' },
        { prefix: 'low_resolution/', field: 'image_url_small' },
      ];

      for (const { prefix, field } of formats) {
        const key = prefix.replace('/', '');
        if (!existingFiles[key].has(filename)) {
          missingImageCount++;
          try {
            const ygoUrl = img[field];
            const imageRes = await fetch(ygoUrl);
            const buffer = await imageRes.arrayBuffer();
            await uploadToR2(prefix, filename, Buffer.from(buffer));
            uploadedImageCount++;
            console.log(`Uploaded missing ${prefix}${filename}`);
            existingFiles[key].add(filename);
          } catch (e) {
            console.error(
              `Failed to upload ${prefix}${filename}: ${e.message}`
            );
          }
        }
      }

      // Insert image row if not in DB
      const smallUrl = `${BASE_URL}/original/${img.id}.jpg`;
      if (!existingImageURLs.has(smallUrl)) {
        newImageRows.push({
          card_image_id: uuidv4(),
          card_id: cardId,
          image_url: `${BASE_URL}/low_resolution/${img.id}.jpg`,
          image_url_small: smallUrl,
          image_url_cropped: `${BASE_URL}/cropped/${img.id}.jpg`,
          is_default: index === 0,
          meta_data: JSON.stringify(null),
        });
        existingImageURLs.add(smallUrl);
      }
    }
  }

  // --- SUMMARY BEFORE DB INSERT ---
  console.log(`\nSummary before DB insert:`);
  console.log(`New cards to insert: ${newCardRows.length}`);
  console.log(`New images to insert: ${newImageRows.length}`);
  console.log(`Missing images detected: ${missingImageCount}`);
  console.log(`Images successfully uploaded to R2: ${uploadedImageCount}`);

  // --- DB INSERT ---
  const transaction = await sequelize.transaction();
  try {
    const batchSize = 1000;

    if (newCardRows.length > 0) {
      console.log('\nInserting new cards...');
      for (let i = 0; i < newCardRows.length; i += batchSize) {
        const batch = newCardRows.slice(i, i + batchSize);
        await queryInterface.bulkInsert('cards', batch, { transaction });
        console.log(`Inserted cards ${i}–${i + batch.length}`);
      }
    }

    if (newImageRows.length > 0) {
      console.log('\nInserting new card images...');
      for (let i = 0; i < newImageRows.length; i += batchSize) {
        const batch = newImageRows.slice(i, i + batchSize);
        await queryInterface.bulkInsert('card_images', batch, { transaction });
        console.log(`Inserted images ${i}–${i + batch.length}`);
      }
    }

    await transaction.commit();
    console.log('\n✅ Sync complete.');
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Transaction failed:', err);
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
});
