module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  plugins: ['prettier', '@typescript-eslint'],
  rules: {
    'prettier/prettier': 'error',
    'react-native/no-inline-styles': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': 'warn',
    'react-native/no-color-literals': 'off',
    'react-native/split-platform-components': 'off',
    'no-unused-vars': 'off', // Use TypeScript version instead
  },
  settings: {
    'import/resolver': {
      'babel-module': {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
          '@': './src',
        },
      },
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
};
