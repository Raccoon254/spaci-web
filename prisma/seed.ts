// Seeds Neon with the canonical release data from src/lib/releases.ts.
//
// Run with: npm run db:seed  (tsx executes this TS file directly).
// Idempotent: upserts each release by version, then replaces its files.

import { PrismaClient } from '@prisma/client';
import { releases } from '../src/lib/releases';

const prisma = new PrismaClient();

async function main() {
  for (const r of releases) {
    const date = new Date(r.date);

    const release = await prisma.release.upsert({
      where: { version: r.version },
      create: {
        version: r.version,
        date,
        tag: r.tag,
        major: r.major,
        summary: r.summary,
        added: r.added,
        improved: r.improved,
        fixed: r.fixed
      },
      update: {
        date,
        tag: r.tag,
        major: r.major,
        summary: r.summary,
        added: r.added,
        improved: r.improved,
        fixed: r.fixed
      }
    });

    // Replace the file rows so the DB always matches releases.ts exactly.
    await prisma.releaseFile.deleteMany({ where: { releaseId: release.id } });
    await prisma.releaseFile.createMany({
      data: r.files.map((f) => ({
        releaseId: release.id,
        platform: f.platform,
        arch: f.arch,
        file: f.file,
        size: f.size,
        bytes: f.bytes,
        sha512: f.sha512
      }))
    });

    console.log(`Seeded ${r.version} (${r.files.length} files)`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
