'use strict';

const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError, BadRequestError } = require('../core/error.response');
const NotificationService = require('./notification.service');

class CommentService {
  /**
   * Create a comment or reply
   */
  static createComment = async (user_id, data) => {
    const { post_id, content, parent_id } = data;

    // check post existence
    const post = await db.Post.findByPk(post_id);
    if (!post) throw new NotFoundError('Post not found');

    const commenter = await db.User.findByPk(user_id, {
      attributes: ['username'],
    });

    // if replying, check parent comment
    if (parent_id) {
      const parent = await db.Comment.findByPk(parent_id);
      if (!parent) throw new NotFoundError('Parent comment not found');

      // Notify parent comment owner
      await NotificationService.createNotification(
        parent.user_id,
        'reply',
        `${commenter.username} replied to your comment.`,
        user_id
      );
    } else {
      // Notify post owner
      await NotificationService.createNotification(
        post.user_id,
        'comment',
        `${commenter.username} commented on your post.`,
        user_id
      );
    }

    const comment = await db.Comment.create({
      comment_id: uuidv4(),
      user_id,
      post_id,
      content,
      parent_id: parent_id || null,
    });

    return comment;
  };

  /**
   * Get all comments for a post (with nested replies)
   */
  static getCommentsByPost = async (post_id) => {
    const post = await db.Post.findByPk(post_id);
    if (!post) throw new NotFoundError('Post not found');

    // Fetch all comments of the post
    const comments = await db.Comment.findAll({
      where: { post_id },
      include: [{ model: db.User, attributes: ['user_id', 'username'] }],
      order: [['createdAt', 'ASC']],
    });

    // Build a tree recursively
    const nestedComments = CommentService.buildTree(comments);
    return nestedComments;
  };

  /**
   * Upvote / downvote comment (1 user = 1 vote rule)
   */
  static voteComment = async (user_id, comment_id, type) => {
    const comment = await db.Comment.findByPk(comment_id);
    if (!comment) throw new NotFoundError('Comment not found');

    // check if user already voted
    const existing = await db.CommentVote.findOne({
      where: { user_id, comment_id },
    });

    if (existing) {
      if (existing.type === type) {
        // remove vote (toggle off)
        await existing.destroy();
        comment[type === 'upvote' ? 'upvotes' : 'downvotes']--;
      } else {
        // switch vote
        existing.type = type;
        await existing.save();
        comment.upvotes =
          type === 'upvote' ? comment.upvotes + 1 : comment.upvotes - 1;
        comment.downvotes =
          type === 'downvote' ? comment.downvotes + 1 : comment.downvotes - 1;
      }
    } else {
      await db.CommentVote.create({ user_id, comment_id, type });
      if (type === 'upvote') comment.upvotes++;
      else comment.downvotes++;
    }

    await comment.save();
    return comment;
  };

  /**
   * Delete comment (only owner)
   */
  static deleteComment = async (user_id, comment_id) => {
    const comment = await db.Comment.findByPk(comment_id);
    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.user_id !== user_id)
      throw new BadRequestError(
        'You are not authorized to delete this comment'
      );

    await comment.destroy();
    return { message: 'Comment deleted successfully' };
  };

  static buildTree = (comments, parentId = null) => {
    return comments
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        ...c.toJSON(),
        replies: CommentService.buildTree(comments, c.comment_id),
      }));
  };
}

module.exports = CommentService;
