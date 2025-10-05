const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "card_images", deps: [cards]
 *
 */

const info = {
  revision: 4,
  name: "add-cards-image",
  created: "2025-10-04T04:00:52.661Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "card_images",
      {
        card_image_id: {
          type: Sequelize.UUID,
          field: "card_image_id",
          primaryKey: true,
        },
        card_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "cards", key: "card_id" },
          field: "card_id",
          allowNull: false,
        },
        image_url: { type: Sequelize.STRING, field: "image_url" },
        image_url_small: { type: Sequelize.STRING, field: "image_url_small" },
        image_url_cropped: {
          type: Sequelize.STRING,
          field: "image_url_cropped",
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          field: "is_default",
          defaultValue: false,
        },
        meta_data: { type: Sequelize.JSONB, field: "meta_data" },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "dropTable",
    params: ["card_images", { transaction }],
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
