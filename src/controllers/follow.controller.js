'use strict';

const { OK } = require('../core/success.response');
const FollowService = require('../services/follow.service');

class FollowController {
  /**
   * Toggle follow/unfollow another user
   * POST /follow/toggle
   */
  toggleFollow = async (req, res, next) => {
    try {
      const follower_id = req.user.user_id;
      const { following_id } = req.body;

      if (!following_id) {
        return new OK({
          message: 'Missing following_id in request body',
          metadata: null,
        }).send(res);
      }

      const result = await FollowService.toggleFollow(
        follower_id,
        following_id
      );

      new OK({
        message: result.message,
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get followers of a specific user
   * GET /follow/:id/followers
   */
  getFollowers = async (req, res, next) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await FollowService.getFollowers(id, page, limit);

      new OK({
        message: 'Followers retrieved successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get users that a specific user is following
   * GET /follow/:id/following
   */
  getFollowing = async (req, res, next) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await FollowService.getFollowing(id, page, limit);

      new OK({
        message: 'Following retrieved successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get followers of the current user
   * GET /follow/me/followers
   */
  getMyFollowers = async (req, res, next) => {
    try {
      const user = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await FollowService.getMyFollowers(user, page, limit);

      new OK({
        message: 'Your followers retrieved successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get who the current user is following
   * GET /follow/me/following
   */
  getMyFollowing = async (req, res, next) => {
    try {
      const user = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await FollowService.getMyFollowing(user, page, limit);

      new OK({
        message: 'Your following list retrieved successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new FollowController();
