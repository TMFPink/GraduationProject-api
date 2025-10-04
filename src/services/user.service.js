'use strict';
const db = require('../models');
const { BadRequestError } = require('../core/error.response');
const { includes } = require('lodash');
const { Op } = require('sequelize');

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

    console.log(currentUser);

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

  static update = async (id, { username, email, hash_password, role_name }) => {
    const { role_id } = await db.Role.findOne({
      where: { name: role_name },
      attributes: [['id', 'role_id']],
      raw: true,
    });
    if (!role_id) throw new BadRequestError('role id not found');
    const user = await db.User.update(
      {
        username,
        email,
        hash_password,
        role_id,
      },
      {
        where: { id },
      }
    );
    if (!user) throw new BadRequestError('failed to update user');
    return user;
  };

  static delete = async (id) => {
    const user = await db.User.destroy({
      where: { id },
    });
    if (!user) throw new BadRequestError('failed to delete user');
    return user;
  };

  static get_basic_infor = async (user_id) => {
    //Username
    const { first_name, last_name } = await db.User.findOne({
      where: { user_id },
    });

    //Notifications
    //

    return {
      name: first_name + ' ' + last_name,
    };
  };

  static getUserDetails = async (user_id, fields) => {
    const options = {
      where: { user_id: user_id },
      raw: true,
    };
    if (fields && fields.length > 0) {
      options.attributes = fields;
    }
    const user = await db.User.findOne(options);
    if (!user) throw new BadRequestError('User not found');
    return user;
  };
}

module.exports = UserService;
