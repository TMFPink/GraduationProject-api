'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { NotFoundError, BadRequestError } = require('../core/error.response');

class PostService {
  static createPost = async (
    user_id,
    { title, content, thumbnail, media_url, tags }
  ) => {
    const post = await db.Post.create({
      post_id: generateUUID(),
      user_id,
      title,
      content,
      thumbnail,
      media_url,
      tags,
      upvotes: 0,
      downvotes: 0,
    });

    return { message: 'Post created successfully', post };
  };

  static getAllPosts = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Post.findAndCountAll({
      include: [{ model: db.User, attributes: ['user_id', 'first_name'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return { total: count, page, limit, posts: rows };
  };

  static getPostsByUser = async (user_id, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Post.findAndCountAll({
      where: { user_id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return { total: count, page, limit, posts: rows };
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

      // Helper to safely decrement (no negatives)
      const safeDec = (n) => (n > 0 ? n - 1 : 0);

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
    const post = await db.Post.findByPk(post_id);
    if (!post) throw new NotFoundError('Post not found');

    if (post.user_id !== user_id) {
      throw new BadRequestError('You are not authorized to delete this post');
    }

    await post.destroy();

    return { message: 'Post deleted successfully' };
  };
}

module.exports = PostService;
