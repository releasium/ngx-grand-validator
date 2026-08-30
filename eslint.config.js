// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    // dist is generated build output (gitignored), not source - never lint it.
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'gv', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'gv', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
  {
    // `FormControlType` uses TypeScript's enum + namespace declaration merging
    // to attach `isArray`/`isGroup`/`isControl` helpers to the enum itself
    // (`FormControlType.isArray(...)`). That shape is part of the locked v2
    // public API (Task 13) and there is no ES2015-module equivalent that
    // preserves it without a breaking API change, so this rule is switched
    // off for this one file rather than restructuring the export.
    files: ['lib/src/schema/controls.enum.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
);
