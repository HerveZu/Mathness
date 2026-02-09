import { neon } from '@neondatabase/serverless';
import { env } from '@/env.ts';

let client: ReturnType<typeof neon>;

export async function getClient() {
  if (!client) {
    client = neon(env.DATABASE_URL);
  }
  return client;
}
