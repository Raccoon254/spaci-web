import { PrismaClient } from '@prisma/client';

// Prisma client singleton. In dev, SvelteKit reloads modules often, so we stash
// the client on globalThis to avoid exhausting Neon connections with new clients.
const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
