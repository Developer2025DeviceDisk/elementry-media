const { MongoClient } = require('mongodb');
const { validateEnvironment } = require('../dist/config/environment');
const { setupMongoSchema } = require('../dist/infrastructure/mongodb/schema');

async function main() {
  const env = validateEnvironment(process.env);
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    await setupMongoSchema(client.db(env.MONGODB_DATABASE));
    console.log('MongoDB collections, validators and indexes are ready.');
  } finally { await client.close(); }
}
main().catch(error => {
  console.error(`MongoDB setup failed (${error.code ?? error.name ?? 'unknown'}). Check connectivity, permissions and existing duplicate records.`);
  process.exitCode = 1;
});
