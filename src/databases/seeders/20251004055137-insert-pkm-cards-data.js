'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const TCGdex = require('@tcgdex/sdk').default;

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
  return results.map(r => r.status === 'fulfilled' ? r.value : null);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const BASE_URL = process.env.R2_URL_PKM;
    if (!BASE_URL) throw new Error('Missing R2_URL in environment.');

    console.log('Using image base URL:', BASE_URL);
    const tcgdex = new TCGdex('en'); // English
    console.log('Fetching Pokémon card summaries from TCGdex...');

    const allResumes = await tcgdex.card.list();
    console.log(`Total cards to fetch: ${allResumes.length}`);

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

        
        const defaultOriginal =  `${BASE_URL}/original/${card.id}.jpg` ;
        const defaultLowRes =  `${BASE_URL}/low_resolution/${card.id}.jpg` ;

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
        const t = await queryInterface.sequelize.transaction();
        try {
          await queryInterface.bulkInsert('cards', cardRows, { transaction: t });
          await queryInterface.bulkInsert('card_images', imageRows, { transaction: t });
          await t.commit();
          console.log(`Inserted batch ${i / batchSize + 1} (${cardRows.length} cards)`);
        } catch (err) {
          await t.rollback();
          console.error(`Failed batch ${i / batchSize + 1}:`, err);
        }
      }
    }

    console.log('All Pokémon cards and images inserted successfully.');
  },

  async down(queryInterface, Sequelize) {
    console.log('Reverting Pokémon card seed...');
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('card_images', null, { transaction });
      await queryInterface.bulkDelete('cards', { card_domain_id: '22222222-2222-2222-2222-222222222222' }, { transaction });
      await transaction.commit();
      console.log('Pokémon card and image data deleted successfully.');
    } catch (err) {
      console.error('Error reverting Pokémon seed:', err);
      await transaction.rollback();
      throw err;
    }
  }
};
