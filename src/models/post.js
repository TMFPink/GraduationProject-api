'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.User, { foreignKey: 'user_id' });
      Post.hasMany(models.Comment, { foreignKey: 'post_id' });
    }
  }
  Post.init({
    post_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    user_id: DataTypes.UUID,
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    thumbnail: DataTypes.STRING,
    media_url: DataTypes.STRING,
    tags: DataTypes.ARRAY(DataTypes.STRING),
    upvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
    downvotes: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true
  });
  return Post;
};
