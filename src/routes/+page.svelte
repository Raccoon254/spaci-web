<script lang="ts">
  import { onMount } from 'svelte';
  import { filesFor, fileUrl, type Platform, type ReleaseFile } from '$lib/releases';
  import Mark from '$lib/components/Mark.svelte';
  import Seo from '$lib/components/Seo.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let os: Platform = 'mac';
  let copied = false;

  const labels: Record<Platform, string> = {
    mac: 'Mac',
    windows: 'Windows',
    linux: 'Linux'
  };

  $: osLabel = labels[os];

  $: macFiles = filesFor('mac', data.latest);
  $: winFiles = filesFor('windows', data.latest);
  $: linuxFiles = filesFor('linux', data.latest);

  $: platformCards = [
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

  const scanRows = [
    { name: 'node_modules/', size: '1.42 GB' },
    { name: '.next/cache/', size: '318 MB' },
    { name: 'build/', size: '206 MB' }
  ];

  function detectOs(): Platform {
    if (typeof navigator === 'undefined') return 'mac';
    const ua = `${navigator.userAgent} ${navigator.platform || ''}`.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('linux') || ua.includes('x11')) return 'linux';
    return 'mac';
  }

  $: installCmd =
    os === 'windows'
      ? 'irm https://spaci.kentom.co.ke/install.ps1 | iex'
      : 'curl -fsSL https://spaci.kentom.co.ke/install.sh | bash';

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
  title="Spaci, reclaim your disk from build artifacts"
  description="Spaci finds the build artifacts, dependency caches and dead projects quietly eating your SSD, then clears them in one click. Safe by design, free and open source for macOS, Windows and Linux."
  path="/"
/>

<!-- Hero -->
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow"><Mark size={15} /> Dev disk cleaner</span>
      <h1>Take back your disk from <span class="hl">node_modules.</span></h1>
      <p class="lede">
        spaci finds and clears <code>build/</code>, <code>node_modules</code>, <code>.next</code>,
        <code>dist</code> and other regenerable folders, safely, in one click.
      </p>

      <div class="cta-row">
        <a class="btn btn-primary" href="/download"><Mark size={16} /> Download for {osLabel}</a>
        <a
          class="btn btn-ghost"
          href="https://github.com/Raccoon254/spaci"
          target="_blank"
          rel="noopener noreferrer">Star on GitHub</a
        >
      </div>
      <p class="cta-note mono">
        Free &amp; open source · <a href="/#features">see it in motion →</a>
      </p>
    </div>

    <!-- Mock app window -->
    <div class="mock" aria-hidden="true">
      <div class="mock-bar">
        <span class="lights">
          <span class="light"></span>
          <span class="light"></span>
          <span class="light"></span>
        </span>
        <span class="mock-title">
          <span class="accent-mark"><Mark size={17} /></span>
          spaci
        </span>
        <button class="mock-clean">Clean now</button>
      </div>

      <div class="mock-body">
        <div class="scan">
          <span class="accent-mark"><Mark size={34} anim="orbit" /></span>
          <div class="scan-text">
            <span class="scan-label">Scanning project…</span>
            <span class="scan-sub mono">1,204 folders · 18,902 files</span>
          </div>
        </div>

        <ul class="rows">
          {#each scanRows as row}
            <li class="row">
              <span class="row-sq"></span>
              <span class="row-name mono">{row.name}</span>
              <span class="row-size mono">{row.size}</span>
            </li>
          {/each}
        </ul>
      </div>

      <div class="mock-foot">
        <span class="foot-left">
          <span class="foot-mark"><Mark size={18} /></span>
          2.13 GB reclaimable
        </span>
        <span class="foot-right mono">disk 64% free</span>
      </div>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" class="section features">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">Why Spaci</span>
      <h2>Built to clean the stuff IDEs leave behind</h2>
    </div>

    <div class="feature-grid">
      <article class="card">
        <span class="accent-mark"><Mark size={22} /></span>
        <h3>One-click cleanup</h3>
        <p>
          Select what to remove and Spaci clears node_modules, build output and dependency caches in
          seconds. No terminal, no guesswork.
        </p>
      </article>
      <article class="card">
        <span class="accent-mark"><Mark size={22} /></span>
        <h3>Smart detection</h3>
        <p>
          Spaci scans your machine and recognises project types automatically, so it always knows
          what is safe to clear and what to leave alone.
        </p>
      </article>
      <article class="card">
        <span class="accent-mark"><Mark size={22} /></span>
        <h3>Safe by design</h3>
        <p>
          Every action shows a preview first, and reversible actions are kept separate from
          permanent ones. You are always in control.
        </p>
      </article>
    </div>
  </div>
</section>

<!-- Download -->
<section class="section download">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">Get Spaci</span>
      <h2>Download for your platform</h2>
    </div>

    <div class="dl-grid">
      {#each platformCards as card}
        <article class="dl-card" class:active={card.key === os}>
          {#if card.key === os}
            <span class="dl-flag">Detected</span>
          {/if}
          <h3 class="dl-name">{card.name}</h3>
          <div class="dl-files">
            {#each card.files as f}
              <a class="dl-file" href={fileUrl(f.file)}>
                <span class="dl-arch">{f.arch}</span>
                <span class="dl-size mono">{f.size}</span>
              </a>
            {/each}
          </div>
          <a class="btn btn-primary dl-btn" href={fileUrl(card.files[0].file)}>Download</a>
          <p class="dl-meta mono">v{data.latest.version} · {releaseDate}</p>
        </article>
      {/each}
    </div>

    <div class="brew">
      <span class="brew-label">Or install from your terminal</span>
      <div class="brew-chip">
        <code class="mono">{installCmd}</code>
        <button class="brew-copy" on:click={copyCmd} aria-label="Copy install command">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Changelog teaser -->
<section class="section teaser">
  <div class="wrap">
    <div class="teaser-head">
      <h2>What's new</h2>
      <a class="teaser-link" href="/changelog">See full changelog →</a>
    </div>

    <div class="teaser-card">
      <div class="teaser-top">
        <span class="ver mono">v{data.latest.version}</span>
        <span class="teaser-date mono">{releaseDate}</span>
        <span class="tag" class:green={data.latest.major}>{data.latest.tag}</span>
      </div>
      <p class="teaser-summary">{data.latest.summary}</p>
      <ul class="teaser-list">
        {#each data.latest.added.slice(0, 4) as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<style>
  /* Hero */
  .hero {
    padding-top: 80px;
    padding-bottom: 40px;
  }
  .hero-grid {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 56px;
    align-items: center;
  }
  .hero-copy h1 {
    margin-top: 22px;
    font-size: clamp(40px, 6vw, 66px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.02;
  }
  .hero-copy h1 .hl {
    color: var(--accent);
  }
  .lede {
    margin-top: 22px;
    max-width: 520px;
    color: var(--muted);
    font-size: 18px;
  }
  .lede code {
    font-family: var(--mono);
    font-size: 0.9em;
    color: var(--ink);
  }
  .cta-row {
    margin-top: 32px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cta-note {
    margin-top: 18px;
    font-size: 13px;
    color: var(--muted);
  }
  .cta-note a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* Mock window */
  .mock {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 26px 60px -30px rgba(32, 32, 32, 0.22);
  }
  .mock-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 18px;
  }
  .lights {
    display: inline-flex;
    gap: 7px;
  }
  .light {
    width: 11px;
    height: 11px;
    border-radius: 999px;
    background: #ddd5cb;
  }
  .mock-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }
  .mock-clean {
    margin-left: auto;
    background: var(--accent);
    color: #fff;
    border: none;
    height: 32px;
    padding: 0 16px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
  }
  .mock-body {
    padding: 18px 18px 16px;
  }
  .scan {
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--accent);
    padding: 8px 6px 18px;
  }
  .scan-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .scan-label {
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }
  .scan-sub {
    font-size: 12.5px;
    color: var(--muted);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 12px 8px;
  }
  .row + .row {
    border-top: 1px solid var(--line);
  }
  .row-sq {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--accent);
    flex: none;
  }
  .row-name {
    font-size: 14px;
    color: var(--ink);
  }
  .row-size {
    margin-left: auto;
    font-size: 13px;
    color: var(--muted);
    flex: none;
  }

  /* Mock footer: reclaimable summary */
  .mock-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    background: #f1ece5;
    border-top: 1px solid var(--line);
  }
  .foot-left {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }
  .foot-mark {
    display: inline-flex;
    color: var(--green);
  }
  .foot-right {
    font-size: 13px;
    color: var(--green);
  }

  /* Section heads */
  .sec-head {
    margin-bottom: 40px;
  }
  .sec-head h2 {
    margin-top: 16px;
    font-size: clamp(28px, 4vw, 40px);
    max-width: 640px;
  }

  /* Features */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 28px;
    color: var(--accent);
  }
  .card h3 {
    margin-top: 18px;
    font-size: 19px;
    color: var(--ink);
  }
  .card p {
    margin-top: 10px;
    color: var(--muted);
    font-size: 15px;
  }

  /* Download */
  .dl-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .dl-card {
    position: relative;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 26px;
    display: flex;
    flex-direction: column;
  }
  .dl-card.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .dl-flag {
    position: absolute;
    top: 18px;
    right: 18px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--chip);
    padding: 4px 9px;
    border-radius: 999px;
  }
  .dl-name {
    font-size: 20px;
  }
  .dl-files {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dl-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    transition: border-color 0.15s ease;
  }
  .dl-file:hover {
    border-color: var(--line-2);
  }
  .dl-arch {
    font-size: 14px;
  }
  .dl-size {
    font-size: 13px;
    color: var(--muted);
  }
  .dl-btn {
    margin-top: 18px;
    justify-content: center;
  }
  .dl-meta {
    margin-top: 14px;
    font-size: 12px;
    color: var(--muted);
  }

  .brew {
    margin-top: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .brew-label {
    font-size: 13px;
    color: var(--muted);
  }
  .brew-chip {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 8px 8px 8px 18px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 999px;
  }
  .brew-chip code {
    font-size: 14px;
    color: var(--ink);
  }
  .brew-copy {
    border: 1px solid var(--line-2);
    background: transparent;
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 13px;
    color: var(--ink);
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }
  .brew-copy:hover {
    border-color: var(--ink);
  }

  /* Teaser */
  .teaser-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }
  .teaser-head h2 {
    font-size: clamp(26px, 3.4vw, 34px);
  }
  .teaser-link {
    color: var(--accent);
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
  }
  .teaser-card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 28px;
  }
  .teaser-top {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ver {
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
  }
  .teaser-date {
    font-size: 13px;
    color: var(--muted);
  }
  .teaser-summary {
    margin-top: 14px;
    font-size: 17px;
  }
  .teaser-list {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .teaser-list li {
    position: relative;
    padding-left: 20px;
    color: var(--muted);
    font-size: 15px;
  }
  .teaser-list li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 9px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--accent);
  }

  /* Responsive */
  @media (max-width: 900px) {
    .hero-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .feature-grid,
    .dl-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 600px) {
    .hero {
      padding-top: 56px;
    }
    .teaser-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
</style>
