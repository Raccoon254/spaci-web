<script lang="ts">
  // The Spaci mark: six ellipses arranged around a ring, rotated in 60 deg
  // steps. Motion variants match the desktop app: static, breathe, chase, spin,
  // gauge. Color follows `currentColor` so it inherits from the parent.
  export let size = 28;
  export let anim: 'none' | 'breathe' | 'chase' | 'spin' | 'gauge' | 'orbit' = 'none';

  const segs = [0, 60, 120, 180, 240, 300];
</script>

<svg
  class="spaci-mark anim-{anim}"
  width={size}
  height={size}
  viewBox="15 15 70 70"
  fill="none"
  style="overflow:visible"
  aria-hidden="true"
>
  <g class="ring">
    {#each segs as deg, i}
      <ellipse
        cx="50"
        cy="22"
        rx="12"
        ry="5.5"
        fill="currentColor"
        transform="rotate({deg} 50 50)"
        style="--i:{i}"
        class="seg"
      />
    {/each}
  </g>
</svg>

<style>
  .spaci-mark {
    display: block;
  }
  .ring {
    transform-origin: 50% 50%;
  }
  .seg {
    transform-origin: 50% 50%;
  }

  /* breathe: segments fade in and out softly in sequence */
  .anim-breathe .seg {
    animation: seg-breathe 2.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.18s);
  }
  @keyframes seg-breathe {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 1;
    }
  }

  /* chase: a bright pulse travels around the ring */
  .anim-chase .seg {
    opacity: 0.28;
    animation: seg-chase 1.5s linear infinite;
    animation-delay: calc(var(--i) * 0.25s);
  }
  @keyframes seg-chase {
    0%,
    70%,
    100% {
      opacity: 0.28;
    }
    20% {
      opacity: 1;
    }
  }

  /* spin: the whole ring rotates */
  .anim-spin .ring {
    animation: ring-spin 3.6s linear infinite;
  }
  @keyframes ring-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* gauge: ring rotates while segments brighten by position, like a meter */
  .anim-gauge .ring {
    animation: ring-spin 5s linear infinite;
  }
  .anim-gauge .seg {
    opacity: calc(0.3 + var(--i) * 0.12);
  }

  /* orbit: ring spins with a comet-trail gradient of segment opacity */
  .anim-orbit .ring {
    animation: ring-spin 4.2s linear infinite;
  }
  .anim-orbit .seg {
    opacity: calc(0.62 + var(--i) * 0.076);
  }

  @media (prefers-reduced-motion: reduce) {
    .seg,
    .ring {
      animation: none !important;
    }
  }
</style>
