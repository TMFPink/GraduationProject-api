const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "permissions", deps: []
 * createTable() => "roles", deps: []
 * createTable() => "role_permissions", deps: [roles, permissions]
 * createTable() => "users", deps: [roles]
 *
 */

const info = {
  revision: 1,
  name: "init-table",
  created: "2025-09-28T03:53:12.531Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "permissions",
      {
        permission_id: {
          type: Sequelize.UUID,
          field: "permission_id",
          primaryKey: true,
        },
        path: {
          type: Sequelize.STRING,
          field: "path",
          unique: true,
          allowNull: false,
        },
        method: { type: Sequelize.STRING, field: "method", allowNull: false },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "roles",
      {
        role_id: { type: Sequelize.UUID, field: "role_id", primaryKey: true },
        name: {
          type: Sequelize.ENUM("admin", "user"),
          field: "name",
          unique: true,
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "role_permissions",
      {
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: false,
        },
        role_id: {
          type: Sequelize.UUID,
          field: "role_id",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "roles", key: "role_id" },
          primaryKey: true,
        },
        permission_id: {
          type: Sequelize.UUID,
          field: "permission_id",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "permissions", key: "permission_id" },
          primaryKey: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "users",
      {
        user_id: { type: Sequelize.UUID, field: "user_id", primaryKey: true },
        email: { type: Sequelize.STRING, field: "email", allowNull: false },
        hash_password: {
          type: Sequelize.STRING,
          field: "hash_password",
          allowNull: false,
        },
        first_name: {
          type: Sequelize.STRING,
          field: "first_name",
          allowNull: false,
        },
        last_name: {
          type: Sequelize.STRING,
          field: "last_name",
          allowNull: false,
        },
        phone_number: {
          type: Sequelize.STRING,
          field: "phone_number",
          allowNull: false,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          field: "is_active",
          defaultValue: true,
        },
        refresh_token: {
          type: Sequelize.TEXT,
          field: "refresh_token",
          allowNull: true,
        },
        role_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "roles", key: "role_id" },
          field: "role_id",
          allowNull: true,
        },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "dropTable",
    params: ["permissions", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["roles", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["role_permissions", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["users", { transaction }],
  },
];

const pos = 0;
const useTransaction = true;

const execute = (queryInterface, sequelize, _commands) => {
  let index = pos;
  const run = (transaction) => {
    const commands = _commands(transaction);
    return new Promise((resolve, reject) => {
      const next = () => {
        if (index < commands.length) {
          const command = commands[index];
          console.log(`[#${index}] execute: ${command.fn}`);
          index++;
          queryInterface[command.fn](...command.params).then(next, reject);
        } else resolve();
      };
      next();
    });
  };
  if (useTransaction) return queryInterface.sequelize.transaction(run);
  return run(null);
};

module.exports = {
  pos,
  useTransaction,
  up: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, migrationCommands),
  down: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, rollbackCommands),
  info,
};
