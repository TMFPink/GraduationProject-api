'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { NotFoundError, BadRequestError } = require('../core/error.response');
const ImageService = require('./image.service');
const NotificationService = require('./notification.service');

// Helper function to convert tags string to array
const parseTagsInput = (tags) => {
  if (!tags) return null;
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  return null;
};

class PostService {
  static createPost = async (user_id, postData, thumbnailFile) => {
    const transaction = await db.sequelize.transaction();

    try {
      let thumbnailUrl = null;

      // Handle thumbnail upload if provided
      if (thumbnailFile) {
        const thumbnailResult = await ImageService.uploadThumbnail(
          generateUUID(),
          thumbnailFile
        );
        if (thumbnailResult.success) {
          thumbnailUrl = thumbnailResult.avatarUrl;
        }
      }

      // Parse tags from string to array
      const parsedTags = parseTagsInput(postData.tags);

      const post = await db.Post.create(
        {
          post_id: generateUUID(),
          user_id,
          title: postData.title,
          content: postData.content,
          thumbnail: thumbnailUrl || postData.thumbnail,
          media_url: postData.media_url,
          tags: parsedTags,
          upvotes: 0,
          downvotes: 0,
        },
        { transaction }
      );

      await transaction.commit();
      return { message: 'Post created successfully', post };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  static updatePost = async (user_id, post_id, updateData, thumbnailFile) => {
    const transaction = await db.sequelize.transaction();

    try {
      const post = await db.Post.findOne({
        where: { post_id, user_id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!post) {
        throw new NotFoundError(
          'Post not found or you are not authorized to update it'
        );
      }

      const updateFields = {};

      // Handle regular field updates
      if (updateData.title) updateFields.title = updateData.title;
      if (updateData.content) updateFields.content = updateData.content;
      if (updateData.media_url) updateFields.media_url = updateData.media_url;
      if (updateData.tags) updateFields.tags = parseTagsInput(updateData.tags);

      // Handle thumbnail upload
      if (thumbnailFile) {
        // Delete old thumbnail if exists
        if (post.thumbnail) {
          await ImageService.deleteAvatar(post.thumbnail);
        }

        // Upload new thumbnail
        const thumbnailResult = await ImageService.uploadThumbnail(
          post_id,
          thumbnailFile
        );
        if (thumbnailResult.success) {
          updateFields.thumbnail = thumbnailResult.avatarUrl;
        }
      }

      // Update post
      await post.update(updateFields, { transaction });

      await transaction.commit();
      return { message: 'Post updated successfully', post };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  static getAllPosts = async (page = 1, limit = 10, current_user_id = null) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Post.findAndCountAll({
      include: [{ model: db.User, attributes: ['user_id', 'username'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const posts = rows.map((post) => post.toJSON());

    if (current_user_id) {
      const postIds = posts.map((post) => post.post_id);
      const votes = await db.PostVote.findAll({
        where: {
          post_id: postIds,
          user_id: current_user_id,
        },
        raw: true,
      });

      const votesMap = votes.reduce((acc, vote) => {
        acc[vote.post_id] = vote.value;
        return acc;
      }, {});

      posts.forEach((post) => {
        const voteValue = votesMap[post.post_id];
        post.isUpvoted = voteValue === 1;
        post.isDownvoted = voteValue === -1;
      });
    } else {
      posts.forEach((post) => {
        post.isUpvoted = false;
        post.isDownvoted = false;
      });
    }

    return { total: count, page, limit, posts };
  };

  static getPostsByUser = async (
    user_id,
    page = 1,
    limit = 10,
    current_user_id = null
  ) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Post.findAndCountAll({
      where: { user_id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const posts = rows.map((post) => post.toJSON());

    if (current_user_id) {
      const postIds = posts.map((post) => post.post_id);
      const votes = await db.PostVote.findAll({
        where: {
          post_id: postIds,
          user_id: current_user_id,
        },
        raw: true,
      });

      const votesMap = votes.reduce((acc, vote) => {
        acc[vote.post_id] = vote.value;
        return acc;
      }, {});

      posts.forEach((post) => {
        const voteValue = votesMap[post.post_id];
        post.isUpvoted = voteValue === 1;
        post.isDownvoted = voteValue === -1;
      });
    } else {
      posts.forEach((post) => {
        post.isUpvoted = false;
        post.isDownvoted = false;
      });
    }

    return { total: count, page, limit, posts };
  };

  static getPostById = async (post_id, current_user_id = null) => {
    const post = await db.Post.findByPk(post_id, {
      include: [{ model: db.User, attributes: ['user_id', 'username'] }],
    });
    if (!post) throw new NotFoundError('Post not found');

    const postJSON = post.toJSON();

    if (current_user_id) {
      const vote = await db.PostVote.findOne({
        where: {
          post_id,
          user_id: current_user_id,
        },
      });
      postJSON.isUpvoted = vote ? vote.value === 1 : false;
      postJSON.isDownvoted = vote ? vote.value === -1 : false;
    } else {
      postJSON.isUpvoted = false;
      postJSON.isDownvoted = false;
    }

    return postJSON;
  };

  /**
   * Vote on a post (toggle/switch-safe).
   * type === 'upvote' or 'downvote'
   */
  static votePost = async (user_id, post_id, type) => {
    const t = await db.sequelize.transaction();
    try {
      const post = await db.Post.findByPk(post_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!post) throw new NotFoundError('Post not found');

      const voteValue = type === 'upvote' ? 1 : type === 'downvote' ? -1 : null;
      if (voteValue === null) throw new BadRequestError('Invalid vote type');

      const existing = await db.PostVote.findOne({
        where: { user_id, post_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const isSelfVote = post.user_id === user_id;

      if (!existing) {
        // create vote
        await db.PostVote.create(
          {
            vote_id: generateUUID(),
            user_id,
            post_id,
            value: voteValue,
          },
          { transaction: t }
        );

        if (voteValue === 1) post.upvotes = (post.upvotes || 0) + 1;
        else post.downvotes = (post.downvotes || 0) + 1;

        if (!isSelfVote) {
          const voter = await db.User.findByPk(user_id, {
            attributes: ['username'],
          });
          await NotificationService.createNotification(
            post.user_id,
            type,
            `${voter.username} ${type}d your post.`
          );
        }

        await post.save({ transaction: t });
        await t.commit();
        return { message: `${type} successful`, post };
      }

      // existing vote present
      if (existing.value === voteValue) {
        // toggle off -> remove vote
        await existing.destroy({ transaction: t });

        if (voteValue === 1)
          post.upvotes = Math.max(0, (post.upvotes || 0) - 1);
        else post.downvotes = Math.max(0, (post.downvotes || 0) - 1);

        await post.save({ transaction: t });
        await t.commit();
        return { message: `${type} removed`, post };
      }

      // existing is opposite vote -> switch
      // e.g. existing = -1, voteValue = 1 => convert downvote -> upvote
      existing.value = voteValue;
      await existing.save({ transaction: t });

      if (voteValue === 1) {
        // switch from downvote to upvote
        post.upvotes = (post.upvotes || 0) + 1;
        post.downvotes = Math.max(0, (post.downvotes || 0) - 1);
      } else {
        post.downvotes = (post.downvotes || 0) + 1;
        post.upvotes = Math.max(0, (post.upvotes || 0) - 1);
      }

      if (!isSelfVote) {
        const voter = await db.User.findByPk(user_id, {
          attributes: ['username'],
        });
        await NotificationService.createNotification(
          post.user_id,
          type,
          `${voter.username} ${type}d your post.`
        );
      }

      await post.save({ transaction: t });
      await t.commit();
      return { message: `${type} updated`, post };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  };

  /**
   * Delete a post (only owner can delete)
   */
  static deletePost = async (user_id, post_id) => {
    const transaction = await db.sequelize.transaction();

    try {
      const post = await db.Post.findByPk(post_id, { transaction });
      if (!post) throw new NotFoundError('Post not found');

      if (post.user_id !== user_id) {
        throw new BadRequestError('You are not authorized to delete this post');
      }

      // Delete thumbnail if exists
      if (post.thumbnail) {
        await ImageService.deleteAvatar(post.thumbnail);
      }

      await post.destroy({ transaction });
      await transaction.commit();

      return { message: 'Post deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
}

module.exports = PostService;
