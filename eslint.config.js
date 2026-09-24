const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooks = require('eslint-plugin-react-hooks');

const TEXT_RULE = { name: 'react-native', importNames: ['Text'], message: 'Import Text from src/ui/Text (RTL-safe).' };

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.claude/**',
      'coverage/**',
      'eslint.config.js',
      'babel.config.js',
      'jest.setup.js',
      '**/__mocks__/**',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // Errors: things that are always bugs
      'react-hooks/rules-of-hooks': 'error',
      'no-undef': 'off', // TypeScript handles this
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      // Off: too noisy / handled by TypeScript already
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-unused-vars': 'off',
      // Focused or skipped tests never ship (handoff §22).
      'no-restricted-properties': ['error',
        { object: 'it', property: 'only', message: 'No focused tests.' },
        { object: 'describe', property: 'only', message: 'No focused tests.' },
        { object: 'it', property: 'skip', message: 'No skipped tests.' },
        { object: 'describe', property: 'skip', message: 'No skipped tests.' },
        { object: 'test', property: 'only', message: 'No focused tests.' },
        { object: 'test', property: 'skip', message: 'No skipped tests.' }],
      'no-console': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    // Domain and storage are typed end to end (handoff §31).
    files: ['src/domain/**/*.ts', 'src/storage/**/*.ts', 'src/state/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  {
    // All text goes through src/ui/Text (RTL paragraph direction in Arabic).
    files: ['src/**/*.tsx'],
    ignores: ['src/ui/Text.tsx', '**/__tests__/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: [TEXT_RULE] }],
    },
  },
  {
    // Screens and UI never touch storage directly; the store owns persistence (handoff §31).
    files: ['src/modules/**/screens/**/*.tsx', 'src/modules/**/*Screen*.tsx', 'src/ui/**/*.tsx', 'src/modules/home/**/*.tsx'],
    ignores: ['src/ui/Text.tsx'],
    rules: {
      'no-restricted-imports': ['error', { paths: [TEXT_RULE, { name: '@react-native-async-storage/async-storage', message: 'Use the store / actions, never AsyncStorage in screens.' }] }],
    },
  },
];
