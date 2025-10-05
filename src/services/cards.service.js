'use strict';

const db = require('../models');
const { BadRequestError } = require('../core/error.response');
const { Op } = require('sequelize');

class CardService {
  /**
   * Get all cards with pagination and optional search.
   * @param {Object} query - includes page, limit, search
   */
  static get_all = async ({ domain = 'ygo', page = 1, limit = 20, search }) => {
    const where = {};

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (domain == 'ygo') {
      where.card_domain_id = '11111111-1111-1111-1111-111111111111';
    } else if (domain == 'pkm') {
      where.card_domain_id = '22222222-2222-2222-2222-222222222222';
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await db.Card.findAndCountAll({
      where,
      limit,
      offset,
      order: [['name', 'ASC']],
      attributes: [
        'card_id',
        'name',
        'rarity',
        'image_normal_url',
        'image_large_url',
        'image_thumb_url',
      ],

      distinct: true,
    });

    return {
      total: count,
      page,
      limit,
      cards: rows,
    };
  };

  /**
   * Get card by ID, including all images and metadata.
   * @param {string} card_id
   */
  static get_by_id = async (card_id) => {
    const card = await db.Card.findOne({
      where: { card_id },
      include: [
        {
          model: db.CardImage,
          as: 'images',
          attributes: [
            'card_image_id',
            'image_url',
            'image_url_small',
            'image_url_cropped',
            'is_default',
          ],
        },
      ],
    });

    if (!card) throw new BadRequestError('Card not found');
    return card;
  };

  /**
   * Get cards by archetype or race
   */
  static get_by_filter = async ({ archetype, race }) => {
    const where = {};
    if (archetype) where['meta_data.archetype'] = archetype;
    if (race) where['meta_data.race'] = race;

    const cards = await db.Card.findAll({
      where,
      limit: 100,
      attributes: ['card_id', 'name', 'image_thumb_url'],
      raw: true,
    });

    return cards;
  };
}

module.exports = CardService;
