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
    } else if (domain === 'rb') {
      where.card_domain_id = '33333333-3333-3333-3333-333333333333';
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
      } else if (domain === 'rb') {
        where.card_domain_id = '33333333-3333-3333-3333-333333333333';
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
          owned_card_id: ownedCard.owned_card_id,
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

  // =========================================================
  // FEATURE CARDS (using FeatureCard model & owned cards)
  // =========================================================

  /**
   * List feature cards for a user (optionally filter by domain)
   * - Includes OwnedCard + Card info
   * - Ordered by position ASC
   */
  static getFeatureCards = async (user_id) => {
    const ownedWhere = {};

    const featureCards = await db.FeatureCard.findAll({
      where: { user_id },
      include: [
        {
          model: db.OwnedCard,
          where: ownedWhere,
          include: [
            {
              model: db.Card,
              attributes: ['card_id', 'name', 'rarity', 'image_normal_url'],
            },
          ],
        },
      ],
      order: [['position', 'ASC']],
    });

    // You can shape the response if you want a cleaner payload
    return {
      featureCards: featureCards.map((fc) => ({
        feature_card_id: fc.feature_card_id,
        position: fc.position,
        owned_card_id: fc.owned_card_id,
        card: fc.OwnedCard?.Card || null,
        card_domain_id: fc.OwnedCard?.card_domain_id || null,
      })),
    };
  };

  /**
   * Sets/replaces all feature cards for a user.
   * - Expects an array of { owned_card_id, position }.
   * - This is an atomic operation: it deletes all old feature cards and creates new ones.
   */
  static setFeatureCards = async (user_id, featureCardsPayload) => {
    if (!Array.isArray(featureCardsPayload)) {
      throw new BadRequestError('feature_cards must be an array');
    }

    // Validate for duplicate owned_card_id or position in payload
    const ownedCardIds = featureCardsPayload.map((fc) => fc.owned_card_id);
    const positions = featureCardsPayload.map((fc) => fc.position);

    if (new Set(ownedCardIds).size !== ownedCardIds.length) {
      throw new BadRequestError('Duplicate owned_card_id in feature cards');
    }
    if (new Set(positions).size !== positions.length) {
      throw new BadRequestError('Duplicate position in feature cards');
    }

    // Use a transaction to ensure atomicity
    const result = await db.sequelize.transaction(async (t) => {
      // 1. Delete all existing feature cards for the user
      await db.FeatureCard.destroy({
        where: { user_id },
        transaction: t,
      });

      if (featureCardsPayload.length === 0) {
        return []; // Nothing more to do if the array is empty
      }

      // 2. Verify all provided owned_card_ids belong to the user
      const ownedCards = await db.OwnedCard.findAll({
        where: {
          user_id,
          owned_card_id: ownedCardIds,
        },
        attributes: ['owned_card_id'],
        transaction: t,
      });

      if (ownedCards.length !== ownedCardIds.length) {
        throw new NotFoundError(
          'One or more owned cards not found or do not belong to the user'
        );
      }

      // 3. Create the new feature cards
      const newFeatureCards = featureCardsPayload.map((fc) => ({
        feature_card_id: generateUUID(),
        user_id,
        owned_card_id: fc.owned_card_id,
        position: fc.position,
      }));

      const createdFeatureCards = await db.FeatureCard.bulkCreate(
        newFeatureCards,
        { transaction: t }
      );

      return createdFeatureCards;
    });

    return {
      message: 'Feature cards updated successfully',
      featureCards: result,
    };
  };
}

module.exports = OwnedCardService;
