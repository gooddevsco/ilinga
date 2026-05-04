import config from './packages/eslint-config/index.js';

export default [
  ...config,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.d.ts',
      // Design reference snapshots — JSX-shaped but never compiled or
      // linted; they're docs that target the in-browser global React build.
      'docs/designs/**',
    ],
  },
];
