const express = require('express');
const swaggerUi = require('swagger-ui-express');
const {
  appSpecification,
} = require('../../configs/Documentation/swagger-config');

const userRouter = require('./user');
const cardsRouter = require('./cards');
const followRouter = require('./follow');
const reportRouter = require('./report');

const users_api = express();

users_api.use(
  '/api-docs',
  swaggerUi.serveFiles(appSpecification),
  swaggerUi.setup(appSpecification)
);

users_api.use('/users', userRouter);
users_api.use('/cards', cardsRouter);
users_api.use('/follow', followRouter);
users_api.use('/report', reportRouter);

module.exports = users_api;
