'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CardDomain extends Model {
    static associate(models) {
      CardDomain.hasMany(models.Card, { foreignKey: 'card_domain_id' });
      CardDomain.hasMany(models.Deck, { foreignKey: 'card_domain_id' });
    }
  }
  CardDomain.init(
    {
      card_domain_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'CardDomain',
      tableName: 'card_domains',
      timestamps: false,
    }
  );
  return CardDomain;
};
