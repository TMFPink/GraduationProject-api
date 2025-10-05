'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Recursively replace undefined with null
function cleanJSON(obj) {
  if (Array.isArray(obj)) return obj.map(cleanJSON);
  if (obj && typeof obj === 'object')
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, cleanJSON(v)])
    );
  return obj === undefined ? null : obj;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const BASE_URL = process.env.R2_URL_YGO;
    if (!BASE_URL) throw new Error('Missing R2_URL in environment.');

    console.log('Using image base URL:', BASE_URL);

    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('Fetching card data from YGOProDeck API...');
      const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
      const { data } = await res.json();

      console.log(`Fetched ${data.length} cards from API`);
      const cardRows = [];
      const imageRows = [];

      for (const card of data) {

        const cardId = uuidv4();

        const meta = cleanJSON({
          type: card.type,
          desc: card.desc,
          atk: card.atk,
          def: card.def,
          level: card.level,
          race: card.race,
          attribute: card.attribute,
          archetype: card.archetype,
          sets: card.card_sets || []
        });

        const firstImg = (card.card_images && card.card_images[0]) || null;
        const defaultOriginal = firstImg ? `${BASE_URL}/original/${firstImg.id}.jpg` : null;
        const defaultLowRes = firstImg ? `${BASE_URL}/low_resolution/${firstImg.id}.jpg` : null;
        const defaultCropped = firstImg ? `${BASE_URL}/cropped/${firstImg.id}.jpg` : null;

        cardRows.push({
          card_id: cardId,
          name: card.name,
          rarity: card.card_sets?.[0]?.set_rarity || 'Unknown',
          card_domain_id: '11111111-1111-1111-1111-111111111111',
          image_normal_url: defaultLowRes,
          image_large_url: defaultOriginal,
          image_thumb_url: defaultCropped,
          meta_data: JSON.stringify(meta),
        });

        for (const [index, img] of (card.card_images || []).entries()) {
          imageRows.push({
            card_image_id: uuidv4(),
            card_id: cardId,
            image_url: `${BASE_URL}/low_resolution/${img.id}.jpg`,
            image_url_small: `${BASE_URL}/original/${img.id}.jpg`,
            image_url_cropped: `${BASE_URL}/cropped/${img.id}.jpg`,
            is_default: index === 0,
            meta_data: JSON.stringify(null),
          });
        }
      }

      console.log(`Prepared ${cardRows.length} cards and ${imageRows.length} images`);
      console.log('Inserting into database...');

      const batchSize = 1000;

      console.log('Inserting cards...');
      for (let i = 0; i < cardRows.length; i += batchSize) {
        const batch = cardRows.slice(i, i + batchSize);
        
        await queryInterface.bulkInsert('cards', batch, { transaction });
      }

      console.log('Inserting card images...');
      for (let i = 0; i < imageRows.length; i += batchSize) {
        const batch = imageRows.slice(i, i + batchSize);        
      }

      await transaction.commit();
      console.log('All cards and images inserted successfully.');
    } catch (err) {
      console.error('Error during seeding:', err);
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('Reverting YGO seeded cards and images...');
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // await queryInterface.bulkDelete('cards',null, { transaction });
      await queryInterface.bulkDelete('card_images', null, { transaction });
      await queryInterface.bulkDelete('cards', {
        card_domain_id: '11111111-1111-1111-1111-111111111111'
      }, { transaction });
      await transaction.commit();
      console.log('All card and image data deleted successfully.');
    } catch (err) {
      console.error('Error reverting seed:', err);
      await transaction.rollback();
      throw err;
    }
  }
};
