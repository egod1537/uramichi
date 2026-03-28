module.exports = {
  root: true,
  env: {
    browser: true,
    es2024: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist'],
  rules: {
    'react/prefer-es6-class': ['error', 'always'],
    '@typescript-eslint/no-explicit-any': 'error',
    'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    'import/no-internal-modules': [
      'error',
      {
        allow: ['**/services/*', '**/models/*', '**/shared/**'],
      },
    ],
  },
};
