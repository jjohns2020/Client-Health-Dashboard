import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

function publishReviewTemplate(): Plugin {
  const copy = () => {
    mkdirSync('public', { recursive: true });
    copyFileSync('Utilization Review Template_2025.pptx', 'public/utilization-review-template.pptx');
    copyFileSync('CO_Command_Center.html', 'public/command-center.html');
  };
  return { name: 'publish-review-template', buildStart: copy, configureServer: copy };
}

export default defineConfig({
  // GitHub Pages publishes this repository below /Client-Health-Dashboard/.
  // Local development remains available at the root URL.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), publishReviewTemplate()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
