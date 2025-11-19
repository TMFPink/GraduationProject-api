'use strict';

// Suppress AWS SDK warnings
const path = require('path');
require(path.join(__dirname, '..', 'utils', 'suppressWarnings'));

require('dotenv').config();
const fetch = require('node-fetch');
const { Sequelize } = require('sequelize');

/* =========================
   CONFIG
========================= */
const CARD_DOMAIN_ID =
  process.env.CARD_DOMAIN_ID || '11111111-1111-1111-1111-111111111111';
const YGO_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

/* =========================
   HELPERS
========================= */

// Normalize names to reduce accidental dupes caused by whitespace/Unicode differences.
function normalizeName(name) {
  return (name || '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/* =========================
   MAIN
========================= */

async function main() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected.');

  // 1) Load existing cards for the target domain
  console.log(`Loading existing cards for domain: ${CARD_DOMAIN_ID}...`);
  const [cards] = await sequelize.query(
    `
    SELECT card_id, name
    FROM cards
    WHERE card_domain_id = :domain
    `,
    { replacements: { domain: CARD_DOMAIN_ID } }
  );

  const existingCardNames = new Set(cards.map((c) => normalizeName(c.name)));
  console.log(`Found ${existingCardNames.size} cards in database.\n`);

  // 2) Fetch YGO API data
  console.log('Fetching YGOProDeck API data...');
  const res = await fetch(YGO_API_URL);
  if (!res.ok) {
    throw new Error(`YGO API error: ${res.status} ${await res.text()}`);
  }
  const { data } = await res.json();
  console.log(`Fetched ${data.length} cards from YGO API.\n`);

  // 3) Find missing cards
  const missingCards = [];

  for (const card of data) {
    const normalizedName = normalizeName(card.name);
    if (!existingCardNames.has(normalizedName)) {
      missingCards.push({
        id: card.id,
        name: card.name,
        type: card.type,
        race: card.race,
        archetype: card.archetype || 'N/A',
      });
    }
  }

  // 4) Output results
  console.log('='.repeat(80));
  console.log(`MISSING CARDS REPORT`);
  console.log('='.repeat(80));
  console.log(`Total cards in YGO API: ${data.length}`);
  console.log(`Total cards in database: ${existingCardNames.size}`);
  console.log(`Missing cards: ${missingCards.length}`);
  console.log('='.repeat(80));

  if (missingCards.length === 0) {
    console.log('\n✅ All YGO API cards exist in your database!');
  } else {
    console.log(`\nMissing Cards (${missingCards.length}):\n`);

    // Group by type for better readability
    const byType = missingCards.reduce((acc, card) => {
      if (!acc[card.type]) acc[card.type] = [];
      acc[card.type].push(card);
      return acc;
    }, {});

    for (const [type, cards] of Object.entries(byType)) {
      console.log(`\n--- ${type} (${cards.length}) ---`);
      cards.forEach((card, idx) => {
        console.log(
          `${idx + 1}. [${card.id}] ${card.name} | ${card.race} | Archetype: ${card.archetype}`
        );
      });
    }
  }
}

main()
  .catch((err) => console.error('Fatal error:', err))
  .finally(async () => {
    try {
      await sequelize.close();
    } catch {}
  });
