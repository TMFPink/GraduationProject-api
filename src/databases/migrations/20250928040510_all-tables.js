const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "cards", deps: []
 * createTable() => "blocks", deps: [users, users]
 * createTable() => "collections", deps: [users]
 * createTable() => "collection_cards", deps: [collections, cards]
 * createTable() => "posts", deps: [users]
 * createTable() => "decks", deps: [users]
 * createTable() => "deck_cards", deps: [decks, cards]
 * createTable() => "follows", deps: [users, users]
 * createTable() => "messages", deps: [users, users]
 * createTable() => "notifications", deps: [users]
 * createTable() => "comments", deps: [posts, users, comments]
 * createTable() => "reports", deps: [users]
 *
 */

const info = {
  revision: 2,
  name: "all-tables",
  created: "2025-09-28T04:05:10.348Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "cards",
      {
        card_id: { type: Sequelize.UUID, field: "card_id", primaryKey: true },
        name: { type: Sequelize.STRING, field: "name" },
        description: { type: Sequelize.TEXT, field: "description" },
        type: { type: Sequelize.STRING, field: "type" },
        rarity: { type: Sequelize.STRING, field: "rarity" },
        set_name: { type: Sequelize.STRING, field: "set_name" },
        image_normal_url: { type: Sequelize.STRING, field: "image_normal_url" },
        image_large_url: { type: Sequelize.STRING, field: "image_large_url" },
        image_thumb_url: { type: Sequelize.STRING, field: "image_thumb_url" },
        meta_data: { type: Sequelize.JSONB, field: "meta_data" },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "blocks",
      {
        block_id: { type: Sequelize.UUID, field: "block_id", primaryKey: true },
        blocker_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          field: "blocker_id",
          allowNull: false,
        },
        blocked_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          field: "blocked_id",
          allowNull: false,
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
  {
    fn: "createTable",
    params: [
      "collections",
      {
        collection_id: {
          type: Sequelize.UUID,
          field: "collection_id",
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "user_id",
        },
        name: { type: Sequelize.STRING, field: "name", allowNull: false },
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
      "collection_cards",
      {
        collection_card_id: {
          type: Sequelize.UUID,
          field: "collection_card_id",
          primaryKey: true,
        },
        collection_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "collections", key: "collection_id" },
          field: "collection_id",
          allowNull: false,
        },
        card_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "cards", key: "card_id" },
          field: "card_id",
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "posts",
      {
        post_id: { type: Sequelize.UUID, field: "post_id", primaryKey: true },
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "user_id",
        },
        title: { type: Sequelize.STRING, field: "title" },
        content: { type: Sequelize.TEXT, field: "content" },
        thumbnail: { type: Sequelize.STRING, field: "thumbnail" },
        media_url: { type: Sequelize.STRING, field: "media_url" },
        tags: { type: Sequelize.ARRAY(Sequelize.STRING), field: "tags" },
        upvotes: { type: Sequelize.INTEGER, field: "upvotes", defaultValue: 0 },
        downvotes: {
          type: Sequelize.INTEGER,
          field: "downvotes",
          defaultValue: 0,
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
  {
    fn: "createTable",
    params: [
      "decks",
      {
        deck_id: { type: Sequelize.UUID, field: "deck_id", primaryKey: true },
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "user_id",
        },
        name: { type: Sequelize.STRING, field: "name", allowNull: false },
        game: { type: Sequelize.STRING, field: "game" },
        ban_list: { type: Sequelize.STRING, field: "ban_list" },
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
      "deck_cards",
      {
        deck_card_id: {
          type: Sequelize.UUID,
          field: "deck_card_id",
          primaryKey: true,
        },
        deck_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "decks", key: "deck_id" },
          field: "deck_id",
          allowNull: false,
        },
        card_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "cards", key: "card_id" },
          field: "card_id",
          allowNull: false,
        },
        quantity: {
          type: Sequelize.INTEGER,
          field: "quantity",
          defaultValue: 1,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "follows",
      {
        follow_id: {
          type: Sequelize.UUID,
          field: "follow_id",
          primaryKey: true,
        },
        follower_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          field: "follower_id",
          allowNull: false,
        },
        following_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          field: "following_id",
          allowNull: false,
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
  {
    fn: "createTable",
    params: [
      "messages",
      {
        message_id: {
          type: Sequelize.UUID,
          field: "message_id",
          primaryKey: true,
        },
        sender_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "sender_id",
        },
        receiver_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "receiver_id",
        },
        content: { type: Sequelize.TEXT, field: "content" },
        is_read: {
          type: Sequelize.BOOLEAN,
          field: "is_read",
          defaultValue: false,
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
  {
    fn: "createTable",
    params: [
      "notifications",
      {
        notification_id: {
          type: Sequelize.UUID,
          field: "notification_id",
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "user_id",
        },
        type: { type: Sequelize.STRING, field: "type" },
        content: { type: Sequelize.TEXT, field: "content" },
        is_read: {
          type: Sequelize.BOOLEAN,
          field: "is_read",
          defaultValue: false,
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
  {
    fn: "createTable",
    params: [
      "comments",
      {
        comment_id: {
          type: Sequelize.UUID,
          field: "comment_id",
          primaryKey: true,
        },
        post_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "posts", key: "post_id" },
          allowNull: true,
          field: "post_id",
        },
        user_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "user_id",
        },
        content: { type: Sequelize.TEXT, field: "content" },
        upvotes: { type: Sequelize.INTEGER, field: "upvotes", defaultValue: 0 },
        downvotes: {
          type: Sequelize.INTEGER,
          field: "downvotes",
          defaultValue: 0,
        },
        parent_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "comments", key: "comment_id" },
          allowNull: true,
          field: "parent_id",
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
  {
    fn: "createTable",
    params: [
      "reports",
      {
        report_id: {
          type: Sequelize.UUID,
          field: "report_id",
          primaryKey: true,
        },
        reporter_id: {
          type: Sequelize.UUID,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "users", key: "user_id" },
          allowNull: true,
          field: "reporter_id",
        },
        target_type: {
          type: Sequelize.ENUM("post", "comment"),
          field: "target_type",
          allowNull: false,
        },
        target_id: { type: Sequelize.UUID, field: "target_id" },
        reason: { type: Sequelize.TEXT, field: "reason" },
        status: {
          type: Sequelize.ENUM("pending", "approved", "dismissed"),
          field: "status",
          defaultValue: "pending",
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
    params: ["blocks", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["cards", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["collection_cards", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["collections", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["comments", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["deck_cards", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["decks", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["follows", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["messages", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["notifications", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["posts", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["reports", { transaction }],
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
