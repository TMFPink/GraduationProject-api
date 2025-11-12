'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const PostController = require('../../controllers/post.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

// Configure multer for thumbnail uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for thumbnails
  },
});

router.post(
  '/',
  verifyToken,
  upload.single('thumbnail'),
  asyncHandler(PostController.createPost)
);
router.put(
  '/:id',
  verifyToken,
  upload.single('thumbnail'),
  asyncHandler(PostController.updatePost)
);
router.get('/', verifyToken, asyncHandler(PostController.getAllPosts));
router.get(
  '/user/:id',
  verifyToken,
  asyncHandler(PostController.getPostsByUser)
);
router.post(
  '/:id/upvote',
  verifyToken,
  asyncHandler(PostController.upvotePost)
);
router.post(
  '/:id/downvote',
  verifyToken,
  asyncHandler(PostController.downvotePost)
);
router.delete('/:id', verifyToken, asyncHandler(PostController.deletePost));

module.exports = router;
