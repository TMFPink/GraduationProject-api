'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeckCard extends Model {
    static associate(models) {
      DeckCard.belongsTo(models.Deck, { foreignKey: 'deck_id' });
      DeckCard.belongsTo(models.Card, { foreignKey: 'card_id' });
    }
  }
  DeckCard.init({
    deck_card_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    deck_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    card_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    quantity: { 
      type: DataTypes.INTEGER, 
      defaultValue: 1 
    }
  }, {
    sequelize,
    modelName: 'DeckCard',
    tableName: 'deck_cards',
    timestamps: false
  });
  return DeckCard;
};
