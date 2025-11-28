'use strict';

module.exports = (io) => {
  console.log('Notification socket initialized');

  io.on('connection', (socket) => {
    const user_id = socket.handshake.auth?.user_id;

    if (!user_id) return;

    socket.join(user_id);

    console.log(`🔔 User ${user_id} connected to hear notification`);

    socket.on('disconnect', () => {
      console.log(`🔕 User ${user_id} disconnected from notifications`);
    });
  });
};
