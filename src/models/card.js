'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    static associate(models) {
      Card.belongsTo(models.CardDomain, {
        foreignKey: 'card_domain_id',
        as: 'domain',
      });
      Card.hasMany(models.CardImage, { foreignKey: 'card_id', as: 'images' });
      Card.hasMany(models.CollectionCard, { foreignKey: 'card_id' });
      Card.hasMany(models.OwnedCard, { foreignKey: 'card_id' });
    }
  }
  Card.init(
    {
      card_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      rarity: DataTypes.STRING,
      card_domain_id: DataTypes.UUID,
      image_normal_url: DataTypes.STRING,
      image_large_url: DataTypes.STRING,
      image_thumb_url: DataTypes.STRING,
      meta_data: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: 'Card',
      tableName: 'cards',
      timestamps: false,
    }
  );
  return Card;
};
