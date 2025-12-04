'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FeatureCard extends Model {
    static associate(models) {
      FeatureCard.belongsTo(models.OwnedCard, { foreignKey: 'owned_card_id' });
    }
  }
  FeatureCard.init(
    {
      feature_card_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      owned_card_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'FeatureCard',
      tableName: 'feature_cards',
      timestamps: false,
    }
  );
  return FeatureCard;
};
