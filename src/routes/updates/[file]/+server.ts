import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { type Platform, type Release, type ReleaseFile } from '$lib/releases';
import { prisma } from '$lib/server/db';
import { getLatest, getReleases } from '$lib/server/releases-source';
import type { RequestHandler } from './$types';

// THE UPDATE FEED for electron-updater (generic provider).
//
// The desktop app is configured with:
//   publish: { provider: 'generic', url: 'https://spaci.kentom.co.ke/updates' }
//
// electron-updater fetches one of these YAML files describing the newest release:
//   macOS:   /updates/latest-mac.yml
//   Windows: /updates/latest.yml
//   Linux:   /updates/latest-linux.yml
//
// Each `files[].url` is RELATIVE to the feed url, so the actual installer must be
// reachable at /updates/<file>. We handle those installer requests below by
// redirecting to wherever the built artifacts are really hosted.

// Maps the well-known feed file name to the platform whose release it describes.
const FEED_PLATFORM: Record<string, Platform> = {
  'latest-mac.yml': 'mac',
  'latest.yml': 'windows',
  'latest-linux.yml': 'linux'
};

const INSTALLER_EXT = ['.dmg', '.exe', '.AppImage', '.zip', '.blockmap'];

// The files electron-updater actually downloads to UPDATE an installed app:
// on macOS that is the .zip (the .dmg is for fresh installs only), on Windows
// the .exe, on Linux the .AppImage. We feed those into the yml so auto-update
// resolves the right artifact. When only a .dmg is present (the static baseline
// before a real build), we fall back to whatever we have.
function updateArtifacts(files: ReleaseFile[], platform: Platform): ReleaseFile[] {
  if (platform === 'mac') {
    const zips = files.filter((f) => /\.zip$/i.test(f.file));
    if (zips.length) return zips;
  }
  return files;
}

// Pick the primary artifact for a platform. For mac we prefer Apple Silicon
// (arm64), the default arch electron-updater resolves on modern Macs.
function primaryFile(files: ReleaseFile[], platform: Platform): ReleaseFile | undefined {
  if (platform === 'mac') {
    const arm =
      files.find((f) => /arm64/i.test(f.file)) ??
      files.find((f) => /apple silicon/i.test(f.arch));
    if (arm) return arm;
  }
  return files[0];
}

// Tiny inline YAML builder in the electron-builder shape. We intentionally avoid
// adding a yaml dependency: the structure is fixed and simple.
//
// IMPORTANT: sha512 may be an empty string in the data until a real build. The
// field is still emitted because the shape must be correct, but electron-updater
// will only verify (and thus complete) downloads once these are filled in from
// the electron-builder *.yml output for the real release.
function buildYaml(release: Release, platform: Platform): string {
  const files = updateArtifacts(
    release.files.filter((f) => f.platform === platform),
    platform
  );
  const primary = primaryFile(files, platform);
  if (!primary) return '';

  const releaseDate = new Date(release.date).toISOString();

  const lines: string[] = [];
  lines.push(`version: ${release.version}`);
  lines.push('files:');
  for (const f of files) {
    lines.push(`  - url: ${f.file}`);
    lines.push(`    sha512: ${f.sha512}`);
    lines.push(`    size: ${f.bytes}`);
  }
  lines.push(`path: ${primary.file}`);
  lines.push(`sha512: ${primary.sha512}`);
  lines.push(`releaseDate: '${releaseDate}'`);

  return lines.join('\n') + '\n';
}

function findFileAcrossReleases(
  name: string,
  releases: Release[]
): { release: Release; file: ReleaseFile } | undefined {
  for (const r of releases) {
    const f = r.files.find((x) => x.file === name);
    if (f) return { release: r, file: f };
  }
  return undefined;
}

export const GET: RequestHandler = async ({ params }) => {
  const file = params.file;

  // 1. The electron-updater feed files.
  const platform = FEED_PLATFORM[file];
  if (platform) {
    const release = await getLatest();
    const yaml = buildYaml(release, platform);
    if (!yaml) throw error(404, 'No release artifact for this platform');
    return new Response(yaml, {
      headers: {
        'Content-Type': 'text/yaml',
        // Short cache: feeds change only when a release is cut.
        'Cache-Control': 'public, max-age=60'
      }
    });
  }

  // 2. An actual installer / blockmap download.
  if (INSTALLER_EXT.some((ext) => file.endsWith(ext))) {
    const all = await getReleases();
    const match = findFileAcrossReleases(file, all);

    // Record a download event, best-effort. Never block the redirect on the DB.
    if (match) {
      try {
        await prisma.downloadEvent.create({
          data: {
            version: match.release.version,
            platform: match.file.platform,
            file
          }
        });
      } catch {
        // Swallow: analytics must never break a download.
      }
    }

    // Resolve the version for the GitHub releases URL pattern from the matched
    // release, falling back to the latest version when the file is unknown.
    // getReleases() always returns at least the static baseline, so all[0]
    // exists; the ?? '' is only to satisfy the type checker.
    const version = match?.release.version ?? all[0]?.version ?? '';

    // Redirect to wherever the built installers are actually hosted.
    //
    // DOWNLOAD_BASE points back at this same /updates path on the production
    // domain, so we must NOT redirect there (that would loop). In production set
    // INSTALLER_BASE to the real object-storage / Releases base. Otherwise we
    // fall back to the GitHub Releases download URL pattern.
    const base = env.INSTALLER_BASE;
    const target = base
      ? `${base.replace(/\/$/, '')}/${file}`
      : `https://github.com/Raccoon254/spaci/releases/download/v${version}/${file}`;

    throw redirect(302, target);
  }

  // 3. Anything else.
  throw error(404, 'Not found');
};
