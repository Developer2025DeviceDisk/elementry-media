// Read-only: never logs connection strings or raw errors.
const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const { validateEnvironment } = require('../dist/config/environment');

async function main() {
  const env = validateEnvironment(process.env);
  const mongo = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  const redis = createClient({ url: env.REDIS_URL, socket: { connectTimeout: 5000, reconnectStrategy: false } });
  redis.on('error', () => {});
  try {
    const results = await Promise.allSettled([
      mongo.connect().then(() => mongo.db(env.MONGODB_DATABASE).command({ ping: 1 })),
      redis.connect().then(() => redis.ping()),
    ]);
    results.forEach((result, index) => {
      const label = index === 0 ? 'MongoDB' : 'Redis';
      if (result.status === 'fulfilled') console.log(`${label}: reachable`);
      else {
        console.log(`${label}: unavailable (${result.reason?.code ?? result.reason?.name ?? 'connection failed'})`);
        process.exitCode = 1;
      }
    });
  } finally {
    await mongo.close();
    if (redis.isOpen) await redis.disconnect();
  }
}
main().catch(() => { console.error('Dependency check failed. Verify environment configuration.'); process.exitCode = 1; });
