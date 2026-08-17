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
    version: '2.0.1',
    date: '2026-06-24',
    tag: 'Latest',
    major: false,
    summary: 'Signed and notarized macOS builds, so automatic updates now work end to end.',
    added: [],
    improved: [
      'macOS builds are now code-signed and notarized by Apple, so Spaci opens cleanly without Gatekeeper warnings.',
      'In-app updates now install on macOS: when a new version is downloaded, Restart to update applies it and relaunches into the new version.'
    ],
    fixed: [
      'Restart to update no longer silently fails on macOS.'
    ],
    files: [
      { platform: 'mac', arch: 'Intel', file: 'Spaci-2.0.1-mac.zip', size: '96 MB', bytes: 100286105, sha512: 'Vx6+xNcNzBHbt21vrMPjydgREE/dLRr/9rbiPwbEA0Y0p5O98PuUxvNvCfOSz5jF1Qpf8+GE2JVar0P/DLz/Hw==' },
      { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-2.0.1-arm64-mac.zip', size: '88 MB', bytes: 91758325, sha512: 'p13QShdKfbJHG/8q/4Vvv9gppd8PuaXGc0Tf3oQnaZLLkTfGJMhtQewuyyxmaCHX2lLRjs59cpWfDGow7OmPKg==' },
      { platform: 'mac', arch: 'Intel', file: 'Spaci-2.0.1.dmg', size: '99 MB', bytes: 103981425, sha512: '9PnkEoORpMgrWdl0XZQV6Q2j130BZwiaw8+/1rEVtFbXYvP7aQzJ9uTqan0iZitS/yW/EVZB/E5bhkYd9PXZ0Q==' },
      { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-2.0.1-arm64.dmg', size: '91 MB', bytes: 95404921, sha512: 'GHsOdIjNeYeCcodi3vLD3EqpQb5CyvdnglKxvcS5vaAtAc0/Vu5REM949pzbcyTny3F4n4wxKAZiLgv+8ErV8w==' },
      { platform: 'windows', arch: 'x64', file: 'Spaci-Setup-2.0.1.exe', size: '76 MB', bytes: 79202713, sha512: 'mMv71/UQcoJG+HGoXjS0zxRROCA1x0DLa4E6BuuN7zt152K2Du0rQV/0TPy6/JT90i4W8xHexSV2/vP+pCKM+g==' },
      { platform: 'linux', arch: 'x86_64', file: 'Spaci-2.0.1.AppImage', size: '103 MB', bytes: 108015222, sha512: '2a2hhETejSyiTtL6v0lonVNvRAtdD5kHdfkOOq7gi6r/GUsqP633tLli7LOthih129curns6By5Z3qwb25cszA==' }
    ]
  },
  {
    version: '2.0.0',
    date: '2026-06-24',
    tag: 'Major',
    major: true,
    summary: 'A complete redesign: a calmer, faster Spaci with a unified scanning experience and a richer storage breakdown.',
    added: [
      'A redesigned interface across every screen, matched to the new Spaci motion brand.',
      'Storage drill-down: open any category to see its biggest folders and files, and reveal them in Finder.',
      'A guided 3-step onboarding that starts indexing your Mac in the background while you set up.',
      'Cross-platform browser cache cleaning across Chrome, Safari, Firefox, Edge, Arc and more.',
      'A consistent live scanning card, with the animated logo, running counts and progress, on every screen.'
    ],
    improved: [
      'Cache-first screens: your last results show instantly, then refresh quietly in the background.',
      'A new file-based icon system with crisp brand and category icons everywhere.',
      'Storage classification is more accurate and now splits out App Data, Browsers, Xcode and Developer.',
      'Cleaning shows an instant loader, a celebratory summary and a toast confirmation.',
      'Settings gains an About section with version, license and links, plus a font selector.'
    ],
    fixed: [
      'System Cleaner no longer gets stuck on the measuring screen.',
      'Filtering projects while a scan is running is smooth and no longer flickers.',
      'Browser cache icons, including Safari, now render correctly.',
      'App Data is now sized accurately instead of being wildly over-counted.',
      'Selecting items and navigating no longer replays the entrance animations.'
    ],
    files: [
      { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-2.0.0-arm64-mac.zip', size: '88 MB', bytes: 92668019, sha512: 'bLg6U4UIqdhaDcIJOPnpb13TCkjygRNLCCYsLDaIZ3nIcWXOWbac35E85noChSERr+iQQSivF3b3cIHiSaEtkQ==' },
      { platform: 'mac', arch: 'Intel', file: 'Spaci-2.0.0-mac.zip', size: '94 MB', bytes: 98723033, sha512: 'yGjCpEeiHl4eZLKypEL+7Ta4DkxVr3GA2GG1Mraw/0KGe7BmRSt4Xtb9Aq0vSWdk/ZNPjGRgP8ZoiL82M4oK7w==' },
      { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-2.0.0-arm64.dmg', size: '92 MB', bytes: 96031958, sha512: 'q2fIC/PZhsNlR4u/xA5sZu4H0IK4eYMsfb3aycg7EL/9PmBfrd14Dm65daKr2/89wTF6n864XV/lM5nlRNpk9g==' },
      { platform: 'mac', arch: 'Intel', file: 'Spaci-2.0.0.dmg', size: '97 MB', bytes: 102032701, sha512: 'Cv/UII8x1MV0GMy9H3HtxgT9tR+LdGnlIsaTl5oH0uiStdM5EbtmISLC72Q8Jr132mPWph6YzwP4FSVMsNStCQ==' },
      { platform: 'windows', arch: 'x64', file: 'Spaci-Setup-2.0.0.exe', size: '76 MB', bytes: 79202786, sha512: 'xII0biEjuyx+Thp0BhK3ojbegFvZVdCoWLR87OBXUbr7EsBCjKVW0qJtPUIHPxYueMvinjhTyMGHRKwMBcqhCA==' },
      { platform: 'linux', arch: 'x86_64', file: 'Spaci-2.0.0.AppImage', size: '103 MB', bytes: 108015200, sha512: 'f+T4sqB/+WlZqhKj1sfLJe5Do5faMyOsiTBaC0iauj5IHkzjObYoovJ218TSViUyM4bcaaTCa8mtu9d5KEDwAw==' }
    ]
  },
  {
    version: '1.2.0',
    date: '2026-06-20',
    tag: 'Feature',
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
