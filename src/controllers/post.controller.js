'use strict';

const PostService = require('../services/post.service');
const { OK, CREATED } = require('../core/success.response');

class PostController {
  // Create a new post
  static createPost = async (req, res) => {
    const result = await PostService.createPost(req.user.user_id, req.body);
    new CREATED({ message: result.message, metadata: result.post }).send(res);
  };

  // Get all posts (for feed)
  static getAllPosts = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await PostService.getAllPosts(page, limit);
    new OK({
      message: 'All posts fetched successfully',
      metadata: result,
    }).send(res);
  };

  // Get posts created by a specific user
  static getPostsByUser = async (req, res) => {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    const result = await PostService.getPostsByUser(userId, page, limit);
    new OK({
      message: 'User posts fetched successfully',
      metadata: result,
    }).send(res);
  };

  static upvotePost = async (req, res) => {
    const postId = req.params.id;
    const result = await PostService.votePost(
      req.user.user_id,
      postId,
      'upvote'
    );
    new OK({ message: result.message, metadata: result.post }).send(res);
  };

  static downvotePost = async (req, res) => {
    const postId = req.params.id;
    const result = await PostService.votePost(
      req.user.user_id,
      postId,
      'downvote'
    );
    new OK({ message: result.message, metadata: result.post }).send(res);
  };

  static deletePost = async (req, res) => {
    const postId = req.params.id;
    const result = await PostService.deletePost(req.user.user_id, postId);
    new OK({ message: result.message }).send(res);
  };
}

module.exports = PostController;
