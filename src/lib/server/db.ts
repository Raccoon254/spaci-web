import { PrismaClient } from '@prisma/client';

// Lazy Prisma client singleton.
//
// The client is only constructed the first time it is actually used, not when
// this module is imported. That matters because the update feed and the rendered
// pages import nothing but read from src/lib/releases.ts, so a missing or
// unreachable DATABASE_URL must never break them. Only the DB-backed endpoints
// (subscribe, track, releases publish) touch the client, and they wrap calls in
// try/catch so a database outage degrades gracefully.
//
// In dev, SvelteKit reloads modules often, so we stash the client on globalThis
// to avoid exhausting Neon connections with new clients on every reload.
const g = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!g.prisma) g.prisma = new PrismaClient();
  return g.prisma;
}

// A proxy that defers construction until the first property access (e.g.
// prisma.subscriber), so merely importing `prisma` never connects to Neon.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
