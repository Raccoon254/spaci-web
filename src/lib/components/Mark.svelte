<script lang="ts">
  // The Spaci mark: six ellipses arranged around a ring. The viewBox is cropped
  // tight (15 15 70 70) so the ring fills the box and reads boldly at small sizes.
  //
  // IMPORTANT: motion is done by rotating the WHOLE svg rigidly and/or animating
  // per-segment OPACITY only. We never apply a transform to individual segments,
  // so they can never drift out of the ring.
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
  aria-hidden="true"
>
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
</svg>

<style>
  .spaci-mark {
    display: block;
    transform-origin: center;
  }

  /* Rigid whole-mark rotation. Rotating the svg element itself can never
     scatter the segments. */
  .anim-spin {
    animation: mark-spin 3.6s linear infinite;
  }
  .anim-orbit {
    animation: mark-spin 4.6s linear infinite;
  }
  .anim-gauge {
    animation: mark-spin 5s linear infinite;
  }
  @keyframes mark-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* orbit + gauge keep every segment clearly visible, with a brightness
     gradient that reads as motion as the whole ring turns. */
  .anim-orbit .seg {
    opacity: calc(0.6 + var(--i) * 0.08);
  }
  .anim-gauge .seg {
    opacity: calc(0.5 + var(--i) * 0.083);
  }

  /* opacity-only animations, no movement */
  .anim-breathe .seg {
    animation: seg-breathe 2.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.18s);
  }
  @keyframes seg-breathe {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }

  .anim-chase .seg {
    opacity: 0.4;
    animation: seg-chase 1.5s linear infinite;
    animation-delay: calc(var(--i) * 0.25s);
  }
  @keyframes seg-chase {
    0%,
    70%,
    100% {
      opacity: 0.4;
    }
    20% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spaci-mark,
    .seg {
      animation: none !important;
    }
  }
</style>
