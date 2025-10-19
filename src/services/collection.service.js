'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class CollectionService {
  /**
   * Create a new collection with cards
   */
  static createCollection = async (
    user_id,
    { name, card_domain_id, cards = [] }
  ) => {
    if (!name) throw new BadRequestError('Collection name is required');
    if (!card_domain_id)
      throw new BadRequestError('Card domain ID is required');

    const collection = await db.Collection.create({
      collection_id: generateUUID(),
      user_id,
      name,
      card_domain_id,
    });

    // Add cards to collection
    if (Array.isArray(cards) && cards.length > 0) {
      const collectionCards = cards.map(({ card_id, quantity = 1 }) => ({
        collection_card_id: generateUUID(),
        collection_id: collection.collection_id,
        card_id,
        quantity,
      }));
      await db.CollectionCard.bulkCreate(collectionCards);
    }

    return { message: 'Collection created successfully', collection };
  };

  /**
   * Update collection name or its cards
   */
  static updateCollection = async (
    collection_id,
    user_id,
    { name, card_domain_id, cards }
  ) => {
    const collection = await db.Collection.findOne({
      where: { collection_id, user_id },
    });
    if (!collection)
      throw new NotFoundError('Collection not found or unauthorized');

    if (name) collection.name = name;
    if (card_domain_id) collection.card_domain_id = card_domain_id;
    await collection.save();

    // Replace cards if provided
    if (Array.isArray(cards)) {
      await db.CollectionCard.destroy({ where: { collection_id } });
      if (cards.length > 0) {
        const collectionCards = cards.map(({ card_id, quantity = 1 }) => ({
          collection_card_id: generateUUID(),
          collection_id,
          card_id,
          quantity,
        }));
        await db.CollectionCard.bulkCreate(collectionCards);
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
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { total: count, page, limit, collections: rows };
  };

  /**
   * Get a single collection with cards
   */
  static getCollectionDetail = async (collection_id) => {
    const collection = await db.Collection.findByPk(collection_id, {
      include: [
        {
          model: db.CardDomain,
        },
        {
          model: db.CollectionCard,
          include: [{ model: db.Card }],
        },
      ],
    });
    if (!collection) throw new NotFoundError('Collection not found');
    return collection;
  };

  /**
   * Delete a collection and its cards
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
