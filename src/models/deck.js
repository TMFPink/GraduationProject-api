'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Deck extends Model {
    static associate(models) {
      Deck.belongsTo(models.User, { foreignKey: 'user_id' });
      Deck.belongsTo(models.CardDomain, { foreignKey: 'card_domain_id', as: 'domain' });
    }
  }
  Deck.init({
    deck_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    user_id: DataTypes.UUID,
    name: { type: DataTypes.STRING, allowNull: false },
    card_domain_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Deck',
    tableName: 'decks',
    timestamps: true
  });
  return Deck;
};
