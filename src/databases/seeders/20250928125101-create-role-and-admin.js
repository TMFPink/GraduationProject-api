'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Insert roles with UUIDs
    const adminRoleId = uuidv4();
    const userRoleId = uuidv4();
    const roles = [
      { role_id: adminRoleId, name: 'admin' },
      { role_id: userRoleId, name: 'user' }
    ];
    await queryInterface.bulkInsert('roles', roles, {});

    // 2. Insert admin user with adminRoleId
    const adminUserId = uuidv4();
    const passwordHash = await bcrypt.hash('Adminmothaiba', 10); 
    await queryInterface.bulkInsert('users', [
      {
        user_id: adminUserId, // Add this line
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@gmail.com',
        hash_password: passwordHash,
        phone_number: '0123456789',
        role_id: adminRoleId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: 'admin@gmail.com' }, {});
    await queryInterface.bulkDelete('roles', { name: ['admin', 'user'] }, {});
  }
};