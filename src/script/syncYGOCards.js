'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const { Sequelize } = require('sequelize');

/* =========================
   CONFIG
========================= */
const CARD_DOMAIN_ID =
  process.env.CARD_DOMAIN_ID || '11111111-1111-1111-1111-111111111111';
const YGO_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME_YGO;
const BASE_URL = process.env.R2_URL_YGO;

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL');
if (!R2_BUCKET_NAME) throw new Error('Missing R2_BUCKET_NAME_YGO');
if (!BASE_URL) throw new Error('Missing R2_URL_YGO');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

const R2 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

/* =========================
   HELPERS
========================= */

// Normalize names to reduce accidental dupes caused by whitespace/Unicode differences.
function normalizeName(name) {
  return (name || '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// List existing filenames under a prefix in R2 (returns Set of bare filenames, e.g., "123456.jpg")
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
      const key = obj.Key;
      if (key.startsWith(prefix)) {
        existing.add(key.substring(prefix.length)); // keep only "file.jpg"
      }
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : null;
  } while (ContinuationToken);
  return existing;
}

async function uploadToR2(
  prefix,
  filename,
  buffer,
  contentType = 'image/jpeg'
) {
  await R2.putObject({
    Bucket: R2_BUCKET_NAME,
    Key: `${prefix}${filename}`,
    Body: buffer,
    ContentType: contentType,
  }).promise();
}

// Extract trailing numeric id from ".../12345.jpg"
function extractImageIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/(\d+)\.jpg(?:$|\?)/i);
  return m ? m[1] : null;
}

/* =========================
   MAIN
========================= */

async function main() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected.');

  const queryInterface = sequelize.getQueryInterface();

  // 1) Load existing cards for the target domain and build name->card_id map.
  console.log('Loading existing cards (scoped by domain)...');
  const [cards] = await sequelize.query(
    `
    SELECT card_id, name
    FROM cards
    WHERE card_domain_id = :domain
    `,
    { replacements: { domain: CARD_DOMAIN_ID } }
  );

  const nameToCardId = new Map(
    cards.map((c) => [normalizeName(c.name), c.card_id])
  );
  console.log(`Found ${nameToCardId.size} cards in domain ${CARD_DOMAIN_ID}.`);

  // 2) Load existing card_images and build a Set of known YGO image ids to avoid duplicates.
  console.log('Loading existing card_images to dedupe by image id...');
  const [existingImages] = await sequelize.query(
    `SELECT image_url_small FROM card_images`
  );

  const existingImageIds = new Set(
    existingImages
      .map((r) => extractImageIdFromUrl(r.image_url_small))
      .filter(Boolean)
  );
  console.log(`Known image ids in DB: ${existingImageIds.size}`);

  // 3) Enumerate existing files on R2 to avoid re-upload.
  console.log('Scanning R2 buckets for existing files...');
  const existingFiles = {
    original: await getExistingImageFilenames('original/'),
    low_resolution: await getExistingImageFilenames('low_resolution/'),
    cropped: await getExistingImageFilenames('cropped/'),
  };
  console.log(`R2 files:
  - original/: ${existingFiles.original.size}
  - low_resolution/: ${existingFiles.low_resolution.size}
  - cropped/: ${existingFiles.cropped.size}`);

  // 4) Fetch YGO API data
  console.log('Fetching YGOProDeck API data...');
  const res = await fetch(YGO_API_URL);
  if (!res.ok) {
    throw new Error(`YGO API error: ${res.status} ${await res.text()}`);
  }
  const { data } = await res.json();
  console.log(`Fetched ${data.length} cards from YGO API.`);

  // 5) Build image rows to insert (images-only). Upload missing R2 files on the fly.
  const newImageRows = [];
  let missingImageCount = 0;
  let uploadedImageCount = 0;
  let skippedNoCard = 0;

  for (const card of data) {
    const cardId = nameToCardId.get(normalizeName(card.name));
    if (!cardId) {
      // Card does not exist in this domain; we do NOT create it (images-only mode).
      skippedNoCard++;
      continue;
    }

    for (const [index, img] of (card.card_images || []).entries()) {
      // URLs from YGO
      const urlOriginal = img.image_url; // big
      const urlLowRes = img.image_url_small; // small
      const urlCropped = img.image_url_cropped; // cropped

      // Parse a stable imageId (YGO numeric id)
      const imageId = String(
        img.id ||
          extractImageIdFromUrl(urlOriginal) ||
          extractImageIdFromUrl(urlLowRes)
      );
      if (!imageId) continue;

      const fileName = `${imageId}.jpg`;

      // Skip if DB already has this image id (dedupe)
      if (existingImageIds.has(imageId)) continue;

      // Ensure files exist on R2 (original / low_resolution / cropped)
      const targets = [
        {
          prefix: 'original/',
          exists: existingFiles.original,
          source: urlOriginal,
        },
        {
          prefix: 'low_resolution/',
          exists: existingFiles.low_resolution,
          source: urlLowRes,
        },
        {
          prefix: 'cropped/',
          exists: existingFiles.cropped,
          source: urlCropped,
        },
      ];

      for (const t of targets) {
        if (!t.source) continue;
        if (!t.exists.has(fileName)) {
          try {
            missingImageCount++;
            const r = await fetch(t.source);
            if (!r.ok) throw new Error(`${r.status} fetching ${t.source}`);
            const buf = Buffer.from(await r.arrayBuffer());
            await uploadToR2(t.prefix, fileName, buf, 'image/jpeg');
            t.exists.add(fileName);
            uploadedImageCount++;
            console.log(`Uploaded ${t.prefix}${fileName}`);
          } catch (e) {
            console.error(
              `Failed to upload ${t.prefix}${fileName}: ${e.message}`
            );
          }
        }
      }

      // Compose URLs pointing to your R2 (these are what you store in DB)
      const dbOriginal = `${BASE_URL}/original/${fileName}`;
      const dbLowRes = `${BASE_URL}/low_resolution/${fileName}`;
      const dbCropped = `${BASE_URL}/cropped/${fileName}`;

      newImageRows.push({
        card_image_id: uuidv4(),
        card_id: cardId,
        image_url: dbLowRes, // keep as-is per your schema
        image_url_small: dbOriginal, // used as the “dedupe” URL historically
        image_url_cropped: dbCropped,
        is_default: index === 0,
        meta_data: JSON.stringify(null),
      });

      // Mark this imageId as seen so we don't add it again in this run
      existingImageIds.add(imageId);
    }
  }

  // 6) Summary
  console.log('\nSummary before DB insert:');
  console.log(`Images to insert: ${newImageRows.length}`);
  console.log(
    `Images uploaded to R2: ${uploadedImageCount} (out of ${missingImageCount} missing)`
  );
  console.log(`Cards skipped (not found in domain): ${skippedNoCard}`);

  // 7) Insert images only
  if (newImageRows.length > 0) {
    const transaction = await sequelize.transaction();
    try {
      console.log('\nInserting new card images...');
      const batchSize = 1000;
      for (let i = 0; i < newImageRows.length; i += batchSize) {
        const batch = newImageRows.slice(i, i + batchSize);
        await queryInterface.bulkInsert('card_images', batch, { transaction });
        console.log(`Inserted images ${i}–${i + batch.length}`);
      }
      await transaction.commit();
      console.log('\n✅ Image sync complete (images-only).');
    } catch (err) {
      await transaction.rollback();
      console.error('❌ Transaction failed:', err);
    }
  } else {
    console.log('\nNothing to insert. ✅');
  }
}

main()
  .catch((err) => console.error('Fatal error:', err))
  .finally(async () => {
    try {
      await sequelize.close();
    } catch {}
  });
