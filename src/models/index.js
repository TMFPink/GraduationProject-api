'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};
const env = process.env.NODE_ENV?.trim() || 'development';
console.log(`Sequelize environment: ${env}`);
const config = require('../configs/config.postgresql')[env];

// Validate required environment variables
if (config.use_env_variable) {
  const envVarValue = process.env[config.use_env_variable];
  if (!envVarValue) {
    console.error(
      `Error: Environment variable ${config.use_env_variable} is not defined`
    );
    console.error('Docker Environment Debug Info:');
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('Current working directory:', process.cwd());
    console.error(
      'Environment files checked: .env, .env.production, .env.local'
    );
    console.error(
      'Available environment variables:',
      Object.keys(process.env).filter(
        (key) => key.includes('DB') || key.includes('DATABASE')
      )
    );

    // Try to load production env file explicitly in Docker
    if (env === 'production') {
      try {
        const dotenv = require('dotenv');
        const prodEnvPath = path.join(process.cwd(), '.env.production');
        console.log(`Attempting to load: ${prodEnvPath}`);
        dotenv.config({ path: prodEnvPath });

        const retryValue = process.env[config.use_env_variable];
        if (retryValue) {
          console.log(
            `===>> Successfully loaded ${config.use_env_variable} from .env.production`
          );
        }
      } catch (error) {
        console.error('Failed to load .env.production:', error.message);
      }
    }

    throw new Error(
      `Missing required environment variable: ${config.use_env_variable}`
    );
  }
}

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: config.logging,
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

module.exports = db;
