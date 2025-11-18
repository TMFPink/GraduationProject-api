const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * removeColumn(last_name) => "users"
 * removeColumn(first_name) => "users"
 * addColumn(cover_url) => "users"
 * addColumn(bio) => "users"
 * addColumn(userTag) => "users"
 * addColumn(username) => "users"
 *
 */

const info = {
  revision: 13,
  name: "user-modify",
  created: "2025-11-18T14:01:07.773Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["users", "last_name", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["users", "first_name", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "users",
      "cover_url",
      { type: Sequelize.STRING, field: "cover_url", allowNull: true },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "users",
      "bio",
      { type: Sequelize.TEXT, field: "bio", allowNull: true },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "users",
      "userTag",
      { type: Sequelize.STRING, field: "userTag", allowNull: false,defaultValue:'' },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "users",
      "username",
      { type: Sequelize.STRING, field: "username", allowNull: false, defaultValue:'' },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["users", "cover_url", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["users", "bio", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["users", "userTag", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["users", "username", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "users",
      "last_name",
      { type: Sequelize.STRING, field: "last_name", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "users",
      "first_name",
      { type: Sequelize.STRING, field: "first_name", allowNull: false },
      { transaction },
    ],
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
