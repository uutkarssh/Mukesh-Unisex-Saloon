// Single database client for the whole app.
// Uses @libsql/client (Turso / libSQL) with the env vars in .env.local.
// EVERY query in the app goes through this client with parameterized statements.
// No string-concatenated SQL anywhere — all values are bound as args.

import { createClient } from '@libsql/client'

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env.local and fill it in.`,
    )
  }
  return v
}

const globalForDb = globalThis as unknown as {
  __mukeshDb: ReturnType<typeof createClient> | undefined
}

export const db =
  globalForDb.__mukeshDb ??
  createClient({
    url: getEnv('TURSO_DATABASE_URL'),
    authToken: getEnv('TURSO_AUTH_TOKEN'),
  })

// Cache the client across hot-reloads in dev so we don't exhaust connections.
if (process.env.NODE_ENV !== 'production') globalForDb.__mukeshDb = db
