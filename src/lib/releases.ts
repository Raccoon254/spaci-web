// Single source of truth for Spaci releases.
//
// This drives three things:
//   1. The changelog page (rendered from this list).
//   2. The download page (latest version + per-platform artifact URLs).
//   3. The electron-updater feed (/updates/latest-mac.yml etc. are generated
//      from the newest release here).
//
// When you cut a release, prepend a new entry, set the artifact file names and
// sha512 (printed by electron-builder), then run `npm run db:seed` to mirror
// the data into Neon for the dynamic endpoints. Keep the package.json "version"
// in sync with the newest entry below.

export type Platform = 'mac' | 'windows' | 'linux';

export interface ReleaseFile {
  platform: Platform;
  // arch label shown in the UI, e.g. "Apple Silicon", "Intel", "x64".
  arch: string;
  // file name as produced by electron-builder, e.g. Spaci-1.2.0-arm64.dmg
  file: string;
  // human size, e.g. "118 MB"
  size: string;
  // bytes, used by the electron-updater yml feed
  bytes: number;
  // sha512 (base64) from electron-builder's *.yml. Empty until a real build.
  sha512: string;
}

export interface Release {
  version: string;        // 1.2.0
  date: string;           // ISO date 2026-06-20
  tag: string;            // short label, e.g. "Latest", "Security"
  major: boolean;         // highlight in the timeline + force-update hint
  summary: string;        // one-line headline
  added: string[];        // "New"
  improved: string[];     // "Improved"
  fixed: string[];        // "Fixed"
  files: ReleaseFile[];
}

export const releases: Release[] = [
  {
    version: '1.2.0',
    date: '2026-06-20',
    tag: 'Latest',
    major: true,
    summary: 'Disk breakdown, background scans and a calmer cleanup flow.',
    added: [
      'Disk breakdown donut that classifies storage into coding, documents, media and system.',
      'Background scans with a slim progress bar instead of a blocking modal.',
      'Per-app cache detail screens so you can clear caches one app at a time.',
      'History page with reversible and permanent actions clearly separated.'
    ],
    improved: [
      'Project rows now show the real favicon or app icon as a badge.',
      'Smoother, flicker-free search while filtering projects.',
      'Cleanup updates the project immediately so the app always feels current.'
    ],
    fixed: [
      'Scans of different types no longer block each other.',
      'Dock icon now matches the rest of the brand at every size.'
    ],
    files: [
      { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-1.2.0-arm64.dmg', size: '118 MB', bytes: 123731968, sha512: '' },
      { platform: 'mac', arch: 'Intel', file: 'Spaci-1.2.0.dmg', size: '124 MB', bytes: 130023424, sha512: '' },
      { platform: 'windows', arch: 'x64', file: 'Spaci-Setup-1.2.0.exe', size: '96 MB', bytes: 100663296, sha512: '' },
      { platform: 'linux', arch: 'x86_64', file: 'Spaci-1.2.0.AppImage', size: '108 MB', bytes: 113246208, sha512: '' }
    ]
  },
  {
    version: '1.1.0',
    date: '2026-05-12',
    tag: 'Feature',
    major: false,
    summary: 'Project previews, smart recommendations and a quieter UI.',
    added: [
      'Project previews with detected language and git status.',
      'Recommendations that suggest what to clean and how much you would save.',
      'Large file scanner scoped per project.'
    ],
    improved: [
      'Monochrome iconography across the whole app for a calmer look.',
      'Onboarding rewritten to get you to a first scan faster.'
    ],
    fixed: [
      'Long project names now truncate cleanly.',
      'Cache sizes were occasionally double counted.'
    ],
    files: [
      { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-1.1.0-arm64.dmg', size: '115 MB', bytes: 120586240, sha512: '' },
      { platform: 'mac', arch: 'Intel', file: 'Spaci-1.1.0.dmg', size: '121 MB', bytes: 126877696, sha512: '' },
      { platform: 'windows', arch: 'x64', file: 'Spaci-Setup-1.1.0.exe', size: '93 MB', bytes: 97517568, sha512: '' },
      { platform: 'linux', arch: 'x86_64', file: 'Spaci-1.1.0.AppImage', size: '105 MB', bytes: 110100480, sha512: '' }
    ]
  },
  {
    version: '1.0.0',
    date: '2026-04-01',
    tag: 'First release',
    major: false,
    summary: 'The first public Spaci. One-click cleanup for developer clutter.',
    added: [
      'One-click cleanup for node_modules, build output and dependency caches.',
      'Smart detection of project types across your machine.',
      'Safe-by-design cleaning with a preview before anything is removed.'
    ],
    improved: [],
    fixed: [],
    files: [
      { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-1.0.0-arm64.dmg', size: '112 MB', bytes: 117440512, sha512: '' },
      { platform: 'mac', arch: 'Intel', file: 'Spaci-1.0.0.dmg', size: '118 MB', bytes: 123731968, sha512: '' },
      { platform: 'windows', arch: 'x64', file: 'Spaci-Setup-1.0.0.exe', size: '90 MB', bytes: 94371840, sha512: '' },
      { platform: 'linux', arch: 'x86_64', file: 'Spaci-1.0.0.AppImage', size: '102 MB', bytes: 106954752, sha512: '' }
    ]
  }
];

export const latest = releases[0];

// Base URL where the *.yml feed lives. electron-updater in the desktop app
// points at `${SITE}/updates`, and the download links on the site resolve here
// too (the /updates/[file] endpoint redirects to the real installer host).
export const DOWNLOAD_BASE = 'https://spaci.kentom.co.ke/updates';

export function fileUrl(file: string): string {
  return `${DOWNLOAD_BASE}/${file}`;
}

export function filesFor(platform: Platform, release: Release = latest): ReleaseFile[] {
  return release.files.filter((f) => f.platform === platform);
}

// User-facing installers only. macOS ships a .zip alongside the .dmg purely so
// electron-updater can apply updates, but people should download the .dmg, so we
// hide the .zip (and any blockmaps) from the download lists.
export function downloadsFor(platform: Platform, release: Release = latest): ReleaseFile[] {
  const all = filesFor(platform, release);
  const installers = all.filter((f) => !/\.(zip|blockmap)$/i.test(f.file));
  return installers.length ? installers : all;
}
