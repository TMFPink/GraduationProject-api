'use strict';

const { OK, CREATED } = require('../core/success.response');
const NotificationService = require('../services/notification.service');

class NotificationController {
  /**
   * POST /notifications
   * Create a notification (useful for testing)
   */
  createNotification = async (req, res, next) => {
    try {
      const { user_id, type, content } = req.body;

      if (!user_id || !type || !content) {
        return res.status(400).json({
          message: 'Missing required fields: user_id, type, content',
        });
      }

      const metadata = await NotificationService.createNotification(
        user_id,
        type,
        content
      );

      return new CREATED({
        message: 'Notification created successfully',
        metadata,
      }).send(res);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /notifications
   * Fetch paginated notifications for the authenticated user
   */
  getNotifications = async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const metadata = await NotificationService.getNotifications(
        req.user.user_id,
        page,
        limit
      );

      return new OK({
        message: 'Notifications retrieved successfully',
        metadata,
      }).send(res);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /notifications/:id/read
   * Mark ONE notification as read
   */
  markAsRead = async (req, res, next) => {
    try {
      const { id } = req.params;

      const metadata = await NotificationService.markAsRead(
        req.user.user_id,
        id
      );

      return new OK({
        message: 'Notification marked as read',
        metadata,
      }).send(res);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /notifications/read-all
   * Mark ALL notifications as read
   */
  markAllAsRead = async (req, res, next) => {
    try {
      const metadata = await NotificationService.markAllAsRead(
        req.user.user_id
      );

      return new OK({
        message: 'All notifications marked as read',
        metadata,
      }).send(res);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new NotificationController();
