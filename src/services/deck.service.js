'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class DeckService {
  // Standard format options for each card type
  static STANDARD_FORMATS = {
    ygo: ['TCG', 'OCG', 'Genesys'],
    pkm: ['Standard', 'Expanded', 'Legacy', 'Unlimited'],
  };

  static getAvailableFormats = (card_type) => {
    return this.STANDARD_FORMATS[card_type] || [];
  };

  static validateFormat = (card_type, format) => {
    if (!format) return true; // Format is optional
    const availableFormats = this.STANDARD_FORMATS[card_type];
    return availableFormats && availableFormats.includes(format);
  };

  /**
   * Create a new deck with cards
   */
  static createDeck = async (
    user_id,
    { name, card_type, format, cards = [] }
  ) => {
    if (!name || !card_type)
      throw new BadRequestError('Deck name and card type are required');

    // Validate format if provided
    if (format && !this.validateFormat(card_type, format)) {
      const availableFormats = this.getAvailableFormats(card_type);
      throw new BadRequestError(
        `Invalid format. Available formats for ${card_type}: ${availableFormats.join(
          ', '
        )}`
      );
    }

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

    const deck = await db.Deck.create({
      deck_id: generateUUID(),
      user_id,
      name,
      card_domain_id,
      format, // Can be null/undefined
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

    // Get card type from deck's domain to validate format
    if (format) {
      const deckWithDomain = await db.Deck.findByPk(deck_id, {
        include: [{ model: db.CardDomain, as: 'domain' }],
      });

      let card_type;
      if (
        deckWithDomain.domain.card_domain_id ===
        '11111111-1111-1111-1111-111111111111'
      ) {
        card_type = 'ygo';
      } else if (
        deckWithDomain.domain.card_domain_id ===
        '22222222-2222-2222-2222-222222222222'
      ) {
        card_type = 'pkm';
      }

      if (!this.validateFormat(card_type, format)) {
        const availableFormats = this.getAvailableFormats(card_type);
        throw new BadRequestError(
          `Invalid format. Available formats for ${card_type}: ${availableFormats.join(
            ', '
          )}`
        );
      }
    }

    if (name) deck.name = name;
    if (format !== undefined) deck.format = format; // Allow setting to null
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{ model: db.CardDomain, as: 'domain' }],
    });

    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      decks: rows,
    };
  };

  /**
   * Get a single deck with its cards
   */
  static getDeck = async (deck_id, user_id) => {
    const deck = await db.Deck.findOne({
      where: { deck_id, user_id },
      include: [
        { model: db.CardDomain, as: 'domain' },
        { model: db.DeckCard, as: 'cards' },
      ],
    });

    if (!deck) throw new NotFoundError('Deck not found or unauthorized');

    return { message: 'Deck retrieved successfully', deck };
  };

  /**
   * Delete a deck
   */
  static deleteDeck = async (deck_id, user_id) => {
    const deck = await db.Deck.findOne({ where: { deck_id, user_id } });
    if (!deck) throw new NotFoundError('Deck not found or unauthorized');

    // Delete associated deck cards first
    await db.DeckCard.destroy({ where: { deck_id } });

    // Delete the deck
    await deck.destroy();

    return { message: 'Deck deleted successfully' };
  };
}

module.exports = DeckService;
