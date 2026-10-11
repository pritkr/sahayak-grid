// @ts-check
import { defineConfig } from 'astro/config';

// Static, offline-first. No adapter — deploy dist/ to Cloudflare Pages / any static host.
// API in api/ deploys separately as a Cloudflare Worker (Hono).
export default defineConfig({
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
