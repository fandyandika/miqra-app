module.exports = {
  env: { es2021: true, node: true },
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'prettier/prettier': [
      'error',
      { endOfLine: 'lf', singleQuote: true, semi: true, trailingComma: 'es5' },
    ],
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['scripts/**/*', 'src/types/supabase.ts'],
};
