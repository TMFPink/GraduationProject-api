const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { webSpecification } = require('../../configs/Documentation/swagger-config');

users_api = express();
users_api.use('/api-docs', swaggerUi.serveFiles(webSpecification), swaggerUi.setup(webSpecification));
users_api.use('/cards', (req, res) => {
    res.json({ message: 'This is the cards endpoint' });
});

module.exports = users_api;