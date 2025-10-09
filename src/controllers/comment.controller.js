'use strict';

const CommentService = require('../services/comment.service');
const { OK, CREATED } = require('../core/success.response');

class CommentController {
  static createComment = async (req, res) => {
    const result = await CommentService.createComment(
      req.user.user_id,
      req.body
    );
    new CREATED({
      message: 'Comment created successfully',
      metadata: result,
    }).send(res);
  };

  static getCommentsByPost = async (req, res) => {
    const comments = await CommentService.getCommentsByPost(req.params.post_id);
    new OK({
      message: 'Comments fetched successfully',
      metadata: comments,
    }).send(res);
  };

  static upvoteComment = async (req, res) => {
    const comment = await CommentService.voteComment(
      req.user.user_id,
      req.params.id,
      'upvote'
    );
    new OK({ message: 'Comment upvoted', metadata: comment }).send(res);
  };

  static downvoteComment = async (req, res) => {
    const comment = await CommentService.voteComment(
      req.user.user_id,
      req.params.id,
      'downvote'
    );
    new OK({ message: 'Comment downvoted', metadata: comment }).send(res);
  };

  static deleteComment = async (req, res) => {
    const result = await CommentService.deleteComment(
      req.user.user_id,
      req.params.id
    );
    new OK({ message: result.message }).send(res);
  };
}

module.exports = CommentController;
