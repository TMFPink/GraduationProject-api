'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
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

// Helper to clean undefined
function cleanJSON(obj) {
  if (Array.isArray(obj)) return obj.map(cleanJSON);
  if (obj && typeof obj === 'object')
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, cleanJSON(v)])
    );
  return obj === undefined ? null : obj;
}

// Fetch full cards with concurrency limit
async function fetchFullCards(batch, tcgdex) {
  const results = await Promise.allSettled(
    batch.map(async (resume) => {
      try {
        const card = await tcgdex.card.get(resume.id);
        return card ? { resume, card } : null;
      } catch (err) {
        console.warn(`Failed to fetch card ${resume.id}:`, err.message);
        return null;
      }
    })
  );
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}

async function main() {
  const BASE_URL = process.env.R2_URL_PKM;
  if (!BASE_URL) throw new Error('Missing R2_URL_PKM in environment.');

  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected to database.');

  console.log('Using image base URL:', BASE_URL);
  const tcgdex = new TCGdex('en'); // English
  console.log('Fetching Pokémon card summaries from TCGdex...');

  const allResumes = await tcgdex.card.list();
  console.log(`Total cards to fetch: ${allResumes.length}`);

  const pkmCardDomainId = '22222222-2222-2222-2222-222222222222';
  console.log('Clearing existing PKM cards from database...');

  // First delete card images related to PKM cards
  await queryInterface.sequelize.query(
    `DELETE FROM card_images WHERE card_id IN (SELECT card_id FROM cards WHERE card_domain_id = :domainId)`,
    {
      replacements: { domainId: pkmCardDomainId },
      transaction,
    }
  );

  // Then delete the PKM cards themselves
  const [results] = await queryInterface.sequelize.query(
    `DELETE FROM cards WHERE card_domain_id = :domainId`,
    {
      replacements: { domainId: pkmCardDomainId },
      transaction,
    }
  );

  console.log(
    `Cleared ${results.rowCount || 0} existing YGO cards and their images`
  );

  const queryInterface = sequelize.getQueryInterface();
  let totalCardsInserted = 0;
  let totalImagesInserted = 0;

  const batchSize = 50; // number of cards to fetch concurrently
  for (let i = 0; i < allResumes.length; i += batchSize) {
    const batch = allResumes.slice(i, i + batchSize);
    const fullCards = await fetchFullCards(batch, tcgdex);

    const cardRows = [];
    const imageRows = [];

    for (const item of fullCards) {
      if (!item || !item.card) continue;
      const { resume, card } = item;
      const cardId = uuidv4();

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

      const defaultOriginal = `${BASE_URL}/original/${card.id}.jpg`;
      const defaultLowRes = `${BASE_URL}/low_resolution/${card.id}.jpg`;

      cardRows.push({
        card_id: cardId,
        name: card.name,
        rarity: card.rarity || 'Unknown',
        card_domain_id: '22222222-2222-2222-2222-222222222222',
        image_normal_url: defaultLowRes,
        image_large_url: defaultOriginal,
        image_thumb_url: defaultLowRes,
        meta_data: JSON.stringify(meta),
      });

      if (defaultLowRes || defaultOriginal) {
        imageRows.push({
          card_image_id: uuidv4(),
          card_id: cardId,
          image_url: defaultOriginal,
          image_url_small: defaultLowRes,
          image_url_cropped: defaultLowRes,
          is_default: true,
          meta_data: JSON.stringify(null),
        });
      }
    }

    // Insert this batch immediately
    if (cardRows.length) {
      const t = await sequelize.transaction();
      try {
        await queryInterface.bulkInsert('cards', cardRows, { transaction: t });
        await queryInterface.bulkInsert('card_images', imageRows, {
          transaction: t,
        });
        await t.commit();

        totalCardsInserted += cardRows.length;
        totalImagesInserted += imageRows.length;

        console.log(
          `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allResumes.length / batchSize)} (${cardRows.length} cards, ${imageRows.length} images)`
        );
      } catch (err) {
        await t.rollback();
        console.error(
          `❌ Failed batch ${Math.floor(i / batchSize) + 1}:`,
          err.message
        );
      }
    }
  }

  console.log(`\n✅ All Pokémon cards insertion completed!`);
  console.log(`Total cards inserted: ${totalCardsInserted}`);
  console.log(`Total images inserted: ${totalImagesInserted}`);

  await sequelize.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
