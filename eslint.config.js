import js from '@eslint/js'
import globals from 'globals'
import prettierConfig from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'

const sourceFiles = [
  'src/**/*.{js,vue}',
  'tests/**/*.js',
  'e2e/**/*.js',
  'scripts/**/*.mjs',
  'vite.config.js',
  'playwright.config.js',
  'eslint.config.js',
  'prettier.config.js',
]

export default [
  {
    ignores: [
      '.agents/**',
      '.codex/**',
      '.roo/**',
      '.vercel/**',
      '.wrangler/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'CONTEXT.md',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,
  {
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'vue/html-indent': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/require-default-prop': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
]
