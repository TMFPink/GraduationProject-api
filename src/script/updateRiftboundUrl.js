'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');

/* =========================
   CONFIG
========================= */

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

// const OLD_PREFIX = 'https://cdn.piltoverarchive.com/cards/';
const OLD_PREFIX = 'https://piltoverarchive.b-cdn.net';
const NEW_BASE_URL = 'https://pub-ef0327a951934d57b2be778acb1d95b7.r2.dev';

/* =========================
   HELPERS
========================= */

function convertUrl(oldUrl, type = 'original') {
  if (!oldUrl || !oldUrl.startsWith(OLD_PREFIX)) return oldUrl;
  const key = oldUrl.slice(OLD_PREFIX.length); // get <key>
  let folder = 'original';
  if (type === 'small') folder = 'low_resolution';
  else if (type === 'cropped') folder = 'cropped';

  let newUrl = `${NEW_BASE_URL}/${folder}/${key}`;

  // Convert .webp to .jpg if present
  if (newUrl.endsWith('.webp')) {
    newUrl = newUrl.replace(/\.webp$/i, '.jpg');
  }

  return newUrl;
}

/* =========================
   MAIN
========================= */

async function main() {
  console.log('Connecting to DB...');
  await sequelize.authenticate();
  console.log('Connected.');

  const queryInterface = sequelize.getQueryInterface();

  console.log('Fetching card images from DB...');
  const [rows] = await sequelize.query(`
    SELECT card_id,image_normal_url, image_large_url, image_thumb_url
    FROM cards
    WHERE image_normal_url LIKE '${OLD_PREFIX}%' 
       OR image_large_url LIKE '${OLD_PREFIX}%'
       OR image_thumb_url LIKE '${OLD_PREFIX}%';
  `);

  console.log(`Found ${rows.length} rows to update.`);

  for (const row of rows) {
    const { card_id, image_normal_url, image_large_url, image_thumb_url } = row;

    const newImageUrl = convertUrl(image_normal_url, 'original');
    const newImageUrlSmall = convertUrl(image_large_url, 'small');
    const newImageUrlCropped = convertUrl(image_thumb_url, 'cropped');

    await queryInterface.bulkUpdate(
      'cards',
      {
        image_normal_url: newImageUrl,
        image_large_url: newImageUrlSmall,
        image_thumb_url: newImageUrlCropped,
      },
      { card_id }
    );

    console.log(`Updated card_id: ${card_id}`);
  }

  console.log('✅ All done!');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
