import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: path.dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ['.next/**', 'node_modules/**', 'scripts/generators/**', 'data/**'] },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // The app has no <img> tags; this keeps the rule from firing on future ones
      // without silently allowing unoptimised images.
      '@next/next/no-img-element': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
];
