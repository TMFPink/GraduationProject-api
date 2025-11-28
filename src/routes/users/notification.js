'use strict';

const express = require('express');
const router = express.Router();
const NotificationController = require('../../controllers/notification.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

router.post('/', NotificationController.createNotification);
router.get(
  '/',
  verifyToken,
  asyncHandler(NotificationController.getNotifications)
);
router.patch(
  '/:id/read',
  verifyToken,
  asyncHandler(NotificationController.markAsRead)
);
router.patch(
  '/read-all',
  verifyToken,
  asyncHandler(NotificationController.markAllAsRead)
);

module.exports = router;
