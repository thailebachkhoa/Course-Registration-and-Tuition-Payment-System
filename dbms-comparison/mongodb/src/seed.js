const { withDb, seedDatabase, getCounts, printSection, pretty } = require('./db');

async function main() {
  await withDb(async ({ db }) => {
    printSection('Seed MongoDB Comparison Database');
    await db.dropDatabase();
    await seedDatabase(db);
    const counts = await getCounts(db);
    console.log('Seed completed successfully.');
    console.log(pretty(counts));
  });
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
