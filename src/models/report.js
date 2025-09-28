'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    static associate(models) {
      Report.belongsTo(models.User, { foreignKey: 'reporter_id' });
    }
  }
  Report.init({
    report_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    reporter_id: DataTypes.UUID,
    target_type: { type: DataTypes.ENUM('post', 'comment'), allowNull: false },
    target_id: DataTypes.UUID,
    reason: DataTypes.TEXT,
    status: { type: DataTypes.ENUM('pending', 'approved', 'dismissed'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true
  });
  return Report;
};
