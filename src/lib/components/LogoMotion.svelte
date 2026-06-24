<script lang="ts">
  // The animated Spaci mark, ported straight from the project's motion system
  // (Spaci Logo - Motion.dc.html). Six ellipses on a ring; each segment is
  // wrapped in a rotated <g> and animated about its own fill-box centre, so
  // per-segment transforms (translate / scale / rotate) never drift the ring.
  // Kept separate from the static Mark logo so the brand mark itself is untouched.
  export let size = 96;
  export let anim:
    | 'breathe'
    | 'bloom'
    | 'elastic'
    | 'aperture'
    | 'orbit'
    | 'spiral'
    | 'chase'
    | 'none' = 'breathe';

  const segs = [0, 60, 120, 180, 240, 300];
</script>

<svg
  class="lm lm-{anim}"
  width={size}
  height={size}
  viewBox="0 0 100 100"
  fill="none"
  aria-hidden="true"
>
  {#each segs as deg, i}
    <g transform="rotate({deg} 50 50)">
      <ellipse cx="50" cy="22" rx="12" ry="5.5" fill="currentColor" class="seg" style="--i:{i}" />
    </g>
  {/each}
</svg>

<style>
  .lm {
    display: block;
    overflow: visible;
    transform-origin: center;
  }
  .seg {
    transform-box: fill-box;
    transform-origin: center;
  }

  /* whole-mark rotation animations (kept gentle / unhurried) */
  .lm-orbit {
    animation: lm-spin 13s linear infinite;
  }
  .lm-orbit .seg {
    animation: lm-counter 6.5s linear infinite;
  }
  .lm-spiral {
    animation: lm-spin 10s linear infinite;
  }
  .lm-spiral .seg {
    animation: lm-spiral 4.8s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.16s);
  }
  .lm-breathe {
    animation: lm-breathe 4.8s ease-in-out infinite;
  }

  /* per-segment animations */
  .lm-bloom .seg {
    animation: lm-bloom 3.8s ease-in-out infinite;
  }
  .lm-elastic .seg {
    animation: lm-elastic 4.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.13s);
  }
  .lm-aperture .seg {
    animation: lm-twirl 5.2s linear infinite;
  }
  .lm-chase .seg {
    opacity: 0.16;
    animation: lm-chase 2.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.42s);
  }

  @keyframes lm-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes lm-counter {
    to {
      transform: rotate(-360deg);
    }
  }
  @keyframes lm-breathe {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.07);
    }
  }
  @keyframes lm-bloom {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-9px);
    }
  }
  @keyframes lm-elastic {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    30% {
      transform: scale(1.18);
      opacity: 1;
    }
    44% {
      transform: scale(0.94);
    }
    56% {
      transform: scale(1.02);
    }
    66% {
      transform: scale(1);
    }
    86% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }
  @keyframes lm-twirl {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes lm-spiral {
    0% {
      opacity: 0;
      transform: scale(0) rotate(-120deg);
    }
    40% {
      opacity: 1;
      transform: scale(1) rotate(0);
    }
    82% {
      opacity: 1;
      transform: scale(1) rotate(0);
    }
    100% {
      opacity: 0;
      transform: scale(0) rotate(120deg);
    }
  }
  @keyframes lm-chase {
    0% {
      opacity: 0.16;
    }
    10% {
      opacity: 1;
    }
    30% {
      opacity: 0.16;
    }
    100% {
      opacity: 0.16;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lm,
    .seg {
      animation: none !important;
    }
  }
</style>
