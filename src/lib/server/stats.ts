import { prisma } from '$lib/server/db';
import { addDays, dayKey, utcDay } from '$lib/server/analytics';

export interface DayStats {
  day: string;
  downloads: {
    total: number;
    install: number;
    update: number;
    byPlatform: Record<string, number>;
  };
  githubDelta: number;
  activeInstalls: number;
  newInstalls: number;
}

export interface Stats {
  days: number;
  generatedAt: string;
  active7: number;
  active30: number;
  versions: { version: string; installs: number }[];
  perDay: DayStats[];
}

// Rows written before `kind` existed are classified from the file name.
function kindOf(kind: string | null, file: string): 'install' | 'update' | null {
  if (file.endsWith('.blockmap')) return null;
  if (kind === 'install' || kind === 'update') return kind;
  return file.endsWith('.zip') ? 'update' : 'install';
}

export function clampDays(raw: string | null): number {
  const n = Number.parseInt(raw ?? '30', 10);
  if (!Number.isFinite(n)) return 30;
  return Math.min(Math.max(n, 1), 365);
}

export async function getStats(days: number): Promise<Stats> {
  const today = utcDay();
  const from = addDays(today, -(days - 1));
  const activeFrom = addDays(today, -Math.max(days, 30));

  const [downloads, snapshots, actives] = await Promise.all([
    prisma.downloadEvent.findMany({
      where: { at: { gte: from } },
      select: { at: true, platform: true, file: true, kind: true }
    }),
    // One extra day before the window so the first day has a baseline.
    prisma.githubDownloadSnapshot.findMany({
      where: { day: { gte: addDays(from, -1) } },
      orderBy: { day: 'asc' }
    }),
    prisma.dailyActive.findMany({
      where: { day: { gte: activeFrom } },
      select: { installHash: true, day: true, version: true, firstSeen: true }
    })
  ]);

  const perDay = new Map<string, DayStats>();
  for (let i = 0; i < days; i++) {
    const k = dayKey(addDays(from, i));
    perDay.set(k, {
      day: k,
      downloads: { total: 0, install: 0, update: 0, byPlatform: {} },
      githubDelta: 0,
      activeInstalls: 0,
      newInstalls: 0
    });
  }

  for (const d of downloads) {
    const kind = kindOf(d.kind, d.file);
    const row = perDay.get(dayKey(d.at));
    if (!kind || !row) continue;
    row.downloads.total++;
    row.downloads[kind]++;
    row.downloads.byPlatform[d.platform] = (row.downloads.byPlatform[d.platform] ?? 0) + 1;
  }

  // Delta per asset versus that asset's previous snapshot. A brand-new asset
  // has no baseline, so its first snapshot contributes 0 rather than its total.
  const last = new Map<string, number>();
  for (const s of snapshots) {
    const key = `${s.tag}/${s.asset}`;
    const prev = last.get(key);
    last.set(key, s.count);
    const row = perDay.get(dayKey(s.day));
    if (row && prev !== undefined) row.githubDelta += Math.max(0, s.count - prev);
  }

  const perDayInstalls = new Map<string, Set<string>>();
  const newPerDay = new Map<string, Set<string>>();
  const latestSeen = new Map<string, { day: Date; version: string }>();
  const w7 = addDays(today, -6);
  const w30 = addDays(today, -29);
  const in7 = new Set<string>();
  const in30 = new Set<string>();

  for (const a of actives) {
    const k = dayKey(a.day);
    if (!perDayInstalls.has(k)) perDayInstalls.set(k, new Set());
    perDayInstalls.get(k)!.add(a.installHash);
    const fs = dayKey(a.firstSeen);
    if (fs === k) {
      if (!newPerDay.has(k)) newPerDay.set(k, new Set());
      newPerDay.get(k)!.add(a.installHash);
    }
    if (a.day >= w30) in30.add(a.installHash);
    if (a.day >= w7) {
      in7.add(a.installHash);
      const seen = latestSeen.get(a.installHash);
      if (!seen || a.day > seen.day) latestSeen.set(a.installHash, { day: a.day, version: a.version });
    }
  }

  for (const [k, row] of perDay) {
    row.activeInstalls = perDayInstalls.get(k)?.size ?? 0;
    row.newInstalls = newPerDay.get(k)?.size ?? 0;
  }

  const versionCounts = new Map<string, number>();
  for (const { version } of latestSeen.values()) {
    versionCounts.set(version, (versionCounts.get(version) ?? 0) + 1);
  }
  const versions = [...versionCounts]
    .map(([version, installs]) => ({ version, installs }))
    .sort((a, b) => b.installs - a.installs);

  return {
    days,
    generatedAt: new Date().toISOString(),
    active7: in7.size,
    active30: in30.size,
    versions,
    perDay: [...perDay.values()].reverse()
  };
}
