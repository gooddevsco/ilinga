import { defineConfig } from 'vitest/config';
// vitest 2 brings vite 5 in by transitive types; Vite 6 ships separately for
// the dev/build pipeline. We don't include @vitejs/plugin-react here — for the
// few jsdom unit tests we run, vitest's esbuild handles JSX directly.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
});
//# sourceMappingURL=vitest.config.js.map
