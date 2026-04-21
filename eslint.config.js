import js from '@eslint/js'
import neostandard from 'neostandard'
import jsdoc from 'eslint-plugin-jsdoc'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['node_modules']),
  ...neostandard(),
  {
    files: ['**/*.js'],
    extends: [
      js.configs.recommended,
      jsdoc.configs['flat/recommended-typescript-flavor'],
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    },
  },
])
