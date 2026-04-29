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
    ],
  },
];
