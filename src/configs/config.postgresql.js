// require('dotenv').config();

// module.exports = {
//     "development": {
//         "username": process.env.DB_USER,
//         "password": process.env.DB_PASSWORD,
//         "database": process.env.DB_NAME,
//         "host": process.env.POSTGRES_DB_HOST,
//         "port": process.env.POSTGRES_DB_PORT,
//         "dialect": "postgres",
//         "define": {
//             freezeTableName: false,
//         },
//         "migrationStoragePath": "src/databases/migrations"
//     },
//     "test": {
//         "username": "root",
//         "password": null,
//         "database": "database_test",
//         "host": "127.0.0.1",
//         "dialect": "postgres"
//     },
//     "production": {
//         "username": process.env.DB_USER,
//         "password": process.env.DB_PASSWORD,
//         "database": process.env.DB_NAME,
//         "host": process.env.POSTGRES_DB_HOST,
//         "port": process.env.POSTGRES_DB_PORT,
//         "dialect": "postgres",
//         "define": {
//             freezeTableName: true,
//         }
//     },
// };
require('dotenv').config();

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // important for Neon
      },
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
