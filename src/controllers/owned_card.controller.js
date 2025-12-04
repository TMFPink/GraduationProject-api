'use strict';

const { OK, CREATED } = require('../core/success.response');
const OwnedCardService = require('../services/owned_card.service');

class OwnedCardController {
  addOwnedCard = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { card_id, domain } = req.body;

    new CREATED({
      message: 'Card added to owned cards successfully',
      metadata: await OwnedCardService.addOwnedCard(user_id, card_id, domain),
    }).send(res);
  };

  getOwnedCards = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { page = 1, limit = 20, domain } = req.query;

    new OK({
      message: 'Owned cards retrieved successfully',
      metadata: await OwnedCardService.getOwnedCards(
        user_id,
        page,
        limit,
        domain
      ),
    }).send(res);
  };

  getOwnedCardsByUser = async (req, res, next) => {
    const { user_id, page = 1, limit = 20 } = req.query;

    new OK({
      message: 'Owned cards retrieved successfully',
      metadata: await OwnedCardService.getOwnedCards(user_id, page, limit),
    }).send(res);
  };

  removeOwnedCard = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { card_id } = req.params;

    new OK({
      message: 'Card removed from owned cards successfully',
      metadata: await OwnedCardService.removeOwnedCard(user_id, card_id),
    }).send(res);
  };

  // =========================================================
  // FEATURE CARDS
  // =========================================================

  getFeatureCards = async (req, res, next) => {
    const user_id = req.user.user_id;

    new OK({
      message: 'Feature cards retrieved successfully',
      metadata: await OwnedCardService.getFeatureCards(user_id),
    }).send(res);
  };

  setFeatureCards = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { feature_cards } = req.body;

    new OK({
      message: 'Feature cards updated successfully',
      metadata: await OwnedCardService.setFeatureCards(user_id, feature_cards),
    }).send(res);
  };
}

module.exports = new OwnedCardController();
