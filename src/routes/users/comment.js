'use strict';

const express = require('express');
const router = express.Router();
const CommentController = require('../../controllers/comment.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

router.post('/', verifyToken, asyncHandler(CommentController.createComment));
router.get(
  '/post/:post_id',
  verifyToken,
  asyncHandler(CommentController.getCommentsByPost)
);
router.post(
  '/:id/upvote',
  verifyToken,
  asyncHandler(CommentController.upvoteComment)
);
router.post(
  '/:id/downvote',
  verifyToken,
  asyncHandler(CommentController.downvoteComment)
);
router.delete(
  '/:id',
  verifyToken,
  asyncHandler(CommentController.deleteComment)
);

module.exports = router;
