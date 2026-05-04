const { withDb, resetDatabase, printSection, getCounts, pretty } = require('./db');

async function main() {
  await withDb(async ({ db }) => {
    printSection('Reset MongoDB Comparison Database');
    await resetDatabase(db);
    const counts = await getCounts(db);
    console.log('Database dropped successfully.');
    console.log(pretty(counts));
  });
}

main().catch((error) => {
  console.error('Reset failed:', error);
  process.exit(1);
});
