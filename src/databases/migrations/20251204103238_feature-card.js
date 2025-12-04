const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "feature_cards", deps: []
 *
 */

const info = {
  revision: 15,
  name: "feature-card",
  created: "2025-12-04T10:32:38.734Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "feature_cards",
      {
        feature_card_id: {
          type: Sequelize.UUID,
          field: "feature_card_id",
          primaryKey: true,
        },
        user_id: { type: Sequelize.UUID, field: "user_id", allowNull: false },
        owned_card_id: {
          type: Sequelize.UUID,
          field: "owned_card_id",
          allowNull: false,
        },
        position: {
          type: Sequelize.INTEGER,
          field: "position",
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
    params: ["feature_cards", { transaction }],
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
