const { createClient } = require('redis');

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on('error', (error) => {
  console.error('Redis error:', error);
});

async function connectRedis() {
  if (!process.env.REDIS_URL) {
    throw new Error(
      'REDIS_URL is not set. Add the ElastiCache Redis primary endpoint to your environment.'
    );
  }

  await redis.connect();
  console.log('Connected to Redis');
}

module.exports = { redis, connectRedis };
