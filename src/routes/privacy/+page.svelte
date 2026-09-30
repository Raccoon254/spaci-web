<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
  title="Privacy · Spaci"
  description="Exactly what the Spaci app and this website send and store, and how to switch it off."
  path="/privacy"
/>

<section class="page wrap">
  <header class="head">
    <span class="eyebrow">Privacy</span>
    <h1>What Spaci sends</h1>
    <p class="intro">Spaci scans your disk on your machine. Nothing about your files ever leaves it.</p>
  </header>

  <div class="body">
    <h2>The app, once a day</h2>
    <p>Once per day the app sends a small anonymous ping so we can count active users. It contains exactly four things:</p>
    <ul>
      <li>a random install ID the app generated for itself (not linked to you, your account or your hardware)</li>
      <li>the app version</li>
      <li>your platform (mac, windows or linux)</li>
      <li>your CPU architecture (for example arm64 or x64)</li>
    </ul>
    <p>
      We never send or store file names, paths, folder names, sizes, scan results, IP addresses or
      browser or system user agents. On our server the install ID is stored only as a salted SHA-256
      hash, never in its original form.
    </p>

    <h2>Turn it off</h2>
    <p>Open Settings in Spaci and switch off usage statistics. The app then sends nothing at all and the install ID is no longer used.</p>

    <h2>Downloads</h2>
    <p>
      When you download an installer from this site we count the download by version, platform and
      whether it is a fresh install or an update. We do not record who downloaded it. Installers are
      hosted on GitHub Releases, which keeps its own download counts.
    </p>

    <h2>Newsletter</h2>
    <p>If you ask to be notified about new releases, we store the email address you give us, only to send those notices.</p>
  </div>
</section>

<style>
  .page {
    padding-top: 72px;
    padding-bottom: 48px;
  }
  .head {
    margin-bottom: 40px;
  }
  .head h1 {
    margin-top: 16px;
    font-size: clamp(34px, 5vw, 52px);
  }
  .intro {
    margin-top: 18px;
    max-width: 560px;
    color: var(--muted);
    font-size: 18px;
  }
  .body {
    max-width: 640px;
  }
  h2 {
    margin: 36px 0 10px;
    font-size: 22px;
  }
  p,
  li {
    color: var(--muted);
  }
  ul {
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
</style>
