'use strict';

const { OK, CREATED } = require('../core/success.response');
const CollectionService = require('../services/collection.service');

class CollectionController {
  addCardToCollection = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { id } = req.params; // collection_id
    const { card_id } = req.body;

    new OK({
      message: 'Card added to collection successfully',
      metadata: await CollectionService.addCardToCollection(
        id,
        user_id,
        card_id
      ),
    }).send(res);
  };

  createCollection = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { name, card_domain_id, cards } = req.body;

    new CREATED({
      message: 'Collection created successfully',
      metadata: await CollectionService.createCollection(user_id, {
        name,
        card_domain_id,
        cards,
      }),
    }).send(res);
  };

  updateCollection = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const { name, card_domain_id, cards } = req.body;

    new OK({
      message: 'Collection updated successfully',
      metadata: await CollectionService.updateCollection(id, user_id, {
        name,
        card_domain_id,
        cards,
      }),
    }).send(res);
  };

  getCollections = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { page = 1, limit = 20 } = req.query;

    new OK({
      message: 'Collections retrieved successfully',
      metadata: await CollectionService.getCollections(user_id, page, limit),
    }).send(res);
  };

  getCollectionDetail = async (req, res, next) => {
    new OK({
      message: 'Collection detail retrieved successfully',
      metadata: await CollectionService.getCollectionDetail(req.params.id),
    }).send(res);
  };

  deleteCollection = async (req, res, next) => {
    const user_id = req.user.user_id;
    new OK({
      message: 'Collection deleted successfully',
      metadata: await CollectionService.deleteCollection(
        req.params.id,
        user_id
      ),
    }).send(res);
  };
}

module.exports = new CollectionController();
