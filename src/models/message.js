'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
      Message.belongsTo(models.User, { foreignKey: 'receiver_id', as: 'receiver' });
    }
  }
  Message.init({
    message_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    sender_id: DataTypes.UUID,
    receiver_id: DataTypes.UUID,
    content: DataTypes.TEXT,
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true
  });
  return Message;
};
