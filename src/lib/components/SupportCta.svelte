<script lang="ts">
  // "Support Spaci" section: two flat cards linking out to donate / partner.
  // No props; drop in with <SupportCta />. Renders statically (no reveal
  // classes), so it looks correct on any page, not just the homepage root.
  import Icon from '$lib/components/Icon.svelte';
  import LogoMotion from '$lib/components/LogoMotion.svelte';
</script>

<section class="support section">
  <div class="wrap">
    <div class="head">
      <span class="eyebrow">
        <LogoMotion size={15} anim="bloom" />
        Support the project
      </span>
      <h2>Keep Spaci free and open.</h2>
      <p class="sub">
        Spaci is built in the open and given away for free. A little support goes a long way.
      </p>
    </div>

    <div class="cards">
      <a
        class="card"
        href="https://www.kentom.co.ke/donate"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="tile" aria-hidden="true">
          <Icon name="heart" size={24} />
        </span>
        <span class="card-body">
          <span class="card-title">Donate</span>
          <span class="card-desc">
            Spaci is free and open source. Chip in to fund development and keep it that way.
          </span>
          <span class="card-cta">
            Donate
            <Icon name="arrow" size={15} />
          </span>
        </span>
      </a>

      <a
        class="card"
        href="https://www.kentom.co.ke/partners"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="tile" aria-hidden="true">
          <Icon name="partner" size={24} />
        </span>
        <span class="card-body">
          <span class="card-title">Become a partner</span>
          <span class="card-desc">
            Building something developers love? Partner with us to reach them.
          </span>
          <span class="card-cta">
            Partner with us
            <Icon name="arrow" size={15} />
          </span>
        </span>
      </a>
    </div>
  </div>
</section>

<style>
  .head {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 14px;
    margin-bottom: 44px;
  }

  .head h2 {
    margin: 0;
    font-size: clamp(26px, 3.4vw, 34px);
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ink);
  }

  .sub {
    margin: 0;
    max-width: 44ch;
    font-size: 15.5px;
    line-height: 1.55;
    color: var(--muted);
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .card {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    padding: 27px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    transition:
      transform 0.16s ease,
      border-color 0.16s ease;
  }
  .card:hover {
    border-color: var(--line-2);
    transform: translateY(-2px);
  }

  .tile {
    flex: none;
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 13px;
    background: var(--accent-soft);
    color: var(--accent-fg);
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
  }

  .card-title {
    font-size: 19px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
  }

  .card-desc {
    font-size: 14.5px;
    line-height: 1.5;
    color: var(--muted);
  }

  .card-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-fg);
  }
  .card-cta :global(.icon) {
    transition: transform 0.16s ease;
  }
  .card:hover .card-cta :global(.icon) {
    transform: translateX(3px);
  }

  @media (max-width: 640px) {
    .cards {
      grid-template-columns: 1fr;
    }
    .head {
      align-items: flex-start;
      text-align: left;
      margin-bottom: 30px;
    }
    .card {
      padding: 22px;
    }
  }
</style>
