<script lang="ts">
  import { onMount } from 'svelte';
  import { downloadsFor, fileUrl, type Platform, type ReleaseFile } from '$lib/releases';
  import Icon from '$lib/components/Icon.svelte';
  import LogoMotion from '$lib/components/LogoMotion.svelte';
  import SupportCta from '$lib/components/SupportCta.svelte';
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
  // Real brand marks from svgl.app (static/logos), rendered as <img>.
  const osLogos: Record<Platform, string> = {
    mac: '/logos/macos.svg',
    windows: '/logos/windows.svg',
    linux: '/logos/linux.svg'
  };
  $: osLabel = labels[os];
  $: osLogo = osLogos[os];

  $: macFiles = downloadsFor('mac', data.latest);
  $: winFiles = downloadsFor('windows', data.latest);
  $: linuxFiles = downloadsFor('linux', data.latest);

  $: platformCards = [
    { key: 'mac', name: 'macOS', logo: osLogos.mac, files: macFiles },
    { key: 'windows', name: 'Windows', logo: osLogos.windows, files: winFiles },
    { key: 'linux', name: 'Linux', logo: osLogos.linux, files: linuxFiles }
  ] satisfies { key: Platform; name: string; logo: string; files: ReleaseFile[] }[];

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

  // One-line terminal installer. macOS/Linux use install.sh, Windows
  // install.ps1; both resolve the latest version at runtime.
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

<div class="page">
  <section class="section top">
    <div class="wrap">
      <!-- Page header -->
      <header class="head">
        <span class="eyebrow"><LogoMotion size={15} anim="orbit" /> Download</span>
        <h1>Get Spaci for {osLabel}.</h1>
        <p class="subline mono">v{data.latest.version} · Released {releaseDate}</p>
      </header>

      <!-- Recommended download -->
      <article class="reco">
        <div class="reco-info">
          <img class="reco-logo" src={osLogo} alt="" width="26" height="26" />
          <div class="reco-text">
            <span class="reco-eyebrow">Recommended for you</span>
            <span class="reco-name">Spaci for {osLabel}</span>
            {#if primaryFile}
              <span class="reco-meta mono">{primaryFile.arch} · {primaryFile.size}</span>
            {/if}
          </div>
        </div>
        <div class="reco-actions">
          {#if primaryFile}
            <a class="btn btn-primary reco-btn" href={fileUrl(primaryFile.file)}>
              <Icon name="download" size={18} /> Download
            </a>
          {/if}
          {#if secondaryFile}
            <a class="reco-alt" href={fileUrl(secondaryFile.file)}>Intel Mac instead</a>
          {/if}
        </div>
      </article>

      <!-- Terminal install -->
      <div class="brew">
        <span class="brew-label">Or install from your terminal</span>
        <div class="brew-chip">
          <span class="brew-cmd-ic"><Icon name="command" size={16} /></span>
          <code class="mono">{installCmd}</code>
          <button class="brew-copy" on:click={copyCmd} aria-label="Copy install command">
            <Icon name="copy" size={14} />{copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- All downloads -->
  <section class="section all">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow"><LogoMotion size={15} anim="aperture" /> Every build</span>
        <h2>All downloads.</h2>
        <p class="sec-sub">
          Pick the exact installer for your platform and architecture. Every build ships with
          automatic updates.
        </p>
      </div>

      <div class="dl-grid">
        {#each platformCards as card}
          <article class="dl-card" class:active={card.key === os}>
            {#if card.key === os}<span class="dl-flag">Detected</span>{/if}
            <div class="dl-head">
              <img class="dl-logo" src={card.logo} alt="" width="26" height="26" />
              <h3 class="dl-name">{card.name}</h3>
            </div>
            <div class="dl-files">
              {#each card.files as f}
                <a class="dl-file" href={fileUrl(f.file)}>
                  <span class="dl-file-info">
                    <span class="dl-arch">{f.arch}</span>
                    <span class="dl-fname mono">{f.file}</span>
                  </span>
                  <span class="dl-file-right">
                    <span class="dl-size mono">{f.size}</span>
                    <span class="dl-go" aria-hidden="true"><Icon name="download" size={16} /></span>
                  </span>
                </a>
              {/each}
            </div>
            <p class="dl-meta mono">v{data.latest.version} · {releaseDate}</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <!-- Support the project -->
  <SupportCta />

  <!-- Footer note -->
  <section class="section foot">
    <div class="wrap">
      <div class="foot-card">
        <p class="foot-note">
          <strong>Updates automatically.</strong> Spaci checks for updates on its own and installs
          them in the background, so you only download once.
        </p>
        <a class="foot-link" href="/changelog">See what changed <Icon name="arrow" size={15} /></a>
      </div>
    </div>
  </section>
</div>

<style>
  /* Pull the first section up under the transparent nav, matching the home page. */
  .top {
    padding-top: 132px;
    padding-bottom: 0;
  }
  @media (max-width: 720px) {
    .top {
      padding-top: 108px;
    }
  }

  /* ── Page header ── */
  .head {
    max-width: 680px;
    margin-bottom: 40px;
  }
  .head .eyebrow :global(.lm) {
    color: var(--accent-fg);
  }
  .head h1 {
    margin-top: 16px;
    font-size: clamp(34px, 5vw, 56px);
  }
  .subline {
    margin-top: 16px;
    font-size: 14px;
    color: var(--muted);
  }

  /* ── Recommended (accent ring) ── */
  .reco {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    background: var(--paper-2);
    border: 1px solid var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
    border-radius: var(--radius-lg);
    padding: 30px;
  }
  .reco-info {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
  }
  .reco-logo {
    width: 26px;
    height: 26px;
    object-fit: contain;
    display: block;
    flex: none;
  }
  .reco-text {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .reco-eyebrow {
    font-family: var(--mono);
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-fg);
  }
  .reco-name {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .reco-meta {
    font-size: 13px;
    color: var(--muted);
  }
  .reco-actions {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    flex: none;
  }
  .reco-alt {
    font-size: 14px;
    color: var(--accent-fg);
    font-weight: 600;
    transition: color 0.15s ease;
  }
  .reco-alt:hover {
    color: var(--ink);
  }

  /* ── Terminal install chip (mirrors the home page .brew) ── */
  .brew {
    margin-top: 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .brew-label {
    font-size: 13px;
    color: var(--muted-2);
  }
  .brew-chip {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    max-width: 100%;
    padding: 8px 8px 8px 16px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .brew-cmd-ic {
    color: var(--accent-fg);
    display: inline-flex;
  }
  .brew-chip code {
    font-size: 13.5px;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .brew-copy {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--line-2);
    background: transparent;
    border-radius: 9px;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    flex: none;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .brew-copy:hover {
    border-color: var(--accent-fg);
    background: var(--accent-soft);
  }

  /* ── All downloads ── */
  .all {
    padding-top: 80px;
    padding-bottom: 80px;
  }
  @media (max-width: 720px) {
    .all {
      padding-top: 60px;
      padding-bottom: 60px;
    }
  }
  .sec-head {
    margin-bottom: 36px;
    max-width: 680px;
  }
  .sec-head .eyebrow :global(.lm) {
    color: var(--accent-fg);
  }
  .sec-head h2 {
    margin-top: 16px;
    font-size: clamp(28px, 4vw, 42px);
  }
  .sec-sub {
    margin-top: 16px;
    color: var(--muted);
    font-size: 17px;
    max-width: 600px;
  }

  .dl-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  .dl-card {
    position: relative;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 26px;
    display: flex;
    flex-direction: column;
    transition: border-color 0.18s ease;
  }
  .dl-card:hover {
    border-color: var(--line-2);
  }
  .dl-card.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .dl-flag {
    position: absolute;
    top: 18px;
    right: 18px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent-fg);
    background: var(--chip);
    padding: 4px 9px;
    border-radius: 999px;
  }
  .dl-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dl-logo {
    width: 26px;
    height: 26px;
    object-fit: contain;
    display: block;
  }
  .dl-name {
    font-size: 20px;
  }
  .dl-files {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .dl-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 11px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    transition: border-color 0.15s ease;
  }
  .dl-file:hover {
    border-color: var(--accent-fg);
  }
  .dl-file-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .dl-arch {
    font-size: 14px;
    font-weight: 500;
  }
  .dl-fname {
    font-size: 11.5px;
    color: var(--muted-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dl-file-right {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: none;
  }
  .dl-size {
    font-size: 13px;
    color: var(--muted-2);
  }
  .dl-go {
    display: inline-flex;
    color: var(--muted-2);
    transition: color 0.15s ease;
  }
  .dl-file:hover .dl-go {
    color: var(--accent-fg);
  }
  .dl-meta {
    margin-top: 16px;
    font-size: 12px;
    color: var(--muted-2);
  }

  /* ── Footer note ── */
  .foot {
    padding-top: 0;
    padding-bottom: 96px;
  }
  @media (max-width: 720px) {
    .foot {
      padding-bottom: 64px;
    }
  }
  .foot-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper-2);
    padding: 26px 30px;
  }
  .foot-note {
    color: var(--muted);
    font-size: 15px;
    max-width: 560px;
  }
  .foot-note strong {
    color: var(--ink);
    font-weight: 700;
  }
  .foot-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--accent-fg);
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    transition: gap 0.15s ease;
  }
  .foot-link:hover {
    gap: 9px;
  }

  /* ── Responsive ── */
  @media (max-width: 820px) {
    .dl-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 600px) {
    .reco {
      align-items: flex-start;
      flex-direction: column;
    }
    .reco-actions {
      width: 100%;
    }
    .reco-btn {
      width: 100%;
    }
  }
</style>
