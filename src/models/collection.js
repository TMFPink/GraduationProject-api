'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    static associate(models) {
      Collection.belongsTo(models.User, { foreignKey: 'user_id' });
      Collection.belongsTo(models.CardDomain, { foreignKey: 'card_domain_id' });
      Collection.hasMany(models.CollectionCard, {
        foreignKey: 'collection_id',
      });
    }
  }
  Collection.init(
    {
      collection_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      user_id: DataTypes.UUID,
      name: { type: DataTypes.STRING, allowNull: false },
      card_domain_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Collection',
      tableName: 'collections',
      timestamps: true,
    }
  );
  return Collection;
};
