'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Pool } = require('pg');

// Get connection info from environment or config
// Example: postgres://username:password@host:port/database
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL not found in .env');

const initialize = async () => {
  // Parse connection string to extract default info for CREATE DATABASE
  const url = new URL(DATABASE_URL);
  const database = url.pathname.replace('/', '');
  const defaultDbUrl = DATABASE_URL.replace(database, 'postgres'); // connect to default postgres db

  const pool = new Pool({
    connectionString: defaultDbUrl,
  });

  try {
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    );

    if (result.rowCount === 0) {
      await pool.query(`CREATE DATABASE "${database}";`);
      console.log(`Database "${database}" created.`);
    } else {
      console.log(`Database "${database}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Error checking/creating database:', err);
    throw err;
  } finally {
    await pool.end();
  }
};

// Sequelize instance (connects to your actual app DB)
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const connect = async () => {
  try {
    await initialize(); // ensure DB exists
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
};

module.exports = {
  initialize,
  sequelize,
  connect,
};
