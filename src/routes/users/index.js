const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { appSpecification } = require('../../configs/Documentation/swagger-config');


const userRouter = require('./user');

const users_api = express();

users_api.use('/api-docs', swaggerUi.serveFiles(appSpecification), swaggerUi.setup(appSpecification));

users_api.use('/users', userRouter);

module.exports = users_api;