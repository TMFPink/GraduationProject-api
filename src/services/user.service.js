'use strict';
const db = require('../models');
const { BadRequestError } = require('../core/error.response');
const { includes } = require('lodash');
const { Op } = require('sequelize');
const ImageService = require('./image.service');

class UserService {
  static create = async ({
    user_id,
    first_name,
    last_name,
    email,
    hash_password,
    phone_number,
    role_name = 'user',
  }) => {
    // t sửa password thành hash_password để test
    const { role_id } = await db.Role.findOne({
      where: { name: role_name },
      attributes: ['role_id'],
      raw: true,
    });
    if (!role_id) throw new BadRequestError('role id not found');
    const user = await db.User.create({
      user_id: user_id,
      first_name,
      last_name,
      email,
      hash_password,
      phone_number,
      role_id,
    });
    if (!user) {
      throw new BadRequestError(
        'Failed to create user! Something went wrong! Please try again!'
      );
    }
    return user;
  };

  static get_all = async (requestingUser) => {
    if (!requestingUser)
      throw new BadRequestError('requesting user is required');

    const where = {};

    const currentUser = await db.User.findOne({
      where: { user_id: requestingUser.user_id },
      include: [
        { model: db.Role, attributes: ['name'] }, // 'admin' or 'user'
      ],
      raw: true,
      nest: true,
    });

    // if normal user
    if (currentUser.Role?.name === 'user') {
      where.role_id = await db.Role.findOne({
        where: { name: 'user' },
        attributes: ['role_id'],
        raw: true,
      }).then((r) => r.role_id);

      // exclude self + blocked users
      const blocked = await db.Block.findAll({
        where: { blocker_id: currentUser.user_id },
        attributes: ['blocked_id'],
        raw: true,
      });
      const blockedIds = blocked.map((b) => b.blocked_id);

      where.user_id = {
        [Op.and]: [
          { [Op.ne]: currentUser.user_id },
          { [Op.notIn]: blockedIds },
        ],
      };
    }

    // if admin
    if (currentUser.Role?.name === 'admin') {
      where.user_id = { [Op.ne]: currentUser.user_id };
    }

    return await db.User.findAll({
      where,
      attributes: ['user_id', 'first_name', 'last_name', 'email'],
      raw: true,
    });
  };

  static update = async (user_id, updateData, avatarFile = null) => {
    const transaction = await db.sequelize.transaction();

    try {
      // Find the user first
      const user = await db.User.findOne({
        where: { user_id },
        transaction,
      });

      if (!user) {
        throw new BadRequestError('User not found');
      }

      const updateFields = {};

      // Handle regular field updates
      if (updateData.first_name)
        updateFields.first_name = updateData.first_name;
      if (updateData.last_name) updateFields.last_name = updateData.last_name;
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.phone_number)
        updateFields.phone_number = updateData.phone_number;

      // Handle password update
      if (updateData.hash_password) {
        updateFields.hash_password = updateData.hash_password;
      }

      // Handle role update
      if (updateData.role_name) {
        const role = await db.Role.findOne({
          where: { name: updateData.role_name },
          attributes: ['role_id'],
          raw: true,
          transaction,
        });
        if (!role) throw new BadRequestError('Role not found');
        updateFields.role_id = role.role_id;
      }

      // Handle avatar upload
      if (avatarFile) {
        // Delete old avatar if exists
        if (user.avatar_url) {
          await ImageService.deleteAvatar(user.avatar_url);
        }

        // Upload new avatar
        const avatarResult = await ImageService.uploadAvatar(
          user_id,
          avatarFile
        );
        if (avatarResult.success) {
          updateFields.avatar_url = avatarResult.avatarUrl;
        }
      }

      // Update user
      const [affectedRows] = await db.User.update(updateFields, {
        where: { user_id },
        transaction,
      });

      if (affectedRows === 0) {
        throw new BadRequestError('Failed to update user');
      }

      await transaction.commit();

      // Return updated user data
      const updatedUser = await db.User.findOne({
        where: { user_id },
        attributes: [
          'user_id',
          'first_name',
          'last_name',
          'email',
          'phone_number',
          'avatar_url',
        ],
        raw: true,
      });

      return updatedUser;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  static delete = async (id) => {
    const user = await db.User.destroy({
      where: { id },
    });
    if (!user) throw new BadRequestError('failed to delete user');
    return user;
  };

  static get_basic_infor = async (user_id) => {
    const user = await db.User.findOne({
      where: { user_id },
      attributes: ['first_name', 'last_name', 'email', 'avatar_url'],
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    return {
      name: user.first_name + ' ' + user.last_name,
      email: user.email,
      avatar_url: user.avatar_url,
      user_id,
    };
  };

  static getUserDetails = async (user_id, fields) => {
    const options = {
      where: { user_id: user_id },
      raw: true,
    };

    if (fields && fields.length > 0) {
      options.attributes = fields;
    } else {
      // Include avatar_url in default fields
      options.attributes = [
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'avatar_url',
      ];
    }

    const user = await db.User.findOne(options);
    if (!user) throw new BadRequestError('User not found');
    return user;
  };
}

module.exports = UserService;
