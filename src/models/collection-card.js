'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CollectionCard extends Model {
    static associate(models) {
      CollectionCard.belongsTo(models.Collection, { foreignKey: 'collection_id' });
      CollectionCard.belongsTo(models.Card, { foreignKey: 'card_id' });
    }
  }
  CollectionCard.init({
    collection_card_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    collection_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    card_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CollectionCard',
    tableName: 'collection_cards',
    timestamps: false
  });
  return CollectionCard;
};
