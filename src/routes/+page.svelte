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
  let mounted = false;

  const labels: Record<Platform, string> = { mac: 'Mac', windows: 'Windows', linux: 'Linux' };
  const osLogos: Record<Platform, string> = {
    mac: '/logos/macos.svg',
    windows: '/logos/windows.svg',
    linux: '/logos/linux.svg'
  };
  $: osLabel = labels[os];
  $: osLogo = osLogos[os];

  // The hero mark cycles through the named motion-system animations, fading
  // cleanly between each one: Bloom → Elastic → Aperture → Orbit → Spiral.
  const heroAnims = ['bloom', 'elastic', 'aperture', 'orbit', 'spiral'] as const;
  let heroIdx = 0;
  let heroSwapping = false;
  $: heroAnim = heroAnims[heroIdx];

  $: macFiles = downloadsFor('mac', data.latest);
  $: winFiles = downloadsFor('windows', data.latest);
  $: linuxFiles = downloadsFor('linux', data.latest);

  // OS logos are the actual brand marks from svgl.app (static/logos).
  $: platformCards = [
    { key: 'mac', name: 'macOS', logo: '/logos/macos.svg', files: macFiles },
    { key: 'windows', name: 'Windows', logo: '/logos/windows.svg', files: winFiles },
    { key: 'linux', name: 'Linux', logo: '/logos/linux.svg', files: linuxFiles }
  ] satisfies { key: Platform; name: string; logo: string; files: ReleaseFile[] }[];

  const dateFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  $: releaseDate = dateFmt.format(new Date(data.latest.date));

  $: installCmd =
    os === 'windows'
      ? 'irm https://spaci.kentom.co.ke/install.ps1 | iex'
      : 'curl -fsSL https://spaci.kentom.co.ke/install.sh | bash';

  // Shared storage model for the disk-breakdown section. Illustrative numbers
  // for a 512 GB disk that is 64% used.
  const diskTotal = 512;
  const segments = [
    { label: 'Coding', size: 86, color: '#5e93dd', note: 'node_modules, build, caches' },
    { label: 'Media', size: 74, color: '#e6b85c', note: 'photos, video, audio' },
    { label: 'Apps', size: 58, color: '#e8836f', note: 'installed applications' },
    { label: 'Documents', size: 46, color: '#4fcb93', note: 'files and downloads' },
    { label: 'System', size: 64, color: '#8b867f', note: 'macOS and data' },
    { label: 'Free', size: 184, color: 'rgba(140,140,140,0.20)', note: 'available space' }
  ];
  const usedGB = segments.filter((s) => s.label !== 'Free').reduce((a, s) => a + s.size, 0);
  const usedPct = Math.round((usedGB / diskTotal) * 100);
  const pct = (gb: number) => (gb / diskTotal) * 100;
  const gbText = (gb: number) => (gb >= 1000 ? (gb / 1000).toFixed(2) + ' TB' : gb + ' GB');

  const artifacts = [
    'node_modules', '.next', 'target', 'dist', 'build', '__pycache__',
    '.gradle', 'Pods', '.venv', 'vendor', '.turbo', 'DerivedData'
  ];

  const features = [
    { icon: 'broom', title: 'One-click cleanup', body: 'Pick what to remove and Spaci clears node_modules, build output and caches in seconds. No terminal, no rm -rf.' },
    { icon: 'detect', title: 'Smart detection', body: 'Spaci recognises project types across your machine automatically, so it knows what is safe to clear and what to leave alone.' },
    { icon: 'shield', title: 'Safe by design', body: 'Every action previews first, and reversible cleanups stay separate from permanent deletes. You stay in control.' }
  ];

  const steps = [
    { n: '01', title: 'Scan', body: 'One smart scan sweeps your projects and system caches, sizing everything in the background.' },
    { n: '02', title: 'Review', body: 'Recommendations rank what is worth clearing, with a preview of every folder before it goes.' },
    { n: '03', title: 'Reclaim', body: 'Clean in one click. Reversible actions undo from history; permanent ones are clearly flagged.' }
  ];

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

  // Reveal-on-scroll, gated behind .js so content is never hidden without JS.
  function inview(node: HTMLElement) {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          node.classList.add('in');
          obs.unobserve(node);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    obs.observe(node);
    return { destroy: () => obs.disconnect() };
  }

  onMount(() => {
    os = detectOs();
    mounted = true;

    // Cycle the hero animation, pausing if the user prefers reduced motion.
    const reduce =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let swapTimer: ReturnType<typeof setTimeout>;
    const cycle = setInterval(() => {
      heroSwapping = true; // fade out
      swapTimer = setTimeout(() => {
        heroIdx = (heroIdx + 1) % heroAnims.length;
        heroSwapping = false; // fade back in with the next animation
      }, 520);
    }, 6200);
    return () => {
      clearInterval(cycle);
      clearTimeout(swapTimer);
    };
  });
</script>

<Seo
  title="Spaci, reclaim your disk from build artifacts"
  description="Spaci finds the build artifacts, dependency caches and dead projects quietly eating your SSD, then clears them in one click. Safe by design, free and open source for macOS, Windows and Linux."
  path="/"
/>

<div class="page" class:js={mounted}>
  <!-- ══════════ HERO ══════════ -->
  <section class="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="wrap hero-inner">
      <span class="hero-logo" class:swapping={heroSwapping}><LogoMotion size={108} anim={heroAnim} /></span>
      <span class="eyebrow r" use:inview>Developer disk cleaner</span>
      <h1 class="r" use:inview>Take back your disk<br />from <span class="hl">node_modules.</span></h1>
      <p class="lede r" use:inview>
        Spaci finds the build artifacts and caches quietly eating your SSD, then clears them in one
        click. Safe by design.
      </p>
      <div class="cta-row r" use:inview>
        <a class="btn btn-primary" href="/download"><img class="btn-os" src={osLogo} alt="" width="18" height="18" /> Download for {osLabel}</a>
        <a class="btn btn-ghost" href="https://github.com/Raccoon254/spaci" target="_blank" rel="noopener noreferrer">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          Star on GitHub
        </a>
      </div>
      <p class="cta-note mono r" use:inview>Free &amp; open source · macOS, Windows &amp; Linux</p>
    </div>
  </section>

  <!-- artifact marquee -->
  <div class="marquee r" use:inview aria-hidden="true">
    <div class="marquee-track">
      {#each [...artifacts, ...artifacts] as a}
        <span class="chip mono">{a}</span>
      {/each}
    </div>
  </div>

  <!-- ══════════ APP SHOWCASE ══════════ -->
  <section class="section showcase">
    <div class="wrap">
      <div class="sec-head r" use:inview>
        <span class="eyebrow"><LogoMotion size={15} anim="chase" /> A look inside</span>
        <h2>This is how Spaci looks.</h2>
        <p class="sec-sub">
          Smart scan, storage breakdown, recommendations and one-click cleanup, in one calm window.
        </p>
      </div>
    </div>
    <div class="shot r" use:inview>
      <div class="shot-frame">
        <img
          src="/spaci-app.webp"
          alt="The Spaci desktop app showing the Smart Scan screen"
          width="2584"
          height="1784"
          loading="lazy"
        />
      </div>
    </div>
  </section>

  <!-- ══════════ STORAGE BREAKDOWN ══════════ -->
  <section id="storage" class="section">
    <div class="wrap">
      <div class="sec-head r" use:inview>
        <span class="eyebrow"><LogoMotion size={15} anim="aperture" /> Disk breakdown</span>
        <h2>See exactly where your disk went.</h2>
        <p class="sec-sub">
          One scan classifies your whole drive into coding, media, apps, documents and system, so
          the space worth reclaiming stops hiding inside a vague "Other".
        </p>
      </div>

      <div class="cap-card r" use:inview>
        <div class="cap-top">
          <span class="cap-label"><Icon name="chart" size={18} /> Macintosh HD</span>
          <span class="cap-num mono">{gbText(usedGB)} used of {gbText(diskTotal)}</span>
        </div>
        <div class="cap r" use:inview>
          {#each segments as s, i}
            <span class="seg" style="flex-basis:{pct(s.size)}%;background:{s.color};--i:{i}"></span>
          {/each}
        </div>
        <div class="legend">
          {#each segments as s}
            <div class="leg">
              <span class="leg-dot" style="background:{s.color}"></span>
              <span class="leg-name">{s.label}</span>
              <span class="leg-size mono">{gbText(s.size)}</span>
              <span class="leg-note">{s.note}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════ FEATURES ══════════ -->
  <section id="features" class="section">
    <div class="wrap">
      <div class="sec-head r" use:inview>
        <span class="eyebrow"><LogoMotion size={15} anim="bloom" /> Why Spaci</span>
        <h2>Built to clean the stuff IDEs leave behind.</h2>
      </div>
      <div class="feature-grid stagger r" use:inview>
        {#each features as f}
          <article class="card">
            <span class="card-ic"><Icon name={f.icon} size={24} /></span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <!-- ══════════ HOW IT WORKS ══════════ -->
  <section class="section">
    <div class="wrap">
      <div class="sec-head r" use:inview>
        <span class="eyebrow"><LogoMotion size={15} anim="elastic" /> How it works</span>
        <h2>Three steps from cluttered to clean.</h2>
      </div>
      <div class="steps stagger r" use:inview>
        {#each steps as s}
          <div class="step">
            <span class="step-n mono">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ══════════ DOWNLOAD ══════════ -->
  <section id="download" class="section">
    <div class="wrap">
      <div class="sec-head r" use:inview>
        <span class="eyebrow"><LogoMotion size={15} anim="orbit" /> Get Spaci</span>
        <h2>Download for your platform.</h2>
      </div>

      <div class="dl-grid stagger r" use:inview>
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

      <div class="brew r" use:inview>
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

  <!-- ══════════ WHAT'S NEW ══════════ -->
  <section class="section">
    <div class="wrap">
      <div class="teaser-head r" use:inview>
        <h2><span class="th-mark"><LogoMotion size={20} anim="chase" /></span> What's new</h2>
        <a class="teaser-link" href="/changelog">Full changelog <Icon name="arrow" size={15} /></a>
      </div>
      <div class="teaser-card r" use:inview>
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

  <!-- ══════════ SUPPORT ══════════ -->
  <SupportCta />

  <!-- ══════════ FINAL CTA ══════════ -->
  <section class="section cta-band">
    <div class="wrap cta-inner r" use:inview>
      <span class="cta-mark"><LogoMotion size={60} anim="spiral" /></span>
      <h2>Reclaim your disk today.</h2>
      <p>Free, open source, and it updates itself. Your SSD will thank you.</p>
      <div class="cta-actions">
        <a class="btn btn-primary" href="/download"><img class="btn-os" src={osLogo} alt="" width="18" height="18" /> Download for {osLabel}</a>
        <a class="btn btn-ghost" href="/changelog">What's new</a>
      </div>
    </div>
  </section>
</div>

<style>
  /* ══ HERO ══
     (Scroll-reveal rules for .r / .stagger / .cap .seg live globally in
     app.css under .page.js so Svelte never prunes the JS-added .in class.) */
  .hero {
    position: relative;
    min-height: 94vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    /* slide up under the transparent nav so the hero image sits behind it */
    margin-top: -65px;
    padding: 140px 0 64px;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
    background: url('/hero-bg.svg') center / cover no-repeat;
  }
  /* fade the image cleanly into the page background at the edges */
  .hero-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(32, 32, 32, 0.35) 0%, transparent 30%, transparent 60%, var(--paper) 100%);
  }
  .hero-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 760px;
  }
  .hero-logo {
    color: #ffffff;
    filter: drop-shadow(0 8px 26px rgba(0, 0, 0, 0.55));
    margin-bottom: 26px;
    transition: opacity 0.52s ease, transform 0.52s ease;
  }
  .hero-logo.swapping {
    opacity: 0;
    transform: scale(0.9);
  }
  .hero-inner .eyebrow {
    margin-bottom: 18px;
  }
  .hero-inner h1 {
    font-size: clamp(40px, 6.2vw, 70px);
    line-height: 1.0;
  }
  .hero-inner h1 .hl {
    color: var(--accent-fg);
  }
  .lede {
    margin-top: 22px;
    max-width: 500px;
    color: var(--muted);
    font-size: 18px;
  }
  .cta-row {
    margin-top: 32px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .cta-note {
    margin-top: 18px;
    font-size: 12.5px;
    color: var(--muted-2);
  }

  /* ── Marquee ── */
  .marquee {
    margin: 8px 0 8px;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
    overflow: hidden;
  }
  .marquee-track {
    display: flex;
    gap: 12px;
    width: max-content;
    animation: marquee 34s linear infinite;
  }
  @keyframes marquee {
    to {
      transform: translateX(-50%);
    }
  }
  .chip {
    font-size: 13px;
    color: var(--muted);
    border: 1px solid var(--line);
    background: var(--paper-2);
    padding: 7px 14px;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* ── App showcase (parallax screenshot) ── */
  .showcase .sec-head {
    margin-bottom: 30px;
  }
  .shot {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .shot-frame {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    aspect-ratio: 2584 / 1784;
  }
  .shot-frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ── Section heads ── */
  .section {
    padding: 92px 0;
  }
  @media (max-width: 720px) {
    .section {
      padding: 60px 0;
    }
  }
  .sec-head {
    margin-bottom: 40px;
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

  /* ── Storage breakdown ── */
  .cap-card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 30px;
  }
  .cap-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }
  .cap-label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 700;
  }
  .cap-num {
    font-size: 13.5px;
    color: var(--muted-2);
  }
  .cap {
    height: 26px;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    gap: 3px;
    background: var(--track);
  }
  .seg {
    height: 100%;
    border-radius: 4px;
    transform-origin: left;
  }
  .legend {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px 28px;
    margin-top: 26px;
  }
  .leg {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 9px;
  }
  .leg-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .leg-name {
    font-size: 14px;
    font-weight: 600;
  }
  .leg-size {
    font-size: 13px;
    color: var(--muted);
  }
  .leg-note {
    grid-column: 2 / -1;
    font-size: 12px;
    color: var(--muted-2);
  }

  /* ── Features ── */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  .card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 28px;
    transition: border-color 0.18s ease;
  }
  .card:hover {
    border-color: var(--line-2);
  }
  .card-ic {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 13px;
    background: var(--accent-soft);
    color: var(--accent-fg);
  }
  .card h3 {
    margin-top: 20px;
    font-size: 19px;
  }
  .card p {
    margin-top: 10px;
    color: var(--muted);
    font-size: 14.5px;
  }

  /* ── How it works ── */
  .steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  .step {
    padding: 26px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .step-n {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent-fg);
    letter-spacing: 0.1em;
  }
  .step h3 {
    margin-top: 12px;
    font-size: 20px;
  }
  .step p {
    margin-top: 9px;
    color: var(--muted);
    font-size: 14.5px;
  }

  /* ── Download ── */
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
  }
  .dl-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 13px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    transition: border-color 0.15s ease;
  }
  .dl-file:hover {
    border-color: var(--accent-fg);
  }
  .dl-arch {
    font-size: 14px;
  }
  .dl-size {
    font-size: 13px;
    color: var(--muted-2);
  }
  .dl-btn {
    margin-top: 18px;
    width: 100%;
  }
  .dl-meta {
    margin-top: 14px;
    font-size: 12px;
    color: var(--muted-2);
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

  /* ── What's new ── */
  .teaser-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }
  .teaser-head h2 {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: clamp(26px, 3.4vw, 36px);
  }
  .th-mark {
    color: var(--accent-fg);
    display: inline-flex;
  }
  .teaser-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--accent-fg);
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
  }
  .teaser-card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 30px;
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
    color: var(--muted-2);
  }
  .teaser-summary {
    margin-top: 16px;
    font-size: 17px;
  }
  .teaser-list {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 26px;
  }
  .teaser-list li {
    position: relative;
    padding-left: 20px;
    color: var(--muted);
    font-size: 14.5px;
  }
  .teaser-list li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 9px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--accent-fg);
  }

  /* ── Final CTA ── */
  .cta-band {
    text-align: center;
  }
  .cta-inner {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 60px 28px;
    background: var(--paper-2);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .cta-mark {
    color: var(--accent-fg);
    margin-bottom: 20px;
  }
  .cta-inner h2 {
    font-size: clamp(30px, 4.5vw, 46px);
  }
  .cta-inner p {
    margin-top: 14px;
    color: var(--muted);
    font-size: 17px;
  }
  .cta-actions {
    margin-top: 28px;
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn-os {
    width: 18px;
    height: 18px;
    object-fit: contain;
    display: block;
  }

  /* ── Responsive ── */
  @media (max-width: 820px) {
    .feature-grid,
    .steps,
    .dl-grid {
      grid-template-columns: 1fr;
    }
    .legend {
      grid-template-columns: 1fr 1fr;
    }
    /* Tablet: square the CTA band but keep all four borders. */
    .cta-inner {
      border-radius: 0;
    }
  }
  @media (max-width: 600px) {
    /* Hero: left-aligned, tighter, full-width buttons */
    .hero {
      min-height: auto;
      padding: 104px 0 52px;
      text-align: left;
    }
    .hero-inner {
      align-items: flex-start;
    }
    .hero-logo {
      margin-bottom: 18px;
    }
    .hero-inner h1 {
      font-size: clamp(33px, 10vw, 44px);
    }
    .lede {
      margin-top: 18px;
      font-size: 16px;
    }
    .cta-row {
      width: 100%;
      gap: 10px;
    }
    .cta-row .btn {
      width: 100%;
    }

    /* Storage legend: compact two-up, drop the descriptions */
    .legend {
      grid-template-columns: 1fr 1fr;
      gap: 14px 18px;
    }
    .leg-note {
      display: none;
    }
    .cap-card {
      padding: 22px;
    }
    .shot {
      padding: 0 16px;
    }

    .teaser-list {
      grid-template-columns: 1fr;
    }
    .teaser-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    /* Final CTA: left-aligned, full-width buttons */
    .cta-band {
      text-align: left;
    }
    .cta-inner {
      align-items: flex-start;
      padding: 40px 20px;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }
    .cta-mark {
      align-self: flex-start;
    }
    .cta-actions {
      width: 100%;
      justify-content: flex-start;
    }
    .cta-actions .btn {
      width: 100%;
    }
  }
</style>
