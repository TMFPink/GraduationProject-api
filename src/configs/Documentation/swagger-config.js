const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const admin = {
    definition: {
        openapi: '3.0.0',
        info: {
          title: 'YOLO Website API for Admin',
          description: "This is a REST api for YOLO website for Admin. You can find out more about YOLO at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).",
          version: '1.0.0',
          contact: {
            email: 'nanhvt2708@gmail.com'
          },
          termsOfService: 'http://swagger.io/terms/'
        },
        servers: [
          {
            url: 'http://localhost:3000/v1/admin',
            name: 'development',
          }, 
          {
            url: 'https://api.yourrlove.com/v1/admin',
            name: 'production',
          }
        ]
    },
    apis: [path.join(__dirname, 'admin', '**', '*.yml')], // files containing annotations as above
};
 
const app = {
    definition: {
        openapi: '3.0.0',
        info: {
          title: 'YOLO Website API',
          description: "This is a REST api for YOLO website. You can find out more about YOLO at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).",
          version: '1.0.0',
          contact: {
            email: 'nanhvt2708@gmail.com'
          },
          termsOfService: 'http://swagger.io/terms/'
        },
        servers: [
          {
            url: 'http://localhost:3000/v1/mobile-app',
            name: 'development',
          },
          {
            url: 'https://api.yourrlove.com/v1/mobile-app',
            name: 'production',
          }
        ]
    },
    apis: [path.join(__dirname, 'mobile-app', '**', '*.yml')], // files containing annotations as above
};
 

module.exports = {
    adminSpecification: swaggerJsdoc(admin),
    appSpecification: swaggerJsdoc(app),
};