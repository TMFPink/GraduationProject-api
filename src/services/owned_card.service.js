'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class OwnedCardService {
  /**
   * Add a card to user's owned cards
   */
  static addOwnedCard = async (user_id, card_id, card_domain_id) => {
    // Check if card exists
    const card = await db.Card.findByPk(card_id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Create the owned card record
    const ownedCard = await db.OwnedCard.create({
      owned_card_id: generateUUID(),
      user_id,
      card_id,
      card_domain_id,
    });

    return {
      message: 'Card added to owned cards successfully',
      ownedCard,
    };
  };

  /**
   * Get all owned cards for a user
   */
  static getOwnedCards = async (
    user_id,
    card_domain_id,
    page = 1,
    limit = 20
  ) => {
    const offset = (page - 1) * limit;

    const whereClause = { user_id };
    if (card_domain_id) {
      whereClause.card_domain_id = card_domain_id;
    }

    const { count, rows } = await db.OwnedCard.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Card,
          attributes: ['card_id', 'name', 'rarity', 'image_normal_url'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['owned_card_id', 'DESC']],
    });

    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      ownedCards: rows,
    };
  };

  /**
   * Remove a card from user's owned cards
   */
  static removeOwnedCard = async (user_id, owned_card_id) => {
    const ownedCard = await db.OwnedCard.findOne({
      where: { user_id, owned_card_id },
    });

    if (!ownedCard) {
      throw new NotFoundError('Owned card not found');
    }

    await ownedCard.destroy();

    return {
      message: 'Card removed from owned cards successfully',
    };
  };
}

module.exports = OwnedCardService;
