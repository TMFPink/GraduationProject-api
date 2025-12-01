'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');

// --- CONFIG ---
const RIFT_DOMAIN_ID = '33333333-3333-3333-3333-333333333333'; // user provided
const INPUT_FILE = process.env.RIFT_INPUT_FILE || 'riftbound-response.json';
const BASE_URL = process.env.R2_URL_RIFT || null;
const MAX_META_BYTES = 10000; // safety cap for meta_data JSON length (tune if needed)

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

const queryInterface = sequelize.getQueryInterface();

// Helper - recursively convert undefined -> null
function cleanJSON(obj) {
  if (Array.isArray(obj)) return obj.map(cleanJSON);
  if (obj && typeof obj === 'object')
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, cleanJSON(v)])
    );
  return obj === undefined ? null : obj;
}

// Safe stringify + truncation guard
function safeStringify(obj, maxBytes = MAX_META_BYTES) {
  try {
    const s = JSON.stringify(obj);
    if (Buffer.byteLength(s, 'utf8') <= maxBytes) return s;
    // If too big, attempt to shrink by removing large nested fields
    const slim = { ...obj };
    if (slim.raw) delete slim.raw;
    if (slim.description && slim.description.length > 1000) {
      slim.description = slim.description.slice(0, 997) + '...';
    }
    let s2 = JSON.stringify(slim);
    if (Buffer.byteLength(s2, 'utf8') <= maxBytes) return s2;
    // Last resort: keep only top-level ids and names
    const minimal = {
      source_id: obj.source_id || null,
      name: obj.name || null,
      type: obj.type || null,
      variants_count: obj.variants_count || 0,
    };
    return JSON.stringify(minimal);
  } catch (err) {
    // Fallback minimal JSON on any error
    return JSON.stringify({
      name: obj?.name || null,
      source_id: obj?.source_id || null,
    });
  }
}

// Read and normalize JSON file content (support a few wrapper shapes)
function loadInput(filePath) {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
  let parsed = JSON.parse(raw);

  // The file begins with:
  // [
  //   { result: { data: { json: [ ... cards ... ] } } },
  //   { result: { data: { json: [ ... cards ... ] } } }
  // ]
  // So parsed is ALWAYS an array of pages.

  if (!Array.isArray(parsed)) {
    throw new Error('Root JSON MUST be an array of pages.');
  }

  // Flatten all pages → each page contains "result.data.json"
  const allCards = [];

  for (const page of parsed) {
    const cards = page?.result?.data?.json;
    if (Array.isArray(cards)) {
      allCards.push(...cards);
    } else {
      console.warn('Skipped malformed page:', page);
    }
  }

  return allCards;
}

async function main() {
  console.log('Starting Riftbound import...');
  if (!BASE_URL) {
    console.log(
      'Warning: R2_URL_RIFT not set. The script will prefer variant-provided image URLs when available.'
    );
  } else {
    console.log('Using image base URL:', BASE_URL);
  }

  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected.');

  // Load input JSON
  const cardsRaw = loadInput(INPUT_FILE);
  console.log(`Loaded ${cardsRaw.length} card objects from ${INPUT_FILE}`);

  // Normalize
  const cardsNormalized = cardsRaw.map(cleanJSON);

  // --- Clear existing Riftbound cards and images ---
  console.log('Clearing existing Riftbound cards and images from DB...');
  const tDel = await sequelize.transaction();
  try {
    await queryInterface.sequelize.query(
      `DELETE FROM card_images WHERE card_id IN (SELECT card_id FROM cards WHERE card_domain_id = :domainId)`,
      {
        replacements: { domainId: RIFT_DOMAIN_ID },
        transaction: tDel,
      }
    );

    const [delResult] = await queryInterface.sequelize.query(
      `DELETE FROM cards WHERE card_domain_id = :domainId`,
      { replacements: { domainId: RIFT_DOMAIN_ID }, transaction: tDel }
    );

    await tDel.commit();
    console.log(
      `Cleared Riftbound cards/images. (deleted rows info: ${JSON.stringify(
        delResult || {}
      )})`
    );
  } catch (err) {
    await tDel.rollback();
    console.error('Failed to clear existing Riftbound data:', err);
    throw err;
  }

  // Prepare rows
  const cardRows = [];
  const imageRows = [];

  for (const c of cardsNormalized) {
    try {
      const cardId = uuidv4();

      // Build compact variants summary (avoid embedding huge objects)
      const variantsSummary = (c.cardVariants || []).map((v) => ({
        id: v.id || v.variantNumber || null,
        variantNumber: v.variantNumber || null,
        rarity: v.rarity || null,
        imageUrl: v.imageUrl || null,
        setName: v.set?.name || v.setId || null,
        releaseDate: v.releaseDate || null,
      }));

      // Build meta (no full raw object)
      const meta = {
        source_id: c.id || null,
        name: c.name || null,
        type: c.type || null,
        super: c.super || null,
        description:
          typeof c.description === 'string'
            ? c.description.slice(0, 2000)
            : c.description || null,
        energy: c.energy ?? null,
        might: c.might ?? null,
        power: c.power ?? null,
        tags: Array.isArray(c.tags) ? c.tags : [],
        colors: (c.cardColors || []).map((cc) => ({
          colorId: cc?.colorId || cc?.color?.id || null,
          name: cc?.color?.name || null,
          hexCode: cc?.color?.hexCode || null,
        })),
        variants_count: variantsSummary.length,
        variants_summary: variantsSummary,
        // don't include c (the whole object)
      };

      // Primary image decision
      let primaryImage = null;
      if (variantsSummary.length && variantsSummary[0].imageUrl) {
        primaryImage = variantsSummary[0].imageUrl;
      } else if (BASE_URL && c.id) {
        primaryImage = `${BASE_URL}/original/${c.id}.jpg`;
      }

      cardRows.push({
        card_id: cardId,
        name: c.name || null,
        rarity:
          (Array.isArray(c.cardVariants) && c.cardVariants[0]?.rarity) ||
          'Unknown',
        card_domain_id: RIFT_DOMAIN_ID,
        image_normal_url: primaryImage,
        image_large_url: primaryImage,
        image_thumb_url: primaryImage,
        meta_data: safeStringify(meta),
      });

      // Create card_images from variants (if any)
      if (Array.isArray(c.cardVariants)) {
        for (const [idx, v] of c.cardVariants.entries()) {
          const srcId = v.id || v.variantNumber || null;
          let imageUrl = v.imageUrl || null;
          if (!imageUrl && BASE_URL && srcId) {
            imageUrl = `${BASE_URL}/original/${srcId}.jpg`;
          }
          const imageUrlSmall =
            v.imageUrlSmall ||
            imageUrl ||
            (BASE_URL && srcId
              ? `${BASE_URL}/low_resolution/${srcId}.jpg`
              : null);
          const imageUrlCropped =
            v.imageUrlCropped || imageUrlSmall || imageUrl || null;

          imageRows.push({
            card_image_id: uuidv4(),
            card_id: cardId,
            source_image_id: srcId,
            image_url: imageUrl,
            image_url_small: imageUrlSmall,
            image_url_cropped: imageUrlCropped,
            is_default: idx === 0,
            meta_data: safeStringify({
              variant_id: v.id || null,
              variant_number: v.variantNumber || null,
              rarity: v.rarity || null,
              set: v.set?.name || v.setId || null,
              releaseDate: v.releaseDate || null,
            }),
          });
        }
      }
    } catch (err) {
      console.warn('Skipping a card due to processing error:', err.message);
      continue;
    }
  }

  console.log(
    `Prepared ${cardRows.length} cards and ${imageRows.length} images for insertion.`
  );

  // Bulk insert in batches
  const batchSize = 500; // tuneable
  let totalCardsInserted = 0;
  let totalImagesInserted = 0;

  for (let i = 0; i < cardRows.length; i += batchSize) {
    const batch = cardRows.slice(i, i + batchSize);
    const t = await sequelize.transaction();
    try {
      await queryInterface.bulkInsert('cards', batch, { transaction: t });

      // images for this batch
      const batchCardIds = batch.map((r) => r.card_id);
      const imagesForBatch = imageRows.filter((ir) =>
        batchCardIds.includes(ir.card_id)
      );

      if (imagesForBatch.length) {
        for (let j = 0; j < imagesForBatch.length; j += batchSize) {
          const imgChunk = imagesForBatch.slice(j, j + batchSize);
          await queryInterface.bulkInsert('card_images', imgChunk, {
            transaction: t,
          });
        }
      }

      await t.commit();
      totalCardsInserted += batch.length;
      totalImagesInserted += imagesForBatch.length;
      console.log(
        `Inserted cards batch ${Math.floor(i / batchSize) + 1} (${batch.length} cards, ${imagesForBatch.length} images)`
      );
    } catch (err) {
      await t.rollback();
      console.error(
        `Failed to insert cards batch ${Math.floor(i / batchSize) + 1}:`,
        err.message
      );
    }
  }

  console.log('\n✅ Riftbound import complete!');
  console.log(`Total cards inserted: ${totalCardsInserted}`);
  console.log(`Total images inserted: ${totalImagesInserted}`);

  await sequelize.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Fatal error during import:', err);
  try {
    await sequelize.close();
  } catch (_) {}
  process.exit(1);
});
