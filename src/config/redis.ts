import Redis, { createClient } from 'redis';

const URL = process.env.REDIS_URL as string;
let client: ReturnType<typeof Redis.createClient> | null = null;

if (!client) {
  client = createClient({ url: URL });

  client.connect().catch((err) => {
    throw err;
  });
}

export default client || createClient({ url: URL });
