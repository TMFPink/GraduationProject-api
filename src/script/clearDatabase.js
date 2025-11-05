'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');
const readline = require('readline');

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Confirmation prompt
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      const response = answer.toLowerCase();
      if (['yes', 'y'].includes(response)) resolve('yes');
      else if (['delete', 'truncate'].includes(response)) resolve(response);
      else resolve('no');
    });
  });
}

// Delete all rows (safe mode)
async function clearAllTables() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected.');

  try {
    let totalRowsDeleted = 0;

    const [tables] = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
      AND table_name != 'SequelizeMeta'
    `);

    if (!tables.length) return console.log('No tables found.');

    await sequelize.query('SET session_replication_role = replica');
    console.log('🔓 Disabled FK constraints');

    for (const { table_name } of tables) {
      try {
        const [countRes] = await sequelize.query(
          `SELECT COUNT(*) AS count FROM "${table_name}"`
        );
        const count = parseInt(countRes[0].count);
        if (!count) {
          console.log(`✅ '${table_name}' is empty`);
          continue;
        }
        await sequelize.query(`DELETE FROM "${table_name}"`);
        console.log(`🗑️  Deleted ${count} rows from '${table_name}'`);
        totalRowsDeleted += count;
      } catch (err) {
        console.warn(`⚠️ Error clearing '${table_name}':`, err.message);
      }
    }

    await sequelize.query('SET session_replication_role = DEFAULT');
    console.log('🔒 FK constraints restored');

    const [sequences] = await sequelize.query(`
      SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    `);
    for (const { sequence_name } of sequences) {
      await sequelize.query(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1`);
    }

    console.log(`✅ Done. Total rows deleted: ${totalRowsDeleted}`);
  } finally {
    await sequelize.close();
  }
}

// Truncate all tables (fast mode)
async function truncateAllTables() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected.');

  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
  `);

  if (!tables.length) {
    console.log('No tables found to truncate.');
    return;
  }

  // Extract only valid table names
  const tableNames = tables
    .map((t) => t.table_name)
    .filter((name) => !!name && name !== 'undefined');

  if (tableNames.length === 0) {
    console.log('No valid tables found to truncate.');
    return;
  }

  console.log(`Found ${tableNames.length} tables to truncate.`);
  console.log('🗑️  Truncating all tables...');

  const joinedNames = tableNames.map((n) => `"${n}"`).join(', ');
  const sql = `TRUNCATE TABLE ${joinedNames} RESTART IDENTITY CASCADE`;

  console.log(`Executing: ${sql}`);
  await sequelize.query(sql);

  console.log('='.repeat(50));
  console.log(`✅ Database truncation completed successfully!`);
  console.log(`📊 Total tables truncated: ${tableNames.length}`);

  await sequelize.close();
}

// Main entry
async function main() {
  console.log('='.repeat(60));
  console.log('DATABASE CLEANUP SCRIPT');
  console.log('='.repeat(60));
  console.log('This will permanently delete ALL data!');
  console.log('Tables remain intact.');
  console.log('='.repeat(60));

  const confirmed = await askConfirmation('⚠️ Are you sure? (yes/no): ');
  if (confirmed !== 'yes') {
    console.log('❌ Operation cancelled.');
    rl.close();
    return;
  }

  const method = await askConfirmation(
    '\nChoose method:\n' +
      '1. DELETE (type "delete")\n' +
      '2. TRUNCATE (type "truncate")\n' +
      'Method: '
  );

  console.log('\n🚀 Starting cleanup...');
  if (method === 'truncate') await truncateAllTables();
  else await clearAllTables();

  rl.close();
}

process.on('SIGINT', () => {
  console.log('\n❌ Interrupted');
  rl.close();
  process.exit(1);
});
process.on('SIGTERM', () => {
  console.log('\n❌ Terminated');
  rl.close();
  process.exit(1);
});

main().catch((err) => {
  console.error('Fatal error:', err);
  rl.close();
  process.exit(1);
});
