const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const admin = {
    definition: {
        openapi: '3.0.0',
        info: {
          title: 'Card Community Website API for Admin',
          description: "This is a REST api for Card Community website for Admin. You can find out more about Card Community at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).",
          version: '1.0.0',
          contact: {
            email: 'nguyenhongtranminh@gmail.com'
          },
          termsOfService: 'http://swagger.io/terms/'
        },
        servers: [
          {
            url: 'http://localhost:3000/v1/admin',
            name: 'development',
          }, 
         
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            }
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ]
    },
    apis: [path.join(__dirname, 'admin', '**', '*.yml')], // files containing annotations as above
};
 
const app = {
    definition: {
        openapi: '3.0.0',
        info: {
          title: 'Card Community Website API',
          description: "This is a REST api for Card Community website. You can find out more about Card Community at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).",
          version: '1.0.0',
          contact: {
            email: 'nanhvt2708@gmail.com'
          },
          termsOfService: 'http://swagger.io/terms/'
        },
        servers: [
          {
            url: 'http://localhost:3000/v1',
            name: 'development',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            }
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ]
    },
    apis: [path.join(__dirname, 'mobile-app', '**', '*.yml')], // files containing annotations as above
};
 

module.exports = {
    adminSpecification: swaggerJsdoc(admin),
    appSpecification: swaggerJsdoc(app),
};