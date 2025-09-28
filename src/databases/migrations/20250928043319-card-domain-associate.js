'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint to decks.card_domain_id
    await queryInterface.addConstraint('decks', {
      fields: ['card_domain_id'],
      type: 'foreign key',
      name: 'fk_decks_card_domain', // custom name for the constraint
      references: {
        table: 'card_domains',
        field: 'card_domain_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add foreign key constraint to cards.card_domain_id
    await queryInterface.addConstraint('cards', {
      fields: ['card_domain_id'],
      type: 'foreign key',
      name: 'fk_cards_card_domain',
      references: {
        table: 'card_domains',
        field: 'card_domain_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove constraints
    await queryInterface.removeConstraint('decks', 'fk_decks_card_domain');
    await queryInterface.removeConstraint('cards', 'fk_cards_card_domain');
  }
};
