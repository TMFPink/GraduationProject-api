const express = require('express');
const swaggerUi = require('swagger-ui-express');
const {
  appSpecification,
} = require('../../configs/Documentation/swagger-config');

const userRouter = require('./user');
const cardsRouter = require('./cards');
const followRouter = require('./follow');
const reportRouter = require('./report');
const postsRouter = require('./posts');
const commentsRouter = require('./comment');
const messageRouter = require('./chat');
const collectionRouter = require('./collection');
const deckRouter = require('./deck');
const ownedCardRouter = require('./owned_card');
const cardDetectionRouter = require('./card-detection');

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
users_api.use('/posts', postsRouter);
users_api.use('/comments', commentsRouter);
users_api.use('/chat', messageRouter);
users_api.use('/collections', collectionRouter);
users_api.use('/deck', deckRouter);
users_api.use('/owned-cards', ownedCardRouter);
users_api.use('/card-detection', cardDetectionRouter);

module.exports = users_api;
