import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // Allow the in-container preview browser (host.docker.internal) to reach the
  // dev server for visual checks. Harmless for normal localhost development.
  server: {
    allowedHosts: ['host.docker.internal']
  }
});
