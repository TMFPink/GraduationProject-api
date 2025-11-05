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

// Extract source image ID from different URL patterns
function extractSourceImageId(imageUrl, cardDomainId) {
  if (!imageUrl) return null;

  try {
    // For YGO cards: extract ID from URL patterns like /low_resolution/123456.jpg or /original/123456.jpg
    if (cardDomainId === '11111111-1111-1111-1111-111111111111') {
      const ygoMatch = imageUrl.match(
        /\/(low_resolution|original|cropped)\/(\d+)\.jpg$/
      );
      if (ygoMatch) return ygoMatch[2];
    }

    // For Pokemon cards: extract card ID from URL patterns like /original/sv1-1.jpg or /low_resolution/sv1-1.jpg
    if (cardDomainId === '22222222-2222-2222-2222-222222222222') {
      const pkmMatch = imageUrl.match(
        /\/(original|low_resolution)\/([^\/]+)\.jpg$/
      );
      if (pkmMatch) return pkmMatch[2];
    }

    // Generic fallback: try to extract filename without extension
    const genericMatch = imageUrl.match(/\/([^\/]+)\.jpg$/);
    if (genericMatch) return genericMatch[1];

    return null;
  } catch (error) {
    console.warn(
      `Error extracting source_image_id from URL: ${imageUrl}`,
      error.message
    );
    return null;
  }
}

async function main() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected to database.');

  const transaction = await sequelize.transaction();

  try {
    console.log('Fetching card images that need source_image_id updates...');

    // Get all card images that don't have source_image_id populated
    const [cardImages] = await sequelize.query(
      `
      SELECT 
        ci.card_image_id,
        ci.card_id,
        ci.image_url,
        ci.image_url_small,
        ci.image_url_cropped,
        c.card_domain_id
      FROM card_images ci
      JOIN cards c ON ci.card_id = c.card_id
      WHERE ci.source_image_id IS NULL
      ORDER BY ci.card_image_id
    `,
      { transaction }
    );

    console.log(`Found ${cardImages.length} card images to update`);

    if (cardImages.length === 0) {
      console.log('No card images need updating.');
      await transaction.commit();
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    const batchSize = 100;

    // Process in batches
    for (let i = 0; i < cardImages.length; i += batchSize) {
      const batch = cardImages.slice(i, i + batchSize);
      const updates = [];

      for (const cardImage of batch) {
        // Try to extract source_image_id from available URLs
        let sourceImageId = null;

        // Priority order: image_url -> image_url_small -> image_url_cropped
        sourceImageId = extractSourceImageId(
          cardImage.image_url,
          cardImage.card_domain_id
        );

        if (!sourceImageId) {
          sourceImageId = extractSourceImageId(
            cardImage.image_url_small,
            cardImage.card_domain_id
          );
        }

        if (!sourceImageId) {
          sourceImageId = extractSourceImageId(
            cardImage.image_url_cropped,
            cardImage.card_domain_id
          );
        }

        if (sourceImageId) {
          updates.push({
            card_image_id: cardImage.card_image_id,
            source_image_id: sourceImageId,
          });
        } else {
          console.warn(
            `Could not extract source_image_id for card_image_id: ${cardImage.card_image_id}`
          );
          skipCount++;
        }
      }

      // Execute batch updates
      if (updates.length > 0) {
        for (const update of updates) {
          await sequelize.query(
            `
            UPDATE card_images 
            SET source_image_id = :sourceImageId 
            WHERE card_image_id = :cardImageId
          `,
            {
              replacements: {
                sourceImageId: update.source_image_id,
                cardImageId: update.card_image_id,
              },
              transaction,
            }
          );
        }

        successCount += updates.length;
        console.log(
          `✅ Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cardImages.length / batchSize)} - ${updates.length} records`
        );
      }
    }

    await transaction.commit();

    console.log('\n=== Update Summary ===');
    console.log(`✅ Successfully updated: ${successCount} card images`);
    console.log(
      `⚠️  Skipped (no source_image_id found): ${skipCount} card images`
    );
    console.log(`📊 Total processed: ${cardImages.length} card images`);
  } catch (err) {
    console.error('❌ Error during update:', err);
    await transaction.rollback();
    throw err;
  } finally {
    await sequelize.close();
  }
}

// Add validation function to verify updates
async function validateUpdates() {
  console.log('\n🔍 Validating updates...');

  await sequelize.authenticate();

  try {
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_images,
        COUNT(source_image_id) as images_with_source_id,
        COUNT(CASE WHEN source_image_id IS NULL THEN 1 END) as images_without_source_id
      FROM card_images
    `);

    const stats = results[0];
    console.log(`Total card images: ${stats.total_images}`);
    console.log(`Images with source_image_id: ${stats.images_with_source_id}`);
    console.log(
      `Images without source_image_id: ${stats.images_without_source_id}`
    );

    // Show breakdown by card domain
    const [domainBreakdown] = await sequelize.query(`
      SELECT 
        cd.name as domain_name,
        COUNT(*) as total_images,
        COUNT(ci.source_image_id) as images_with_source_id
      FROM card_images ci
      JOIN cards c ON ci.card_id = c.card_id
      JOIN card_domains cd ON c.card_domain_id = cd.card_domain_id
      GROUP BY cd.card_domain_id, cd.name
      ORDER BY cd.name
    `);

    console.log('\nBreakdown by card domain:');
    domainBreakdown.forEach((domain) => {
      console.log(
        `  ${domain.domain_name}: ${domain.images_with_source_id}/${domain.total_images} have source_image_id`
      );
    });
  } catch (error) {
    console.error('Error during validation:', error);
  } finally {
    await sequelize.close();
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--validate')) {
    validateUpdates().catch((err) => {
      console.error('Validation failed:', err);
      process.exit(1);
    });
  } else {
    main().catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
  }
}

module.exports = { extractSourceImageId, main, validateUpdates };
