require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const cors = require('cors');
const compression = require('compression');
const {
  config: { WEB_DOMAIN_URL },
} = require('./constants/index.js');

// Routers
const auth_api = require('./routes/auth');
const admin_api = require('./routes/admin/index');
const users_api = require('./routes/users/index');

// Middlewares
const corsOptions = require('./configs/CORS/corsOptions');
const credentials = require('./middlewares/credentials');

const app = express();

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//init postgreSQL
require('./databases/init.postgresql').connect();

app.use('/v1/auth', auth_api);
app.use('/v1/admin', admin_api);
app.use('/v1/', users_api);

/* GET home page. */
app.get('/', function (req, res, next) {
  res.json({
    msg: 'Hello World',
    'api-docs': `${WEB_DOMAIN_URL}/v1/api-docs`,
  });
});

// handling errors
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error',
  });
});

module.exports = app;
