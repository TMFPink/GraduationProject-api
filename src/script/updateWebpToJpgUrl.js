'use strict';

require('dotenv').config();
const { Sequelize, Op } = require('sequelize');
const { Card, CardImage } = require('../models'); // adjust path if needed

const DOMAIN_ID = '33333333-3333-3333-3333-333333333333';

async function convertWebpToJpg() {
  // connect to DB
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // find all CardImages whose card belongs to the given domain and URL ends with .webp
    const images = await CardImage.findAll({
      include: [
        {
          model: Card,
          as: 'card',
          where: { card_domain_id: DOMAIN_ID },
          attributes: [],
        },
      ],
      where: {
        [Op.or]: [
          { image_url: { [Op.iLike]: '%.webp' } },
          { image_url_small: { [Op.iLike]: '%.webp' } },
          { image_url_cropped: { [Op.iLike]: '%.webp' } },
        ],
      },
    });

    console.log(`Found ${images.length} images to update.`);

    // update each image
    for (const img of images) {
      const updatedData = {};

      if (img.image_url?.endsWith('.webp')) {
        updatedData.image_url = img.image_url.replace(/\.webp$/i, '.jpg');
      }
      if (img.image_url_small?.endsWith('.webp')) {
        updatedData.image_url_small = img.image_url_small.replace(
          /\.webp$/i,
          '.jpg'
        );
      }
      if (img.image_url_cropped?.endsWith('.webp')) {
        updatedData.image_url_cropped = img.image_url_cropped.replace(
          /\.webp$/i,
          '.jpg'
        );
      }

      if (Object.keys(updatedData).length > 0) {
        await img.update(updatedData);
        console.log(`Updated CardImage ${img.card_image_id}`);
      }
    }
    // --- after updating CardImage ---

    // Update Card table URLs
    const cardsToUpdate = await Card.findAll({
      where: {
        card_domain_id: DOMAIN_ID,
        [Op.or]: [
          { image_normal_url: { [Op.iLike]: '%.webp' } },
          { image_large_url: { [Op.iLike]: '%.webp' } },
          { image_thumb_url: { [Op.iLike]: '%.webp' } },
        ],
      },
    });

    console.log(`Found ${cardsToUpdate.length} cards to update.`);

    for (const card of cardsToUpdate) {
      const updatedCardData = {};

      if (card.image_normal_url?.endsWith('.webp')) {
        updatedCardData.image_normal_url = card.image_normal_url.replace(
          /\.webp$/i,
          '.jpg'
        );
      }
      if (card.image_large_url?.endsWith('.webp')) {
        updatedCardData.image_large_url = card.image_large_url.replace(
          /\.webp$/i,
          '.jpg'
        );
      }
      if (card.image_thumb_url?.endsWith('.webp')) {
        updatedCardData.image_thumb_url = card.image_thumb_url.replace(
          /\.webp$/i,
          '.jpg'
        );
      }

      if (Object.keys(updatedCardData).length > 0) {
        await card.update(updatedCardData);
        console.log(`Updated Card ${card.card_id}`);
      }
    }

    console.log('All done!');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

convertWebpToJpg();
