const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * removeColumn(set_name) => "cards"
 * removeColumn(type) => "cards"
 * removeColumn(description) => "cards"
 * removeColumn(ban_list) => "decks"
 * removeColumn(game) => "decks"
 * createTable() => "card_domains", deps: []
 * addColumn(card_domain_id) => "cards"
 * addColumn(card_domain_id) => "decks"
 *
 */

const info = {
  revision: 3,
  name: "card-domain-associate",
  created: "2025-09-28T04:24:27.904Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["cards", "set_name", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["cards", "type", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["cards", "description", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["decks", "ban_list", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["decks", "game", { transaction }],
  },
  {
    fn: "createTable",
    params: [
      "card_domains",
      {
        card_domain_id: {
          type: Sequelize.UUID,
          field: "card_domain_id",
          primaryKey: true,
        },
        domain: { type: Sequelize.STRING, field: "domain", allowNull: false },
      },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "cards",
      "card_domain_id",
      {
        type: Sequelize.UUID,
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
        references: { model: "card_domains", key: "card_domain_id" },
        allowNull: true,
        field: "card_domain_id",
      },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "decks",
      "card_domain_id",
      {
        type: Sequelize.UUID,
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
        references: { model: "card_domains", key: "card_domain_id" },
        field: "card_domain_id",
        allowNull: false,
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["cards", "card_domain_id", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["decks", "card_domain_id", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["card_domains", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "cards",
      "set_name",
      { type: Sequelize.STRING, field: "set_name" },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "cards",
      "type",
      { type: Sequelize.STRING, field: "type" },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "cards",
      "description",
      { type: Sequelize.TEXT, field: "description" },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "decks",
      "ban_list",
      { type: Sequelize.STRING, field: "ban_list" },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "decks",
      "game",
      { type: Sequelize.STRING, field: "game" },
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
