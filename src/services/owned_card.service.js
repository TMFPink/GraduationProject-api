'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class OwnedCardService {
  /**
   * Add a card to user's owned cards
   */
  static addOwnedCard = async (user_id, card_id, domain) => {
    // Check if card exists
    const card = await db.Card.findByPk(card_id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    let card_domain_id;
    if (domain == 'ygo') {
      card_domain_id = '11111111-1111-1111-1111-111111111111';
    } else if (domain == 'pkm') {
      card_domain_id = '22222222-2222-2222-2222-222222222222';
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
   * Get all owned cards for a user, grouped by card with quantities
   */
  static getOwnedCards = async (user_id, domain, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const whereClause = { user_id };
    if (domain) {
      if (domain == 'ygo') {
        whereClause.card_domain_id = '11111111-1111-1111-1111-111111111111';
      } else if (domain == 'pkm') {
        whereClause.card_domain_id = '22222222-2222-2222-2222-222222222222';
      }
    }

    // Get all owned cards with card details and group by card_id
    const ownedCards = await db.OwnedCard.findAll({
      where: whereClause,
      include: [
        {
          model: db.Card,
          attributes: ['card_id', 'name', 'rarity', 'image_normal_url'],
        },
      ],
      order: [['createdAt', 'DESC']], // Latest first for grouping
    });

    // Group cards by card_id and calculate quantities
    const cardGroups = {};
    ownedCards.forEach((ownedCard) => {
      const cardId = ownedCard.card_id;
      if (!cardGroups[cardId]) {
        cardGroups[cardId] = {
          card_id: cardId,
          card_domain_id: ownedCard.card_domain_id,
          quantity: 0,
          Card: ownedCard.Card,
        };
      }
      cardGroups[cardId].quantity += 1;
    });

    // Convert to array and apply pagination
    const groupedCards = Object.values(cardGroups);
    const total = groupedCards.length;
    const paginatedCards = groupedCards.slice(offset, offset + parseInt(limit));

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      ownedCards: paginatedCards,
    };
  };

  /**
   * Remove the latest owned card by card_id
   */
  static removeOwnedCard = async (user_id, card_id) => {
    // Find the latest owned card for this user and card_id
    const ownedCard = await db.OwnedCard.findOne({
      where: { user_id, card_id },
      order: [['createdAt', 'DESC']], // Get the latest one
    });

    if (!ownedCard) {
      throw new NotFoundError('Owned card not found');
    }

    await ownedCard.destroy();

    // Check if user still owns other instances of this card
    const remainingOwnedCards = await db.OwnedCard.count({
      where: { user_id, card_id },
    });

    // If user doesn't own this card anymore, remove it from all their collections
    if (remainingOwnedCards === 0) {
      // Get all user's collections that contain this card
      const userCollections = await db.Collection.findAll({
        where: { user_id },
        attributes: ['collection_id'],
      });

      const collectionIds = userCollections.map((c) => c.collection_id);

      if (collectionIds.length > 0) {
        await db.CollectionCard.destroy({
          where: {
            collection_id: collectionIds,
            card_id,
          },
        });
      }
    }

    return {
      message: 'Card removed from owned cards successfully',
    };
  };
}

module.exports = OwnedCardService;
