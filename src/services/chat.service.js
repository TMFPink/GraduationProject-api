'use strict';

const db = require('../models');
const { Op } = require('sequelize');
const { BadRequestError } = require('../core/error.response');

class ChatService {
  /**
   * Get chat list for current user
   * Returns all partners with last message + unread count
   */
  static async getChatList(user_id, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const messages = await db.Message.findAll({
      where: {
        [Op.or]: [{ sender_id: user_id }, { receiver_id: user_id }],
      },
      order: [['createdAt', 'DESC']],
    });

    const chatMap = new Map();

    for (const msg of messages) {
      const partner_id =
        msg.sender_id === user_id ? msg.receiver_id : msg.sender_id;

      if (!chatMap.has(partner_id)) {
        chatMap.set(partner_id, {
          user_id: partner_id,
          last_message: msg.content,
          last_message_time: msg.createdAt,
          unread_count: 0,
        });
      }

      // count unread messages
      if (msg.receiver_id === user_id && !msg.is_read) {
        chatMap.get(partner_id).unread_count += 1;
      }
    }

    const partners = Array.from(chatMap.values());

    // Fetch user info (name, avatar) for each partner
    const userIds = partners.map((p) => p.user_id);
    const users = await db.User.findAll({
      where: { user_id: userIds },
      attributes: ['user_id', 'username', 'userTag'],
    });

    const result = partners.map((p) => {
      const user = users.find((u) => u.user_id === p.user_id);
      return {
        ...p,
        username: user?.username,
        userTag: user?.userTag,
        // avatar_url: user?.avatar_url,
      };
    });

    return {
      total: result.length,
      page,
      limit,
      chat_list: result.slice(offset, offset + limit),
    };
  }

  /**
   * Get chat history between current user and target
   */
  static async getChatHistory(user_id, receiver_id, page = 1, limit = 20) {
    if (!receiver_id) throw new BadRequestError('Receiver ID is required');

    const offset = (page - 1) * limit;

    const { count, rows } = await db.Message.findAndCountAll({
      where: {
        [Op.or]: [
          { sender_id: user_id, receiver_id },
          { sender_id: receiver_id, receiver_id: user_id },
        ],
      },
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    return {
      total: count,
      page,
      limit,
      messages: rows,
    };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(user_id, sender_id) {
    if (!sender_id) throw new BadRequestError('Sender ID is required');

    const [updated] = await db.Message.update(
      { is_read: true },
      {
        where: {
          sender_id,
          receiver_id: user_id,
          is_read: false,
        },
      }
    );

    return { updated };
  }
}

module.exports = ChatService;
