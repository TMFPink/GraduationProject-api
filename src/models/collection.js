'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    static associate(models) {
      Collection.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  Collection.init({
    collection_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    user_id: DataTypes.UUID,
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'Collection',
    tableName: 'collections',
    timestamps: true
  });
  return Collection;
};
