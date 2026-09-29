import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      // This app fetches on mount ("load user/order on effect") throughout,
      // same pattern the template it's based on uses — the rule is aimed at
      // React Compiler / external-store setups, not applicable here.
      'react-hooks/set-state-in-effect': 'off',
      // Provider + its paired hook (usePlatform, useOrderDraft) intentionally
      // live in one file; that's a standard context pattern, not a bug.
      'react-refresh/only-export-components': 'off',
    },
  },
)
