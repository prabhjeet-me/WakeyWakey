// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/adjacent-overload-signatures': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'lib',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'lib',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            // =========================================
            // Static Fields (readonly first)
            // =========================================
            'public-static-readonly-field',
            'protected-static-readonly-field',
            'private-static-readonly-field',

            'public-static-field',
            'protected-static-field',
            'private-static-field',

            // =========================================
            // Decorated Fields (Angular)
            // =========================================
            'public-decorated-readonly-field',
            'protected-decorated-readonly-field',
            'private-decorated-readonly-field',

            'public-decorated-field',
            'protected-decorated-field',
            'private-decorated-field',

            // =========================================
            // Instance Fields (readonly first)
            // =========================================
            'public-instance-readonly-field',
            'protected-instance-readonly-field',
            'private-instance-readonly-field',

            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',

            // =========================================
            // Constructor
            // =========================================
            'public-constructor',
            'protected-constructor',
            'private-constructor',

            // =========================================
            // Accessors (getters before setters)
            // =========================================
            'public-get',
            'protected-get',
            'private-get',

            'public-set',
            'protected-set',
            'private-set',

            // =========================================
            // Static Methods
            // =========================================
            'public-static-method',
            'protected-static-method',
            'private-static-method',

            // =========================================
            // Instance Methods
            // =========================================
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
