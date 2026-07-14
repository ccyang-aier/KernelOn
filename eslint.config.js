import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/target/**',
      '**/.venv/**',
      '**/__pycache__/**',
      'packages/modules/src/apps/music/mineradio/source/**',
      'packages/modules/src/apps/music/mineradio/generated/**',
      'packages/modules/src/apps/music/mineradio/assets/vendor/**',
      '.agent-mesh/**',
      '.gemini/**',
      'open_source/**',
      'vibe_test/**',
      'tmp/**',
      'packages/ui/src/components/liquid-glass/**',
      'packages/ui/src/components/liquid-glass-studio/**',
      'packages/ui/src/components/liquid-glass-svg-filter/**',
      'packages/ui/src/components/liquidglass/**',
      '**/*.tsbuildinfo',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['scripts/**/*.{js,mjs,cjs}', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['apps/desktop/src-tauri/src/mineradio_overlay_bridge.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
);
