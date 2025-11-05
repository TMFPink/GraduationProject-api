'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OwnedCard extends Model {
    static associate(models) {
      OwnedCard.belongsTo(models.User, { foreignKey: 'user_id' });
      OwnedCard.belongsTo(models.Card, { foreignKey: 'card_id' });
    }
  }
  OwnedCard.init(
    {
      owned_card_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      card_domain_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      card_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'OwnedCard',
      tableName: 'owned_cards',
      timestamps: false,
    }
  );
  return OwnedCard;
};
