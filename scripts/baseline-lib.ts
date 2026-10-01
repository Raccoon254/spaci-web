// Builds src/lib/releases.ts entries from the public GitHub Releases of the app
// repo, so the static baseline can be refreshed without a token or a human.
// Used by scripts/refresh-baseline.ts (writes) and scripts/check-releases.ts
// (compares). The parsing mirrors scripts/sync-feed.mjs in Raccoon254/spaci.

import { compareSemver, normalizeSemver } from '../src/lib/semver';
import type { Release, ReleaseFile } from '../src/lib/releases';

export const APP_REPO = 'Raccoon254/spaci';
const FEEDS = ['latest-mac.yml', 'latest.yml', 'latest-linux.yml'];

export interface GhAsset { name: string; size: number; browser_download_url: string }
export interface GhRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
  assets: GhAsset[];
}

export function parseYml(text: string): { version: string; files: { url: string; sha512?: string; size?: number }[] } {
  const out: { version: string; files: { url: string; sha512?: string; size?: number }[] } = { version: '', files: [] };
  let inFiles = false;
  let cur: { url: string; sha512?: string; size?: number } | null = null;
  for (const line of text.split(/\r?\n/)) {
    const v = line.match(/^version:\s*(.+)$/);
    if (v) { out.version = v[1].trim(); continue; }
    if (/^files:\s*$/.test(line)) { inFiles = true; continue; }
    if (inFiles) {
      const url = line.match(/^\s+-\s*url:\s*(.+)$/);
      if (url) { cur = { url: url[1].trim() }; out.files.push(cur); continue; }
      if (/^\s/.test(line)) {
        const sha = line.match(/^\s+sha512:\s*(.+)$/);
        if (sha && cur) cur.sha512 = sha[1].trim();
        const size = line.match(/^\s+size:\s*(\d+)\s*$/);
        if (size && cur) cur.size = Number(size[1]);
        continue;
      }
      inFiles = false;
    }
  }
  return out;
}

export function classify(file: string): { platform: ReleaseFile['platform']; arch: string } | null {
  if (/\.exe$/i.test(file)) return { platform: 'windows', arch: 'x64' };
  if (/\.AppImage$/i.test(file)) return { platform: 'linux', arch: 'x86_64' };
  if (/\.(dmg|zip)$/i.test(file)) return { platform: 'mac', arch: /arm64/i.test(file) ? 'Apple Silicon' : 'Intel' };
  return null;
}

export function humanize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? (mb / 1024).toFixed(1) + ' GB' : Math.round(mb) + ' MB';
}

// First meaningful line of the release notes, without Markdown emphasis.
export function summaryFrom(r: Pick<GhRelease, 'body' | 'name' | 'tag_name'>): string {
  for (const line of (r.body ?? '').split(/\r?\n/)) {
    const t = line.replace(/\*\*|__|`/g, '').trim();
    if (t && !t.startsWith('#') && !t.startsWith('|') && !t.startsWith('-')) return t;
  }
  return r.name || `Spaci ${r.tag_name.replace(/^v/, '')}`;
}

export function filesFromFeeds(feeds: string[]): ReleaseFile[] {
  const files: ReleaseFile[] = [];
  const seen = new Set<string>();
  for (const text of feeds) {
    for (const f of parseYml(text).files) {
      if (/\.blockmap$/i.test(f.url) || seen.has(f.url)) continue;
      const c = classify(f.url);
      if (!c) continue;
      seen.add(f.url);
      files.push({ platform: c.platform, arch: c.arch, file: f.url, size: humanize(f.size || 0), bytes: f.size || 0, sha512: f.sha512 || '' });
    }
  }
  return files;
}

export class GitHubUnavailable extends Error {}

async function get(url: string, accept: string): Promise<Response> {
  // GITHUB_TOKEN is optional (CI provides one for free, which only raises the
  // rate limit); a public repo needs no credential.
  const headers: Record<string, string> = { accept, 'user-agent': 'spaci-web-baseline' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  } catch (e) {
    throw new GitHubUnavailable(`${url}: ${(e as Error).message}`);
  }
  if (!res.ok) throw new GitHubUnavailable(`${url}: HTTP ${res.status}${res.status === 403 || res.status === 429 ? ' (rate limited?)' : ''}`);
  return res;
}

// Published (not draft, not pre-release) app releases, newest version first.
export async function fetchPublished(): Promise<GhRelease[]> {
  const res = await get(`https://api.github.com/repos/${APP_REPO}/releases?per_page=50`, 'application/vnd.github+json');
  const all = (await res.json()) as GhRelease[];
  return all
    .filter((r) => !r.draft && !r.prerelease && normalizeSemver(r.tag_name))
    .sort((a, b) => compareSemver(normalizeSemver(b.tag_name)!, normalizeSemver(a.tag_name)!));
}

export async function toRelease(r: GhRelease): Promise<Release> {
  const feeds: string[] = [];
  for (const name of FEEDS) {
    const asset = r.assets.find((a) => a.name === name);
    if (asset) feeds.push(await (await get(asset.browser_download_url, 'text/plain')).text());
  }
  return {
    version: normalizeSemver(r.tag_name)!,
    date: (r.published_at ?? '').slice(0, 10),
    tag: 'Latest',
    major: false,
    summary: summaryFrom(r),
    added: [],
    improved: [],
    fixed: [],
    files: filesFromFeeds(feeds)
  };
}

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

export function renderEntry(r: Release): string {
  const files = r.files
    .map((f) => `      { platform: ${q(f.platform)}, arch: ${q(f.arch)}, file: ${q(f.file)}, size: ${q(f.size)}, bytes: ${f.bytes}, sha512: ${q(f.sha512)} }`)
    .join(',\n');
  return [
    '  {',
    `    version: ${q(r.version)},`,
    `    date: ${q(r.date)},`,
    `    tag: ${q(r.tag)},`,
    `    major: ${r.major},`,
    `    summary: ${q(r.summary)},`,
    '    added: [],',
    '    improved: [],',
    '    fixed: [],',
    '    files: [',
    files,
    '    ]',
    '  }'
  ].join('\n');
}

// Prepends `fresh` (newest first) to the releases array in the source text and
// demotes the previous "Latest" entry. Pure, so it is unit tested.
export function applyToSource(source: string, fresh: Release[]): string {
  if (!fresh.length) return source;
  const marker = 'export const releases: Release[] = [\n';
  const at = source.indexOf(marker);
  if (at < 0) throw new Error('releases.ts: array marker not found');
  const head = source.slice(0, at + marker.length);
  let rest = source.slice(at + marker.length);
  rest = rest.replace("tag: 'Latest',", "tag: 'Release',");
  const entries = fresh.map((r, i) => renderEntry({ ...r, tag: i === 0 ? 'Latest' : 'Release' })).join(',\n');
  return `${head}${entries},\n${rest}`;
}
