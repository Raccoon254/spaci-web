<script lang="ts">
  import { onMount } from 'svelte';
  import { latest, filesFor, fileUrl, type Platform } from '$lib/releases';
  import Mark from '$lib/components/Mark.svelte';

  let os: Platform = 'mac';
  let copied = false;

  const labels: Record<Platform, string> = {
    mac: 'Mac',
    windows: 'Windows',
    linux: 'Linux'
  };

  $: osLabel = labels[os];

  const macFiles = filesFor('mac');
  const winFiles = filesFor('windows');
  const linuxFiles = filesFor('linux');

  const platformCards: { key: Platform; name: string; files: typeof macFiles }[] = [
    { key: 'mac', name: 'macOS', files: macFiles },
    { key: 'windows', name: 'Windows', files: winFiles },
    { key: 'linux', name: 'Linux', files: linuxFiles }
  ];

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  $: releaseDate = dateFmt.format(new Date(latest.date));

  const scanRows = [
    { name: 'node_modules', path: '~/dev/portfolio', size: '1.2 GB' },
    { name: '.next cache', path: '~/dev/shop', size: '480 MB' },
    { name: 'Xcode DerivedData', path: '~/Library/Developer', size: '3.1 GB' },
    { name: 'Pods', path: '~/dev/app', size: '720 MB' }
  ];

  function detectOs(): Platform {
    if (typeof navigator === 'undefined') return 'mac';
    const ua = `${navigator.userAgent} ${navigator.platform || ''}`.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('linux') || ua.includes('x11')) return 'linux';
    return 'mac';
  }

  async function copyBrew() {
    try {
      await navigator.clipboard.writeText('brew install --cask spaci');
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

<svelte:head>
  <title>Spaci, reclaim your disk from build artifacts</title>
  <meta
    name="description"
    content="Spaci finds the build artifacts, dependency caches and dead projects quietly eating your SSD, then clears them in one click. Safe by design, free and open source for macOS, Windows and Linux."
  />
</svelte:head>

<!-- Hero -->
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">Dev disk cleaner</span>
      <h1>Take back your disk from node_modules.</h1>
      <p class="lede">
        Spaci finds the build artifacts, dependency caches and dead projects quietly eating your
        SSD, then clears them in one click. Safe by design, with a preview before anything is
        removed.
      </p>

      <div class="cta-row">
        <a class="btn btn-primary" href="/download">Download for {osLabel}</a>
        <a class="btn btn-ghost" href="/changelog">View changelog</a>
      </div>
      <p class="cta-note mono">Free and open source · macOS, Windows, Linux</p>
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
          <Mark size={14} />
          Spaci
        </span>
      </div>

      <div class="mock-body">
        <div class="scan">
          <Mark size={56} anim="chase" />
          <span class="scan-label">Scanning projects…</span>
        </div>

        <ul class="rows">
          {#each scanRows as row}
            <li class="row">
              <span class="row-dot"></span>
              <span class="row-name">{row.name}</span>
              <span class="row-path">{row.path}</span>
              <span class="row-size mono">{row.size}</span>
            </li>
          {/each}
        </ul>

        <div class="gauge">
          <div class="gauge-head">
            <span class="gauge-label">Reclaimable</span>
            <span class="gauge-value mono">18.5 GB</span>
          </div>
          <div class="gauge-track">
            <div class="gauge-fill"></div>
          </div>
        </div>
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
        <Mark size={22} />
        <h3>One-click cleanup</h3>
        <p>
          Select what to remove and Spaci clears node_modules, build output and dependency caches in
          seconds. No terminal, no guesswork.
        </p>
      </article>
      <article class="card">
        <Mark size={22} />
        <h3>Smart detection</h3>
        <p>
          Spaci scans your machine and recognises project types automatically, so it always knows
          what is safe to clear and what to leave alone.
        </p>
      </article>
      <article class="card">
        <Mark size={22} />
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
          <p class="dl-meta mono">v{latest.version} · {releaseDate}</p>
        </article>
      {/each}
    </div>

    <div class="brew">
      <span class="brew-label">Or install with Homebrew</span>
      <div class="brew-chip">
        <code class="mono">brew install --cask spaci</code>
        <button class="brew-copy" on:click={copyBrew} aria-label="Copy Homebrew command">
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
        <span class="ver mono">v{latest.version}</span>
        <span class="teaser-date mono">{releaseDate}</span>
        <span class="tag" class:green={latest.major}>{latest.tag}</span>
      </div>
      <p class="teaser-summary">{latest.summary}</p>
      <ul class="teaser-list">
        {#each latest.added.slice(0, 4) as item}
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
    margin-top: 18px;
    font-size: clamp(40px, 6vw, 68px);
  }
  .lede {
    margin-top: 22px;
    max-width: 560px;
    color: var(--muted);
    font-size: 18px;
  }
  .cta-row {
    margin-top: 32px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cta-note {
    margin-top: 16px;
    font-size: 13px;
    color: var(--muted);
  }

  /* Mock window */
  .mock {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .mock-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
  }
  .lights {
    display: inline-flex;
    gap: 7px;
  }
  .light {
    width: 11px;
    height: 11px;
    border-radius: 999px;
    background: var(--line-2);
  }
  .mock-title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
  }
  .mock-body {
    padding: 28px 22px 24px;
  }
  .scan {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--accent);
    padding: 8px 0 24px;
  }
  .scan-label {
    font-size: 14px;
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
    gap: 10px;
    padding: 11px 12px;
    border-radius: var(--radius-sm);
  }
  .row:nth-child(odd) {
    background: rgba(32, 32, 32, 0.02);
  }
  .row-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--accent);
    flex: none;
  }
  .row-name {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
  .row-path {
    font-size: 13px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-size {
    margin-left: auto;
    font-size: 13px;
    color: var(--ink);
    flex: none;
  }
  .gauge {
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid var(--line);
  }
  .gauge-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 9px;
  }
  .gauge-label {
    font-size: 13px;
    color: var(--muted);
  }
  .gauge-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
  }
  .gauge-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(32, 32, 32, 0.06);
    overflow: hidden;
  }
  .gauge-fill {
    width: 64%;
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
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
