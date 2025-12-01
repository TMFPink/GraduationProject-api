'use strict';

const db = require('../models');
const { BadRequestError } = require('../core/error.response');
const { Op, Sequelize } = require('sequelize');

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
    } else if (domain === 'rb') {
      where.card_domain_id = '33333333-3333-3333-3333-333333333333';
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
   * Get cards by specific JSON meta field.
   * @example
   * key=attribute&value=Dark&domain=ygo
   * key=hp&value=120&domain=pkm
   */
  static get_by_meta = async (query) => {
    const { domain = 'ygo', page = 1, limit = 20, ...filters } = query;

    const where = {};

    // Handle domain
    if (domain === 'ygo') {
      where.card_domain_id = '11111111-1111-1111-1111-111111111111';
    } else if (domain === 'pkm') {
      where.card_domain_id = '22222222-2222-2222-2222-222222222222';
    } else if (domain === 'rb') {
      where.card_domain_id = '33333333-3333-3333-3333-333333333333';
    }

    // Build meta filters dynamically
    const metaConditions = Object.entries(filters)
      .filter(
        ([key]) => !['domain', 'page', 'limit', 'key', 'value'].includes(key)
      )
      .map(([key, value]) => {
        if (key === 'name') {
          // Special case for "name"
          return { name: { [Op.iLike]: `%${value}%` } };
        }
        return Sequelize.where(Sequelize.json(`meta_data.${key}`), {
          [Op.iLike]: `%${value}%`,
        });
      });

    const offset = (page - 1) * limit;

    const { count, rows } = await db.Card.findAndCountAll({
      where: {
        ...where,
        [Op.and]: metaConditions,
      },
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
        'meta_data',
      ],
      distinct: true,
    });

    // Remove "sets" key from meta_data in each card
    const cardsWithFilteredMeta = rows.map((card) => {
      const cardData = card.toJSON();
      if (cardData.meta_data && cardData.meta_data.sets) {
        const { sets, ...filteredMetaData } = cardData.meta_data;
        cardData.meta_data = filteredMetaData;
      }
      return cardData;
    });

    return {
      total: count,
      page: Number(page),
      limit: Number(limit),
      filters: { ...filters },
      cards: cardsWithFilteredMeta,
    };
  };

  /**
   * Get cards by array of names
   * @param {Array} names - array of card names to search for
   * @param {string} domain - 'ygo' or 'pkm'
   */
  static get_by_names = async (names, domain = 'ygo') => {
    if (!names || !Array.isArray(names) || names.length === 0) {
      return { cards: [] };
    }

    const where = {
      name: {
        [Op.or]: names.map((name) => ({ [Op.iLike]: `%${name.trim()}%` })),
      },
    };

    if (domain === 'ygo') {
      where.card_domain_id = '11111111-1111-1111-1111-111111111111';
    } else if (domain === 'pkm') {
      where.card_domain_id = '22222222-2222-2222-2222-222222222222';
    } else if (domain === 'rb') {
      where.card_domain_id = '33333333-3333-3333-3333-333333333333';
    }

    const cards = await db.Card.findAll({
      where,
      attributes: [
        'card_id',
        'name',
        'rarity',
        'image_normal_url',
        'image_large_url',
        'image_thumb_url',
      ],
      order: [['name', 'ASC']],
    });

    return {
      cards,
      total: cards.length,
    };
  };
}

module.exports = CardService;
