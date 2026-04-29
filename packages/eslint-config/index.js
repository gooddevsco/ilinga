import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import noEmptyHandlersPlugin from './no-empty-handlers.js';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2023,
      },
    },
    plugins: {
      ilinga: noEmptyHandlersPlugin,
    },
    rules: {
      'ilinga/no-empty-handlers': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    ignores: ['**/dist/**', '**/build/**', '**/.turbo/**', '**/node_modules/**'],
  },
];
