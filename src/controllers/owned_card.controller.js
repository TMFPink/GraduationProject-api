'use strict';

const { OK, CREATED } = require('../core/success.response');
const OwnedCardService = require('../services/owned_card.service');

class OwnedCardController {
  addOwnedCard = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { card_id, card_domain_id } = req.body;

    new CREATED({
      message: 'Card added to owned cards successfully',
      metadata: await OwnedCardService.addOwnedCard(
        user_id,
        card_id,
        card_domain_id
      ),
    }).send(res);
  };

  getOwnedCards = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { page = 1, limit = 20, card_domain_id } = req.query;

    new OK({
      message: 'Owned cards retrieved successfully',
      metadata: await OwnedCardService.getOwnedCards(
        user_id,
        card_domain_id,
        page,
        limit
      ),
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
}

module.exports = new OwnedCardController();
