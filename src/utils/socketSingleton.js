let io = null;

module.exports = {
  initIO(serverIO) {
    io = serverIO;
  },
  getIO() {
    if (!io) throw new Error('Socket.io has not been initialized');
    return io;
  },
};
