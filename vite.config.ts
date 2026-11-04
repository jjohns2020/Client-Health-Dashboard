import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

function publishReviewTemplate(): Plugin {
  const copy = () => {
    mkdirSync('public', { recursive: true });
    copyFileSync('Utilization Review Template_2025.pptx', 'public/utilization-review-template.pptx');
  };
  return { name: 'publish-review-template', buildStart: copy, configureServer: copy };
}

export default defineConfig({
  // GitHub Pages publishes this repository below /ROI-Dashboard/.
  // Local development remains available at the root URL.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), publishReviewTemplate()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
