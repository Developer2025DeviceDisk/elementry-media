const fs = require('node:fs');
const { MongoClient } = require('mongodb');
const { validateEnvironment } = require('../dist/config/environment');
const { mapLegacyExport, importLegacyDocuments } = require('../dist/infrastructure/mongodb/legacy-import');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== '--apply')) throw new Error('Usage: npm run db:import -- export.json [--apply]');
  const documents = mapLegacyExport(JSON.parse(fs.readFileSync(args[0], 'utf8')));
  for (const [name, records] of Object.entries(documents)) console.log(`${name}: ${records.length} validated records`);
  if (args[1] !== '--apply') { console.log('Dry run complete; no database writes.'); return; }
  const env = validateEnvironment(process.env);
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(env.MONGODB_DATABASE);
    await importLegacyDocuments(client, db, documents);
    console.log('Import committed atomically. Verify application behavior before retiring the source database.');
  } finally { await client.close(); }
}
main().catch(error => {
  // No raw errors: they can contain password hashes, documents or connection strings.
  console.error(`Import failed (${error.code ?? error.name ?? 'unknown'}). Check the export, empty destination, schema and replica-set support.`);
  process.exitCode = 1;
});
