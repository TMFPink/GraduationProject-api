'use strict';

const { OK } = require('../core/success.response');
const ChatService = require('../services/chat.service');

class ChatController {
  /**
   * GET /chat/list
   * Get all recent chat partners
   */
  getChatList = async (req, res, next) => {
    try {
      const user_id = req.user.user_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await ChatService.getChatList(user_id, page, limit);

      new OK({
        message: 'Chat list retrieved successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /chat/:receiver_id
   * Get chat history between 2 users
   */
  getChatHistory = async (req, res, next) => {
    try {
      const user_id = req.user.user_id;
      const { receiver_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await ChatService.getChatHistory(
        user_id,
        receiver_id,
        page,
        limit
      );

      new OK({
        message: 'Chat history retrieved successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /chat/:receiver_id/read
   * Mark messages as read
   */
  markAsRead = async (req, res, next) => {
    try {
      const user_id = req.user.user_id;
      const { receiver_id } = req.params;

      const result = await ChatService.markAsRead(user_id, receiver_id);

      new OK({
        message: 'Messages marked as read',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ChatController();
