'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.User, { foreignKey: 'user_id' });
      Comment.belongsTo(models.Post, { foreignKey: 'post_id' });
      Comment.belongsTo(models.Comment, { foreignKey: 'parent_id', as: 'parent' });
      Comment.hasMany(models.Comment, { foreignKey: 'parent_id', as: 'replies' });
    }
  }
  Comment.init({
    comment_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    post_id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    content: DataTypes.TEXT,
    upvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
    downvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
    parent_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true
  });
  return Comment;
};
