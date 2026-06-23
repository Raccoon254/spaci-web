import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Pin the serverless runtime so the build's Node version does not matter.
    adapter: adapter({ runtime: 'nodejs20.x' })
  }
};

export default config;
