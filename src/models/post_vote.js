'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostVote extends Model {
    static associate(models) {
      PostVote.belongsTo(models.User, { foreignKey: 'user_id' });
      PostVote.belongsTo(models.Post, { foreignKey: 'post_id' });
    }
  }

  PostVote.init(
    {
      vote_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      user_id: DataTypes.UUID,
      post_id: DataTypes.UUID,
      value: DataTypes.INTEGER, // 1 or -1
    },
    {
      sequelize,
      modelName: 'PostVote',
      tableName: 'post_votes',
      timestamps: true,
    }
  );

  return PostVote;
};
