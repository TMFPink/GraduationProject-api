'use strict';

const { OK, CREATED } = require('../core/success.response');
const DeckService = require('../services/deck.service');

class DeckController {
  createDeck = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { name, card_domain_id, format, cards } = req.body;

    new CREATED({
      message: 'Deck created successfully',
      metadata: await DeckService.createDeck(user_id, {
        name,
        card_domain_id,
        format,
        cards,
      }),
    }).send(res);
  };

  updateDeck = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const { name, format, cards } = req.body;

    new OK({
      message: 'Deck updated successfully',
      metadata: await DeckService.updateDeck(id, user_id, {
        name,
        format,
        cards,
      }),
    }).send(res);
  };

  getDecks = async (req, res, next) => {
    const user_id = req.user.user_id;
    const { page = 1, limit = 20 } = req.query;

    new OK({
      message: 'Decks retrieved successfully',
      metadata: await DeckService.getDecks(user_id, page, limit),
    }).send(res);
  };

  getDeckDetail = async (req, res, next) => {
    new OK({
      message: 'Deck detail retrieved successfully',
      metadata: await DeckService.getDeckDetail(req.params.id),
    }).send(res);
  };

  deleteDeck = async (req, res, next) => {
    const user_id = req.user.user_id;
    new OK({
      message: 'Deck deleted successfully',
      metadata: await DeckService.deleteDeck(req.params.id, user_id),
    }).send(res);
  };
}

module.exports = new DeckController();
