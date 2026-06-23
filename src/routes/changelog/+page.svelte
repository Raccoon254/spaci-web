<script lang="ts">
  import { releases } from '$lib/releases';

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  function fmt(iso: string): string {
    return dateFmt.format(new Date(iso));
  }
</script>

<svelte:head>
  <title>Changelog · Spaci</title>
  <meta name="description" content="Every release of Spaci, with what was added, improved and fixed in each version." />
</svelte:head>

<section class="page wrap">
  <header class="head">
    <span class="eyebrow">Changelog</span>
    <h1>Every release of Spaci</h1>
    <p class="intro">
      A running history of what we have shipped. New features, refinements and fixes, newest first.
    </p>
  </header>

  <ol class="timeline">
    {#each releases as r, i}
      <li class="entry">
        <span class="node" class:major={r.major}></span>

        <div class="entry-body">
          <div class="entry-top">
            <span class="ver mono">v{r.version}</span>
            <span class="date mono">{fmt(r.date)}</span>
            <span class="tag" class:green={r.major}>{r.tag}</span>
            {#if i === 0}
              <span class="latest">Latest</span>
            {/if}
          </div>

          <p class="summary">{r.summary}</p>

          {#if r.added.length}
            <div class="group">
              <span class="group-label">New</span>
              <ul class="list added">
                {#each r.added as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if r.improved.length}
            <div class="group">
              <span class="group-label">Improved</span>
              <ul class="list improved">
                {#each r.improved as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if r.fixed.length}
            <div class="group">
              <span class="group-label">Fixed</span>
              <ul class="list fixed">
                {#each r.fixed as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
</section>

<style>
  .page {
    padding-top: 72px;
    padding-bottom: 24px;
  }
  .head {
    margin-bottom: 56px;
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

  .timeline {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .entry {
    position: relative;
    padding-left: 36px;
    padding-bottom: 48px;
    border-left: 1px solid var(--line);
  }
  .entry:last-child {
    border-left-color: transparent;
    padding-bottom: 0;
  }
  .node {
    position: absolute;
    left: -6px;
    top: 4px;
    width: 11px;
    height: 11px;
    border-radius: 999px;
    background: var(--paper);
    border: 2px solid var(--line-2);
  }
  .node.major {
    border-color: var(--accent);
    background: var(--accent);
  }

  .entry-top {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ver {
    font-size: 17px;
    font-weight: 500;
    color: var(--ink);
  }
  .date {
    font-size: 13px;
    color: var(--muted);
  }
  .latest {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--green);
    background: rgba(31, 138, 91, 0.12);
    padding: 3px 9px;
    border-radius: 999px;
  }

  .summary {
    margin-top: 14px;
    font-size: 18px;
  }

  .group {
    margin-top: 22px;
  }
  .group-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .list li {
    position: relative;
    padding-left: 20px;
    color: var(--ink);
    font-size: 15px;
  }
  .list li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 9px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
  }
  .list.added li::before {
    background: var(--accent);
  }
  .list.improved li::before {
    background: var(--green);
  }
  .list.fixed li::before {
    background: var(--muted);
  }

  @media (max-width: 600px) {
    .entry {
      padding-left: 28px;
    }
  }
</style>
