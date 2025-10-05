'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CardImage extends Model {
    static associate(models) {
      CardImage.belongsTo(models.Card, { foreignKey: 'card_id', as: 'card' });
    }
  }

  CardImage.init({
    card_image_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    card_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    image_url: DataTypes.STRING,
    image_url_small: DataTypes.STRING,
    image_url_cropped: DataTypes.STRING,
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    meta_data: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'CardImage',
    tableName: 'card_images',
    timestamps: false,
  });

  return CardImage;
};
