// src/sockets/index.js
'use strict';

const initChatSocket = require('./chatSocket');
const initNotificationSocket = require('./notificationSocket');
const { initIO } = require('../utils/socketSingleton');

module.exports = (io) => {
  initIO(io);
  initChatSocket(io);
  initNotificationSocket(io);
};
