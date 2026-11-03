import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages publishes this repository below /ROI-Dashboard/.
  // Local development remains available at the root URL.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
