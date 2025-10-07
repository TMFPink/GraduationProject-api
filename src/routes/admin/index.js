const express = require('express');
const swaggerUi = require('swagger-ui-express');
const {
  adminSpecification,
} = require('../../configs/Documentation/swagger-config');

const admin_api = express();

admin_api.use(
  '/api-docs',
  swaggerUi.serveFiles(adminSpecification),
  swaggerUi.setup(adminSpecification)
);

module.exports = admin_api;
