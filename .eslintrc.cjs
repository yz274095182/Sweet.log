module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
  ],
  globals: {
    uni: 'readonly',
    wx: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly',
    uniCloud: 'readonly',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-debugger': 'warn',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.uts'],
      parser: '@typescript-eslint/parser',
      extends: ['eslint:recommended'],
      rules: {
        'no-unused-vars': 'warn',
        'no-shadow': 'warn',
      },
    },
    {
      files: ['**/*.uvue'],
      parserOptions: {
        ecmaVersion: 2020,
      },
      rules: {
        'no-unused-vars': 'warn',
      },
    },
  ],
};
