'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const sharp = require('sharp');
const { Sequelize } = require('sequelize');
const path = require('path');
const pLimit = require('p-limit');

/* =========================
   CONFIG
========================= */

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL');
if (!process.env.R2_BUCKET_NAME_RB) throw new Error('Missing R2_BUCKET_NAME');
if (!process.env.R2_URL_RB) throw new Error('Missing R2_URL_RB');

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME_RB;
const R2_BASE_URL = process.env.R2_URL_RB;
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

function extractFilename(url) {
  if (!url) return null;
  return url.split('/').pop().replace(/\?.*$/, '');
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

async function processImage(row, index) {
  const { image_url, image_url_small, image_url_cropped } = row;

  // Pick source URL (prefer original → small → cropped)
  const sourceUrl = image_url || image_url_small || image_url_cropped;
  if (!sourceUrl) return;

  const filename = extractFilename(sourceUrl);
  if (!filename) return;

  const newFilename = filename.replace(path.extname(filename), '.jpg');

  try {
    console.log(`[${index}] Downloading ${sourceUrl}`);
    const resp = await fetch(sourceUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const buffer = Buffer.from(await resp.arrayBuffer());

    // Convert to JPG
    const original = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

    // Low resolution
    const lowRes = await sharp(original)
      .resize({ width: 300 })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Cropped
    const cropped = await sharp(original)
      .resize(300, 420, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload
    await Promise.all([
      uploadToR2('original/', newFilename, original),
      uploadToR2('low_resolution/', newFilename, lowRes),
      uploadToR2('cropped/', newFilename, cropped),
    ]);

    console.log(`✅ Uploaded ${newFilename}`);
  } catch (err) {
    console.error(`❌ Error processing ${sourceUrl}:`, err.message);
  }
}

/* =========================
   MAIN
========================= */

async function main() {
  console.log('Connecting to DB...');
  await sequelize.authenticate();
  console.log('Connected.');

  // Fetch images matching the target prefix
  const [rows] = await sequelize.query(`
    SELECT card_image_id, image_url, image_url_small, image_url_cropped
    FROM card_images
    WHERE 

            (image_url     LIKE 'https://piltoverarchive.b-cdn.net%')
    OR (image_url_small LIKE 'https://piltoverarchive.b-cdn.net%')
    OR (image_url_cropped LIKE 'https://piltoverarchive.b-cdn.net%');
  `);
  // (image_url     LIKE 'https://cdn.piltoverarchive.com/cards%')
  // OR (image_url_small LIKE 'https://cdn.piltoverarchive.com/cards%')
  // OR (image_url_cropped LIKE 'https://cdn.piltoverarchive.com/cards%');

  console.log(`Found ${rows.length} images.`);

  const limit = pLimit(5); // Max 5 concurrent image processes
  const tasks = rows.map((row, i) => limit(() => processImage(row, i)));

  await Promise.all(tasks);

  console.log('\n=== ALL DONE ===');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
