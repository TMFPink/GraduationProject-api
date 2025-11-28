'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const {
  BadRequestError,
  ConflictRequestError,
} = require('../core/error.response');
const { Op } = require('sequelize');
const NotificationService = require('./notification.service');

class FollowService {
  /**
   * Toggle follow/unfollow between the current user and a target user
   */
  static async toggleFollow(follower_id, following_id) {
    if (follower_id === following_id) {
      throw new BadRequestError('You cannot follow yourself');
    }

    const existing = await db.Follow.findOne({
      where: { follower_id, following_id },
    });

    if (existing) {
      await existing.destroy();
      return { isFollowing: false, message: 'Unfollowed successfully' };
    }

    const follow = await db.Follow.create({
      follow_id: generateUUID(),
      follower_id,
      following_id,
    });

    // Create notification
    if (follow) {
      const follower = await db.User.findByPk(follower_id, {
        attributes: ['username'],
      });
      await NotificationService.createNotification(
        following_id,
        'follow',
        `${follower.username} started following you.`,
        follower_id
      );
    }

    return { isFollowing: true, message: 'Followed successfully', follow };
  }

  /**
   * Get followers of a specific user (or current user if no id provided)
   */
  static async getFollowers(user_id, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Follow.findAndCountAll({
      where: { following_id: user_id },
      include: [
        {
          model: db.User,
          as: 'follower',
          attributes: ['user_id', 'username', 'userTag', 'email'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      total: count,
      page,
      limit,
      followers: rows.map((r) => r.follower),
    };
  }

  /**
   * Get users that this user is following
   */
  static async getFollowing(user_id, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Follow.findAndCountAll({
      where: { follower_id: user_id },
      include: [
        {
          model: db.User,
          as: 'following',
          attributes: ['user_id', 'username', 'userTag', 'email'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      total: count,
      page,
      limit,
      following: rows.map((r) => r.following),
    };
  }

  /**
   * Get current user's followers (using access token)
   */
  static async getMyFollowers(currentUser, page = 1, limit = 20) {
    return await FollowService.getFollowers(currentUser.user_id, page, limit);
  }

  /**
   * Get current user's following list (using access token)
   */
  static async getMyFollowing(currentUser, page = 1, limit = 20) {
    return await FollowService.getFollowing(currentUser.user_id, page, limit);
  }
}

module.exports = FollowService;
