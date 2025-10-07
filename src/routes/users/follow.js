'use strict';

const express = require('express');
const router = express.Router();
const FollowController = require('../../controllers/follow.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

// ----------------------
// Follow toggle
// ----------------------
router.post(
  '/toggle',
  verifyToken,
  asyncHandler(FollowController.toggleFollow)
);

// ----------------------
// Get current user's followers (using access token)
// ----------------------
router.get(
  '/me/followers',
  verifyToken,
  asyncHandler(async (req, res, next) => {
    const { page, limit } = req.query;
    new (require('../../core/success.response').OK)({
      message: 'Followers retrieved successfully',
      metadata: await require('../../services/follow.service').getFollowers(
        req.user.user_id,
        page,
        limit
      ),
    }).send(res);
  })
);

// ----------------------
// Get current user's following (using access token)
// ----------------------
router.get(
  '/me/following',
  verifyToken,
  asyncHandler(async (req, res, next) => {
    const { page, limit } = req.query;
    new (require('../../core/success.response').OK)({
      message: 'Following retrieved successfully',
      metadata: await require('../../services/follow.service').getFollowing(
        req.user.user_id,
        page,
        limit
      ),
    }).send(res);
  })
);

// ----------------------
// Get followers of a specific user by ID
// ----------------------
router.get(
  '/:id/followers',
  verifyToken,
  asyncHandler(FollowController.getFollowers)
);

// ----------------------
// Get users a specific user is following
// ----------------------
router.get(
  '/:id/following',
  verifyToken,
  asyncHandler(FollowController.getFollowing)
);

module.exports = router;
