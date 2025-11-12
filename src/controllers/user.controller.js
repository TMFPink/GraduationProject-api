'use strict';

const { OK, CREATED } = require('../core/success.response');
const UserService = require('../services/user.service');

class UserController {
  create_user = async (req, res, next) => {
    new CREATED({
      message: 'User created successfully',
      metadata: await UserService.create(req.body),
    }).send(res);
  };

  get_list_users = async (req, res, next) => {
    new OK({
      message: 'Users retrieved successfully',
      metadata: await UserService.get_all(req.user),
    }).send(res);
  };

  update_user = async (req, res, next) => {
    const userId = req.params.id || req.user.user_id; // Allow updating own profile or by ID
    const avatarFile = req.file; // Multer adds this

    new OK({
      message: 'User updated successfully',
      metadata: await UserService.update(userId, req.body, avatarFile),
    }).send(res);
  };

  update_current_user = async (req, res, next) => {
    const avatarFile = req.file; // Multer adds this

    new OK({
      message: 'Profile updated successfully',
      metadata: await UserService.update(
        req.user.user_id,
        req.body,
        avatarFile
      ),
    }).send(res);
  };

  delete_user = async (req, res, next) => {
    new OK({
      message: 'Users deleted successfully',
      metadata: await UserService.delete(req.params.id),
    }).send(res);
  };

  get_current_user = async (req, res, next) => {
    new OK({
      message: 'User retrieved successfully',
      metadata: await UserService.get_basic_infor(req.user.user_id),
    }).send(res);
  };

  get_user_by_id = async (req, res, next) => {
    new OK({
      message: 'User retrieved successfully',
      metadata: await UserService.getUserDetails(req.params.id),
    }).send(res);
  };
}

module.exports = new UserController();
