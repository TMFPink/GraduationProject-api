'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CommentVote extends Model {}

  CommentVote.init(
    {
      user_id: DataTypes.UUID,
      comment_id: DataTypes.UUID,
      type: DataTypes.ENUM('upvote', 'downvote'),
    },
    {
      sequelize,
      modelName: 'CommentVote',
      tableName: 'comment_votes',
      timestamps: true,
    }
  );

  return CommentVote;
};
