const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(source_image_id) => "card_images"
 * changeColumn(card_domain_id) => "collections"
 * changeColumn(card_domain_id) => "collections"
 *
 */

const info = {
  revision: 10,
  name: "image_card_source",
  created: "2025-10-21T08:04:42.434Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "card_images",
      "source_image_id",
      { type: Sequelize.STRING, field: "source_image_id" },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "collections",
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
  {
    fn: "changeColumn",
    params: [
      "collections",
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
    params: ["card_images", "source_image_id", { transaction }],
  },
  {
    fn: "changeColumn",
    params: [
      "collections",
      "card_domain_id",
      { type: Sequelize.UUID, field: "card_domain_id", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "collections",
      "card_domain_id",
      { type: Sequelize.UUID, field: "card_domain_id", allowNull: false },
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
