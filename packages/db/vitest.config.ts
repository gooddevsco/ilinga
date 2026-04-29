import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/seed/**', 'src/**/*.integration.test.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
});
