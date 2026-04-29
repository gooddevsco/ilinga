import globals from 'globals';
import base from './index.js';

// React-specific rules (eslint-plugin-react + react-hooks) are intentionally
// not bundled while we wait for the eslint-plugin-react fork that supports
// eslint v9's flat-config + new context API. The custom no-empty-handlers
// rule from base config still applies and is the rule we actually need.
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx,jsx,js}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
