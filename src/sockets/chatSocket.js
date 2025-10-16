const { v4: uuidv4 } = require('uuid');
const db = require('../models');

module.exports = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    // Register user
    socket.on('register', (user_id) => {
      onlineUsers.set(user_id, socket.id);
      console.log(`User ${user_id} registered with socket ${socket.id}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { sender_id, receiver_id, content } = data;

        const message = await db.Message.create({
          message_id: uuidv4(),
          sender_id,
          receiver_id,
          content,
        });

        // Emit to receiver if online
        const receiverSocket = onlineUsers.get(receiver_id);
        if (receiverSocket) {
          io.to(receiverSocket).emit('receive_message', message);
        }

        // Confirm to sender
        socket.emit('message_sent', message);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};
