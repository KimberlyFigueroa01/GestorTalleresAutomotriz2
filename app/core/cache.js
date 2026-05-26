const Redis = require('ioredis');

let redisClient = null;
let redisEnabled = true;

function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 10) {
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });

  redisClient.on('connect', () => {
    redisEnabled = true;
    console.log('[Cache] Redis conectado');
  });

  redisClient.on('ready', () => {
    redisEnabled = true;
  });

  redisClient.on('error', (error) => {
    redisEnabled = false;
    console.error('[Cache] Redis error:', error.message);
  });

  redisClient.on('close', () => {
    redisEnabled = false;
  });

  return redisClient;
}

async function ensureConnected() {
  const client = getRedisClient();
  if (client.status === 'ready') {
    return client;
  }
  if (client.status === 'connecting') {
    await new Promise((resolve) => {
      client.once('ready', resolve);
      client.once('error', resolve);
    });
    return client;
  }
  try {
    await client.connect();
    redisEnabled = true;
  } catch (error) {
    redisEnabled = false;
    console.error('[Cache] No se pudo conectar a Redis:', error.message);
  }
  return client;
}

async function getOrSet(key, fallback, ttl = 120) {
  try {
    const client = await ensureConnected();
    if (!redisEnabled || client.status !== 'ready') {
      console.log(`[Cache] MISS ${key} (Redis no disponible)`);
      return await fallback();
    }

    const cached = await client.get(key);
    if (cached !== null) {
      console.log(`[Cache] HIT ${key}`);
      return JSON.parse(cached);
    }

    console.log(`[Cache] MISS ${key}`);
    const value = await fallback();
    await client.set(key, JSON.stringify(value), 'EX', ttl);
    return value;
  } catch (error) {
    console.error(`[Cache] Error en getOrSet (${key}):`, error.message);
    return await fallback();
  }
}

async function invalidate(...keys) {
  if (!keys.length) {
    return;
  }

  try {
    const client = await ensureConnected();
    if (!redisEnabled || client.status !== 'ready') {
      return;
    }
    const removed = await client.del(...keys);
    console.log(`[Cache] INVALIDATE ${keys.join(', ')} (${removed} clave(s))`);
  } catch (error) {
    console.error('[Cache] Error en invalidate:', error.message);
  }
}

async function invalidatePattern(pattern) {
  try {
    const client = await ensureConnected();
    if (!redisEnabled || client.status !== 'ready') {
      return;
    }

    let cursor = '0';
    let totalRemoved = 0;

    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        totalRemoved += await client.del(...keys);
      }
    } while (cursor !== '0');

    console.log(`[Cache] INVALIDATE pattern ${pattern} (${totalRemoved} clave(s))`);
  } catch (error) {
    console.error(`[Cache] Error en invalidatePattern (${pattern}):`, error.message);
  }
}

module.exports = {
  getOrSet,
  invalidate,
  invalidatePattern,
};
