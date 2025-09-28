'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    static associate(models) {
      Follow.belongsTo(models.User, { foreignKey: 'follower_id', as: 'follower' });
      Follow.belongsTo(models.User, { foreignKey: 'following_id', as: 'following' });
    }
  }
  Follow.init({
    follow_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    follower_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    following_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Follow',
    tableName: 'follows',
    timestamps: true
  });
  return Follow;
};
