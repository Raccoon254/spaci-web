<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  $: s = data.stats;
  $: platforms = s
    ? [...new Set(s.perDay.flatMap((d) => Object.keys(d.downloads.byPlatform)))].sort()
    : [];
  $: totals = s
    ? {
        downloads: s.perDay.reduce((n, d) => n + d.downloads.total, 0),
        github: s.perDay.reduce((n, d) => n + d.githubDelta, 0),
        newInstalls: s.perDay.reduce((n, d) => n + d.newInstalls, 0)
      }
    : null;
</script>

<svelte:head>
  <title>Stats · Spaci</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="page wrap">
  <header class="head">
    <span class="eyebrow">Admin</span>
    <h1>Daily stats</h1>
    {#if s}
      <p class="intro">
        Last {s.days} days, UTC. Range:
        {#each [7, 30, 90] as n, i}
          {#if i > 0}<span class="sep">/</span>{/if}
          <a href="?days={n}" class:on={s.days === n}>{n}</a>
        {/each}
      </p>
    {/if}
  </header>

  {#if !s || !totals}
    <p class="note">Stats are unavailable right now (database unreachable).</p>
  {:else}
    <div class="cards">
      <div class="card"><span class="label">Active, 7 days</span><span class="num mono">{s.active7}</span></div>
      <div class="card"><span class="label">Active, 30 days</span><span class="num mono">{s.active30}</span></div>
      <div class="card"><span class="label">Test builds, 7 days</span><span class="num mono">{s.testInstalls7 ?? 0}</span></div>
      <div class="card"><span class="label">Downloads via site</span><span class="num mono">{totals.downloads}</span></div>
      <div class="card"><span class="label">GitHub downloads</span><span class="num mono">{totals.github}</span></div>
      <div class="card"><span class="label">New installs</span><span class="num mono">{totals.newInstalls}</span></div>
    </div>

    <h2>Per day</h2>
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th class="r">Downloads</th>
            <th class="r">Install</th>
            <th class="r">Update</th>
            {#each platforms as p}<th class="r">{p}</th>{/each}
            <th class="r">GitHub +</th>
            <th class="r">Active</th>
            <th class="r">New</th>
          </tr>
        </thead>
        <tbody>
          {#each s.perDay as d}
            <tr>
              <td class="mono">{d.day}</td>
              <td class="r mono">{d.downloads.total}</td>
              <td class="r mono">{d.downloads.install}</td>
              <td class="r mono">{d.downloads.update}</td>
              {#each platforms as p}<td class="r mono">{d.downloads.byPlatform[p] ?? 0}</td>{/each}
              <td class="r mono">{d.githubDelta}</td>
              <td class="r mono">{d.activeInstalls}</td>
              <td class="r mono">{d.newInstalls}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <h2>Versions in use</h2>
    <p class="note">Each active install counted once at its latest version, last 7 days.</p>
    {#if s.versions.length}
      <table class="narrow">
        <thead><tr><th>Version</th><th class="r">Installs</th></tr></thead>
        <tbody>
          {#each s.versions as v}
            <tr><td class="mono">v{v.version}</td><td class="r mono">{v.installs}</td></tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="note">No pings yet.</p>
    {/if}
  {/if}
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
    font-size: clamp(34px, 5vw, 48px);
  }
  .intro {
    margin-top: 14px;
    color: var(--muted);
  }
  .intro a {
    color: var(--muted);
    padding: 0 4px;
  }
  .intro a.on,
  .intro a:hover {
    color: var(--accent-fg);
  }
  .sep {
    color: var(--faint);
  }
  h2 {
    margin: 48px 0 16px;
    font-size: 22px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 14px;
  }
  .card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }
  .num {
    font-size: 30px;
    color: var(--ink);
  }
  .scroll {
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .narrow {
    max-width: 360px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
  }
  th,
  td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  tbody tr:last-child td {
    border-bottom: 0;
  }
  th {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted-2);
    background: var(--paper-2);
  }
  .r {
    text-align: right;
  }
  tbody tr:hover {
    background: var(--paper-2);
  }
  .note {
    color: var(--muted);
    font-size: 14px;
  }
</style>
