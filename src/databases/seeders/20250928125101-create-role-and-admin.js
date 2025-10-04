'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create roles if not exists (fixed UUIDs for consistency)
    await queryInterface.sequelize.query(`
      INSERT INTO roles (role_id, name)
      VALUES 
        ('00000000-0000-0000-0000-000000000001', 'admin'),
        ('00000000-0000-0000-0000-000000000002', 'user')
      ON CONFLICT (name) DO NOTHING;
    `);

    // 2. Get the admin role id (existing or just inserted)
    const [roles] = await queryInterface.sequelize.query(`
      SELECT role_id FROM roles WHERE name = 'admin';
    `);
    const adminRoleId = roles[0].role_id;

    // 3. Check if admin user already exists
    const [users] = await queryInterface.sequelize.query(`
      SELECT * FROM users WHERE email = 'admin@gmail.com';
    `);

    if (users.length === 0) {
      const passwordHash = await bcrypt.hash('Adminmothaiba', 10);
      await queryInterface.bulkInsert('users', [
        {
          user_id: uuidv4(),
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@gmail.com',
          hash_password: passwordHash,
          phone_number: '0123456789',
          role_id: adminRoleId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      console.log('Admin user created.');
    } else {
      console.log('Admin user already exists, skipping creation.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: 'admin@gmail.com' }, {});
    await queryInterface.bulkDelete('roles', { name: ['admin', 'user'] }, {});
  }
};
