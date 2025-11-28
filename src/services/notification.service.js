'use strict';

const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { getIO } = require('../utils/socketSingleton');
class NotificationService {
  /**
   * Create a notification
   * Example: NotificationService.createNotification(user_id, "FOLLOW", "User X followed you")
   */
  static createNotification = async (user_id, type, content) => {
    const notification = await db.Notification.create({
      notification_id: uuidv4(),
      user_id,
      type,
      content,
      is_read: false,
    });

    const io = getIO();
    io.to(user_id).emit('notification:new', notification);
    console.log(`Emitted notification:new to user ${user_id}`);

    return notification;
  };

  /**
   * Get notifications for a user
   */
  static getNotifications = async (user_id, page = 1, limit = 20) => {
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Notification.findAndCountAll({
      where: { user_id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      total: count,
      page,
      limit,
      notifications: rows,
    };
  };

  /**
   * Mark ONE notification as read
   */
  static markAsRead = async (user_id, notification_id) => {
    const [updated] = await db.Notification.update(
      { is_read: true },
      {
        where: {
          user_id,
          notification_id,
          is_read: false,
        },
      }
    );

    return { updated };
  };

  /**
   * Mark ALL notifications as read for a user
   */
  static markAllAsRead = async (user_id) => {
    const [updated] = await db.Notification.update(
      { is_read: true },
      {
        where: {
          user_id,
          is_read: false,
        },
      }
    );

    return { updated };
  };
}

module.exports = NotificationService;
