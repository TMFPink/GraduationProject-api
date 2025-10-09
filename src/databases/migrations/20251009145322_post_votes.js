const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "post_votes", deps: [users, posts]
 *
 */

const info = {
  revision: 6,
  name: "post_votes",
  created: "2025-10-09T14:53:22.045Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "post_votes",
      {
        vote_id: { type: Sequelize.UUID, field: "vote_id", primaryKey: true },
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "user_id",
        },
        post_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "posts", key: "post_id" },
          allowNull: true,
          field: "post_id",
        },
        value: { type: Sequelize.INTEGER, field: "value" },
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
    params: ["post_votes", { transaction }],
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
