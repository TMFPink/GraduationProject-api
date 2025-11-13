'use strict';

// Suppress AWS SDK v2 warnings BEFORE any other imports
require('./src/utils/suppressWarnings');

const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const initChatSocket = require('./src/sockets/chatSocket'); // import logic

const PORT = process.env.SERVER_PORT || 3000;

// create HTTP server
const server = http.createServer(app);

// setup socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// initialize socket handlers
initChatSocket(io);

server.listen(PORT, () => {
  console.log(`=============Connected: ${PORT}=============`);
  console.log(
    `API docs: \nMobileApp: http://localhost:${PORT}/v1/api-docs \nAdmin: http://localhost:${PORT}/v1/admin/api-docs \n`
  );
  console.log(`===========================================`);
});

process.on('SIGINT', () => {
  server.close(() => console.log(`Exit!`));
});
