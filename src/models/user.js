'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: 'role_id',
      });
      User.hasMany(models.Collection, { foreignKey: 'user_id' });
      User.hasMany(models.Deck, { foreignKey: 'user_id' });
      User.hasMany(models.Post, { foreignKey: 'user_id' });
      User.hasMany(models.Comment, { foreignKey: 'user_id' });
      User.hasMany(models.OwnedCard, { foreignKey: 'user_id' });
    }
  }
  User.init(
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      hash_password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // first_name: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // },
      // last_name: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userTag: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      avatar_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cover_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      paranoid: true,
    }
  );
  return User;
};
