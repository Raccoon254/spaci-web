import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/db';
import { hashInstallId, utcDay } from '$lib/server/analytics';
import type { RequestHandler } from './$types';

// Daily heartbeat from the desktop app. Accepts { installId, version, platform,
// arch } and stores one row per (salted install hash, day). No IP, user agent,
// path or file name is read or stored. Always answers 204 and never throws, so
// the client never has a reason to retry or surface an error.

const MAX_BODY = 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEMVER = /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z.-]{1,20})?$/;
const PLATFORMS = new Set(['mac', 'windows', 'linux']);
const ARCH = /^[a-z0-9_-]{1,16}$/i;

const empty = () => new Response(null, { status: 204 });

export const POST: RequestHandler = async ({ request }) => {
  try {
    const declared = Number(request.headers.get('content-length') ?? '0');
    if (declared > MAX_BODY) return empty();
    const text = await request.text();
    if (text.length > MAX_BODY) return empty();

    const body = JSON.parse(text);
    const { installId, version, platform, arch } = body ?? {};
    if (
      typeof installId !== 'string' ||
      !UUID.test(installId) ||
      typeof version !== 'string' ||
      !SEMVER.test(version) ||
      typeof platform !== 'string' ||
      !PLATFORMS.has(platform) ||
      typeof arch !== 'string' ||
      !ARCH.test(arch)
    ) {
      return empty();
    }

    const installHash = await hashInstallId(installId, env.TELEMETRY_SALT);
    if (!installHash) return empty();

    const now = new Date();
    const day = utcDay(now);
    const earliest = await prisma.dailyActive.findFirst({
      where: { installHash },
      orderBy: { day: 'asc' },
      select: { firstSeen: true }
    });

    await prisma.dailyActive.upsert({
      where: { installHash_day: { installHash, day } },
      create: { installHash, day, version, platform, arch, firstSeen: earliest?.firstSeen ?? now },
      update: { version, platform, arch }
    });
  } catch (err) {
    console.error('POST /api/ping failed:', err instanceof Error ? err.message : 'error');
  }
  return empty();
};
