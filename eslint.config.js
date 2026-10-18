import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['src/assets/', 'coverage/', 'build/', 'vendor/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['frontend/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['tests/js/**/*.ts', '*.config.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  prettier
);
