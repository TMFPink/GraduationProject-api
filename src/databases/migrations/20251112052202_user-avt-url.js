const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "owned_cards", deps: [users, cards]
 * addColumn(avatar_url) => "users"
 *
 */

const info = {
  revision: 12,
  name: "user-avt-url",
  created: "2025-11-12T05:22:02.821Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "owned_cards",
      {
        owned_card_id: {
          type: Sequelize.UUID,
          field: "owned_card_id",
          primaryKey: true,
        },
        card_domain_id: {
          type: Sequelize.UUID,
          field: "card_domain_id",
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          field: "user_id",
          allowNull: false,
        },
        card_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "cards", key: "card_id" },
          field: "card_id",
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "users",
      "avatar_url",
      { type: Sequelize.STRING, field: "avatar_url", allowNull: true },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["users", "avatar_url", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["owned_cards", { transaction }],
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
