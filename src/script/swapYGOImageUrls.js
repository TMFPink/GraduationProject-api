'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');

// --- DB Setup ---
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Missing DATABASE_URL in environment.');

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

async function swapImageUrls() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected to database.');

  const ygoCardDomainId = '11111111-1111-1111-1111-111111111111';
  const transaction = await sequelize.transaction();

  try {
    console.log('Finding YGO card images to swap...');

    // First, get a count of affected rows
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM card_images ci 
       JOIN cards c ON ci.card_id = c.card_id 
       WHERE c.card_domain_id = :domainId`,
      {
        replacements: { domainId: ygoCardDomainId },
        transaction,
      }
    );

    const affectedCount = parseInt(countResult[0].count);
    console.log(`Found ${affectedCount} card images to swap`);

    if (affectedCount === 0) {
      console.log('No card images found for the specified domain ID.');
      await transaction.rollback();
      return;
    }

    // Perform the swap using a temporary column approach
    console.log('Swapping image_url and image_url_small...');

    // Step 1: Store image_url in a temporary variable and set image_url to image_url_small
    const [updateResult] = await sequelize.query(
      `UPDATE card_images 
       SET image_url = image_url_small,
           image_url_small = image_url
       FROM cards 
       WHERE card_images.card_id = cards.card_id 
       AND cards.card_domain_id = :domainId`,
      {
        replacements: { domainId: ygoCardDomainId },
        transaction,
      }
    );

    console.log(
      `=======> Successfully swapped URLs for ${updateResult.rowCount || affectedCount} card images`
    );

    await transaction.commit();
    console.log('\n =======> Image URL swap completed successfully.');
  } catch (err) {
    console.error('❌ Error during swap:', err);
    await transaction.rollback();
    throw err;
  } finally {
    await sequelize.close();
  }
}

// Add a confirmation prompt for safety
async function main() {
  const ygoCardDomainId = '11111111-1111-1111-1111-111111111111';

  console.log('='.repeat(60));
  console.log('YGO CARD IMAGE URL SWAP SCRIPT');
  console.log('='.repeat(60));
  console.log(`Target Domain ID: ${ygoCardDomainId}`);
  console.log(
    'This will swap image_url and image_url_small for all YGO card images.'
  );
  console.log('='.repeat(60));

  // In a production environment, you might want to add a confirmation prompt here
  // For now, we'll proceed directly

  await swapImageUrls();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
