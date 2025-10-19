const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(card_domain_id) => "collections"
 * changeColumn(card_id) => "collection_cards"
 * changeColumn(card_domain_id) => "decks"
 *
 */

const info = {
  revision: 9,
  name: "add-domain_id-collection",
  created: "2025-10-19T14:15:45.718Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  // First, add the column as nullable
  {
    fn: "addColumn",
    params: [
      "collections",
      "card_domain_id",
      { type: Sequelize.UUID, field: "card_domain_id", allowNull: true },
      { transaction },
    ],
  },
  // Update existing records with a default card domain ID (yugioh)
  {
    fn: "changeColumn",
    params: [
      "collections",
      "card_domain_id",
      {
        type: Sequelize.UUID,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        references: { model: "card_domains", key: "card_domain_id" },
        field: "card_domain_id",
        allowNull: false,
      },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "collection_cards",
      "card_id",
      {
        type: Sequelize.UUID,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        references: { model: "cards", key: "card_id" },
        field: "card_id",
        allowNull: false,
      },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "decks",
      "card_domain_id",
      {
        type: Sequelize.UUID,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
    params: ["collections", "card_domain_id", { transaction }],
  },
  {
    fn: "changeColumn",
    params: [
      "collection_cards",
      "card_id",
      {
        type: Sequelize.UUID,
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
        references: { model: "cards", key: "card_id" },
        field: "card_id",
        allowNull: false,
      },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
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
          
          // Handle raw SQL queries
          if (command.fn === "sequelize.query") {
            queryInterface.sequelize.query(command.params[0], { transaction }).then(next, reject);
          } else {
            queryInterface[command.fn](...command.params).then(next, reject);
          }
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
