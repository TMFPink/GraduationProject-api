'use strict';

const express = require('express');
const router = express.Router();
const ChatController = require('../../controllers/chat.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

router.get('/list', verifyToken, asyncHandler(ChatController.getChatList));
router.get(
  '/:receiver_id',
  verifyToken,
  asyncHandler(ChatController.getChatHistory)
);
router.patch(
  '/:receiver_id/read',
  verifyToken,
  asyncHandler(ChatController.markAsRead)
);

module.exports = router;
