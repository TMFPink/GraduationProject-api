const { development: { host, username, password, database, port, dialect }} = require("../configs/config.postgresql");
const { Sequelize } = require("sequelize");
const { Pool } = require("pg");

const initialize = async () => {
  const pool = new Pool({
    host,
    user: username,
    password,
    port,
    database: "postgres", // connect to default db first
  });

  // Check if DB exists
  const result = await pool.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [database]
  );

  if (result.rowCount === 0) {
    await pool.query(`CREATE DATABASE "${database}";`);
    console.log(`Database ${database} created.`);
  } else {
    console.log(`Database ${database} already exists.`);
  }

  await pool.end();
};

// Sequelize instance (connects to your app DB)
const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect, // usually "postgres"
  logging: false,
});

const connect = async () => {
  try {
    await initialize(); // ensure DB exists
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
};


module.exports = {
  initialize,
  sequelize,
  connect,
};
