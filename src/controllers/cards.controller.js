'use strict';

const { OK } = require('../core/success.response');
const CardService = require('../services/cards.service');

class CardController {
  get_all_cards = async (req, res, next) => {
    new OK({
      message: 'Cards retrieved successfully',
      metadata: await CardService.get_all(req.query),
    }).send(res);
  };

  get_card_by_id = async (req, res, next) => {
    new OK({
      message: 'Card retrieved successfully',
      metadata: await CardService.get_by_id(req.params.id),
    }).send(res);
  };

  get_cards_by_filter = async (req, res, next) => {
    new OK({
      message: 'Cards filtered successfully',
      metadata: await CardService.get_by_filter(req.query),
    }).send(res);
  };
}

module.exports = new CardController();
