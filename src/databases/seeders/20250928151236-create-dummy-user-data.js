'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up (queryInterface, Sequelize) {
    // Get the user role_id from the roles table
    const [roles] = await queryInterface.sequelize.query(
      `SELECT role_id FROM roles WHERE name = 'user' LIMIT 1;`
    );
    const userRoleId = roles[0]?.role_id;

    // Generate fake users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      users.push({
        user_id: uuidv4(),
        first_name: `User-${i}`,
        last_name: `Test${i}`,
        email: `user${i}@example.com`,
        hash_password: await bcrypt.hash('Password123', 10),
        phone_number: `09000000${i}`,
        role_id: userRoleId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('users', users, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.like]: 'user%@example.com'
      }
    }, {});
  }
};