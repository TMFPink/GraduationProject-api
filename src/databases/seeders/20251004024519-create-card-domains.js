'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('card_domains', [
      {
        card_domain_id: '11111111-1111-1111-1111-111111111111',
        domain: 'yugioh'
      },
      {
        card_domain_id: '22222222-2222-2222-2222-222222222222',
        domain: 'pokemon'
      },
      {
        card_domain_id: '33333333-3333-3333-3333-333333333333',
        domain: 'Riftbound'
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('card_domains', {
      card_domain_id: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333'
      ]
    }, {});
  }
};
