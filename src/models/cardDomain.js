'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CardDomain extends Model {
    static associate(models) {}
  }
  CardDomain.init({
    card_domain_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CardDomain',
    tableName: 'card_domains',
    timestamps: false
  });
  return CardDomain;
};
