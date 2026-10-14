import js from '@eslint/js';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly'
};

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.min.js']
  },
  js.configs.recommended,
  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: browserGlobals
    }
  },
  {
    files: ['tests/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  }
];
