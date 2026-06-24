<script lang="ts">
  import { onMount } from 'svelte';
  import { downloadsFor, fileUrl, type Platform, type ReleaseFile } from '$lib/releases';
  import Seo from '$lib/components/Seo.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let os: Platform = 'mac';
  let copied = false;

  const labels: Record<Platform, string> = {
    mac: 'macOS',
    windows: 'Windows',
    linux: 'Linux'
  };
  $: osLabel = labels[os];

  $: macFiles = downloadsFor('mac', data.latest);
  $: winFiles = downloadsFor('windows', data.latest);
  $: linuxFiles = downloadsFor('linux', data.latest);

  $: groups = [
    { key: 'mac', name: 'macOS', files: macFiles },
    { key: 'windows', name: 'Windows', files: winFiles },
    { key: 'linux', name: 'Linux', files: linuxFiles }
  ] satisfies { key: Platform; name: string; files: ReleaseFile[] }[];

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  $: releaseDate = dateFmt.format(new Date(data.latest.date));

  // The recommended download for the detected OS. For mac, default to Apple
  // Silicon; keep the Intel build as a secondary link.
  $: recoFiles = downloadsFor(os, data.latest);
  $: primaryFile =
    os === 'mac'
      ? recoFiles.find((f) => f.arch === 'Apple Silicon') ?? recoFiles[0]
      : recoFiles[0];
  $: secondaryFile =
    os === 'mac' ? recoFiles.find((f) => f.arch === 'Intel') ?? null : null;

  // One-line terminal installer, like pixen's. macOS/Linux use install.sh,
  // Windows uses install.ps1. Both resolve the latest version at runtime.
  $: installCmd =
    os === 'windows'
      ? 'irm https://spaci.kentom.co.ke/install.ps1 | iex'
      : 'curl -fsSL https://spaci.kentom.co.ke/install.sh | bash';

  function detectOs(): Platform {
    if (typeof navigator === 'undefined') return 'mac';
    const ua = `${navigator.userAgent} ${navigator.platform || ''}`.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('linux') || ua.includes('x11')) return 'linux';
    return 'mac';
  }

  async function copyCmd() {
    try {
      await navigator.clipboard.writeText(installCmd);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      copied = false;
    }
  }

  onMount(() => {
    os = detectOs();
  });
</script>

<Seo
  title="Download Spaci"
  description="Download Spaci for macOS, Windows or Linux. Free and open source, with automatic updates."
  path="/download"
/>

<section class="page wrap">
  <header class="head">
    <span class="eyebrow">Download</span>
    <h1>Get Spaci for {osLabel}</h1>
    <p class="intro mono">v{data.latest.version} · Released {releaseDate}</p>
  </header>

  <!-- Recommended download -->
  <div class="reco">
    <div class="reco-info">
      <span class="reco-eyebrow">Recommended for you</span>
      <span class="reco-name">Spaci for {osLabel}</span>
      {#if primaryFile}
        <span class="reco-meta mono">{primaryFile.arch} · {primaryFile.size}</span>
      {/if}
    </div>
    <div class="reco-actions">
      {#if primaryFile}
        <a class="btn btn-primary" href={fileUrl(primaryFile.file)}>Download Spaci</a>
      {/if}
      {#if secondaryFile}
        <a class="reco-alt" href={fileUrl(secondaryFile.file)}>Intel Mac instead</a>
      {/if}
    </div>
  </div>

  <div class="install">
    <span class="install-label">Or install from your terminal</span>
    <div class="cmd-chip">
      <code class="mono">{installCmd}</code>
      <button class="cmd-copy" on:click={copyCmd} aria-label="Copy install command">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  </div>

  <!-- All downloads -->
  <div class="all">
    <h2>All downloads</h2>
    <div class="group-grid">
      {#each groups as g}
        <div class="group-card" class:active={g.key === os}>
          <div class="group-head">
            <span class="group-name">{g.name}</span>
            {#if g.key === os}
              <span class="flag">Detected</span>
            {/if}
          </div>
          <div class="files">
            {#each g.files as f}
              <a class="file" href={fileUrl(f.file)}>
                <span class="file-info">
                  <span class="file-arch">{f.arch}</span>
                  <span class="file-name mono">{f.file}</span>
                </span>
                <span class="file-right">
                  <span class="file-size mono">{f.size}</span>
                  <span class="file-dl">Download</span>
                </span>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="footer-notes">
    <p class="auto-note">
      <strong>Updates automatically.</strong> Spaci checks for updates on its own and installs them
      in the background, so you only download once.
    </p>
    <a class="changed-link" href="/changelog">See what changed →</a>
  </div>
</section>

<style>
  .page {
    padding-top: 72px;
    padding-bottom: 24px;
  }
  .head {
    margin-bottom: 40px;
  }
  .head h1 {
    margin-top: 16px;
    font-size: clamp(34px, 5vw, 52px);
  }
  .intro {
    margin-top: 16px;
    font-size: 14px;
    color: var(--muted);
  }

  /* Recommended */
  .reco {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    background: var(--paper-2);
    border: 1px solid var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
    border-radius: var(--radius);
    padding: 28px;
  }
  .reco-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .reco-eyebrow {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .reco-name {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .reco-meta {
    font-size: 13px;
    color: var(--muted);
  }
  .reco-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .reco-alt {
    font-size: 14px;
    color: var(--accent);
    font-weight: 500;
  }

  /* Terminal install */
  .install {
    margin-top: 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .install-label {
    font-size: 13px;
    color: var(--muted);
  }
  .cmd-chip {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    max-width: 100%;
    padding: 8px 8px 8px 18px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 999px;
  }
  .cmd-chip code {
    font-size: 13.5px;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cmd-copy {
    border: 1px solid var(--line-2);
    background: transparent;
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 13px;
    color: var(--ink);
    flex: none;
    transition: border-color 0.15s ease;
  }
  .cmd-copy:hover {
    border-color: var(--ink);
  }

  /* All downloads */
  .all {
    margin-top: 56px;
  }
  .all h2 {
    font-size: clamp(24px, 3.4vw, 32px);
    margin-bottom: 24px;
  }
  .group-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .group-card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 22px 24px;
  }
  .group-card.active {
    border-color: var(--line-2);
  }
  .group-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .group-name {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .flag {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--chip);
    padding: 3px 9px;
    border-radius: 999px;
  }
  .files {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    transition: border-color 0.15s ease;
  }
  .file:hover {
    border-color: var(--accent);
  }
  .file-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .file-arch {
    font-size: 15px;
    font-weight: 500;
  }
  .file-name {
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-right {
    display: flex;
    align-items: center;
    gap: 18px;
    flex: none;
  }
  .file-size {
    font-size: 13px;
    color: var(--muted);
  }
  .file-dl {
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
  }

  /* Footer notes */
  .footer-notes {
    margin-top: 48px;
    padding-top: 28px;
    border-top: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .auto-note {
    color: var(--muted);
    font-size: 15px;
    max-width: 560px;
  }
  .auto-note strong {
    color: var(--ink);
    font-weight: 600;
  }
  .changed-link {
    color: var(--accent);
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .file-name {
      max-width: 140px;
    }
    .file-dl {
      display: none;
    }
  }
</style>
