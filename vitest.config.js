import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['tests/integration/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/js/utils/**', 'src/js/models/**'],
      reporter: ['text', 'html'],
    },
  },
});
