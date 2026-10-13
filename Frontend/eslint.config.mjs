import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      '.next-browser/**',
      '.next-e2e/**',
      'node_modules/**',
      '.npm-cache/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      hooks.configs.flat.recommended,
      prettier,
    ],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
);
