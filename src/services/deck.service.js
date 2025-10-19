'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class DeckService {
  /**
   * Create a new deck with cards
   */
  static createDeck = async (
    user_id,
    { name, card_domain_id, format, cards = [] }
  ) => {
    if (!name || !card_domain_id)
      throw new BadRequestError('Deck name and domain are required');

    const deck = await db.Deck.create({
      deck_id: generateUUID(),
      user_id,
      name,
      card_domain_id,
      format,
    });

    // Add deck cards
    if (Array.isArray(cards) && cards.length > 0) {
      const deckCards = cards.map(({ card_id, quantity = 1 }) => ({
        deck_card_id: generateUUID(),
        deck_id: deck.deck_id,
        card_id,
        quantity,
      }));
      await db.DeckCard.bulkCreate(deckCards);
    }

    return { message: 'Deck created successfully', deck };
  };

  /**
   * Update a deck (info or card list)
   */
  static updateDeck = async (deck_id, user_id, { name, format, cards }) => {
    const deck = await db.Deck.findOne({ where: { deck_id, user_id } });
    if (!deck) throw new NotFoundError('Deck not found or unauthorized');

    if (name) deck.name = name;
    if (format) deck.format = format;
    await deck.save();

    // Replace deck cards
    if (Array.isArray(cards)) {
      await db.DeckCard.destroy({ where: { deck_id } });
      if (cards.length > 0) {
        const deckCards = cards.map(({ card_id, quantity = 1 }) => ({
          deck_card_id: generateUUID(),
          deck_id,
          card_id,
          quantity,
        }));
        await db.DeckCard.bulkCreate(deckCards);
      }
    }

    return { message: 'Deck updated successfully', deck };
  };

  /**
   * Get all decks for user
   */
  static getDecks = async (user_id, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Deck.findAndCountAll({
      where: { user_id },
      include: [{ model: db.CardDomain, as: 'domain' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { total: count, page, limit, decks: rows };
  };

  /**
   * Get deck detail with cards
   */
  static getDeckDetail = async (deck_id) => {
    const deck = await db.Deck.findByPk(deck_id, {
      include: [
        { model: db.CardDomain, as: 'domain' },
        {
          model: db.DeckCard,
          include: [
            {
              model: db.Card,
              attributes: ['name', 'rarity', 'image_normal_url'],
            },
          ],
        },
      ],
    });
    if (!deck) throw new NotFoundError('Deck not found');
    return deck;
  };

  /**
   * Delete deck and its cards
   */
  static deleteDeck = async (deck_id, user_id) => {
    const deck = await db.Deck.findOne({ where: { deck_id, user_id } });
    if (!deck) throw new NotFoundError('Deck not found or unauthorized');
    await db.DeckCard.destroy({ where: { deck_id } });
    await deck.destroy();
    return { message: 'Deck deleted successfully' };
  };
}

module.exports = DeckService;
