'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class CollectionService {
  /**
   * Add one card to an existing collection
   */
  static addCardToCollection = async (collection_id, user_id, card_id) => {
    // Check if collection exists and belongs to the user
    const collection = await db.Collection.findOne({
      where: { collection_id, user_id },
    });
    if (!collection)
      throw new NotFoundError('Collection not found or unauthorized');

    // Check if card already exists in collection
    const existing = await db.CollectionCard.findOne({
      where: { collection_id, card_id },
    });
    if (existing)
      throw new BadRequestError('Card already exists in this collection');

    // Create the link
    const newCollectionCard = await db.CollectionCard.create({
      collection_card_id: generateUUID(),
      collection_id,
      card_id,
    });

    return {
      message: 'Card added to collection successfully',
      card: newCollectionCard,
    };
  };

  /**
   * Create a new collection with cards
   */
  static createCollection = async (
    user_id,
    { name, card_type, cards = [] }
  ) => {
    if (!name || !card_type)
      throw new BadRequestError('Collection name and card type are required');

    let card_domain_id;
    switch (card_type) {
      case 'ygo':
        card_domain_id = '11111111-1111-1111-1111-111111111111';
        break;
      case 'pkm':
        card_domain_id = '22222222-2222-2222-2222-222222222222';
        break;
      default:
        throw new BadRequestError('Invalid card type');
    }

    const collection = await db.Collection.create({
      collection_id: generateUUID(),
      user_id,
      name,
      card_domain_id,
    });

    // Add cards if provided
    if (Array.isArray(cards) && cards.length > 0) {
      const collectionCards = cards.map((card_id) => ({
        collection_card_id: generateUUID(),
        collection_id: collection.collection_id,
        card_id,
      }));
      await db.CollectionCard.bulkCreate(collectionCards);
    }

    return { message: 'Collection created successfully', collection };
  };

  /**
   * Update collection name, domain, or cards
   */
  static updateCollection = async (collection_id, user_id, { name, cards }) => {
    const collection = await db.Collection.findOne({
      where: { collection_id, user_id },
    });
    if (!collection)
      throw new NotFoundError('Collection not found or unauthorized');

    if (name) collection.name = name;
    await collection.save();

    // Replace cards if provided
    if (Array.isArray(cards)) {
      await db.CollectionCard.destroy({ where: { collection_id } });
      if (cards.length > 0) {
        const newCards = cards.map((card_id) => ({
          collection_card_id: generateUUID(),
          collection_id,
          card_id,
        }));
        await db.CollectionCard.bulkCreate(newCards);
      }
    }

    return { message: 'Collection updated successfully', collection };
  };

  /**
   * Get all collections for a user
   */
  static getCollections = async (user_id, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Collection.findAndCountAll({
      where: { user_id },
      include: [{ model: db.CardDomain }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { total: count, page, limit, collections: rows };
  };

  /**
   * Get one collection with its cards
   */
  static getCollectionDetail = async (collection_id, user_id) => {
    const collection = await db.Collection.findOne({
      where: { collection_id, user_id },
      include: [
        { model: db.CardDomain },
        {
          model: db.CollectionCard,
          include: [
            {
              model: db.Card,
              attributes: ['name', 'rarity', 'image_normal_url'],
            },
          ],
        },
      ],
    });

    if (!collection)
      throw new NotFoundError('Collection not found or unauthorized');

    return { message: 'Collection retrieved successfully', collection };
  };

  /**
   * Delete a collection
   */
  static deleteCollection = async (collection_id, user_id) => {
    const collection = await db.Collection.findOne({
      where: { collection_id, user_id },
    });
    if (!collection)
      throw new NotFoundError('Collection not found or unauthorized');

    await db.CollectionCard.destroy({ where: { collection_id } });
    await collection.destroy();

    return { message: 'Collection deleted successfully' };
  };
}

module.exports = CollectionService;
module.exports = CollectionService;
