const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "owned_cards", deps: [users, cards, card_domains]
 * addColumn(card_domain_id) => "owned_cards"
 *
 */

const info = {
  revision: 12,
  name: "add-card-domain-id-owned-cards",
  created: "2025-11-05T07:15:59.000Z",
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
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
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
        card_domain_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "card_domains", key: "card_domain_id" },
          field: "card_domain_id",
          allowNull: false,
        },
        quantity: {
          type: Sequelize.INTEGER,
          field: "quantity",
          defaultValue: 1,
        },
        condition: {
          type: Sequelize.STRING,
          field: "condition",
          defaultValue: "mint",
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: true,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
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
