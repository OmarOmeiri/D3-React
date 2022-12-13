module.exports = {
  'env': {
    'commonjs': true,
    'es2021': true,
    'node': true,
    'es6': true,
    'browser': true,
  },
  'extends': [
    'plugin:react-hooks/recommended',
    'airbnb-base',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
    'plugin:import/recommended',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaFeatures': { 'jsx': true },
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'plugins': [
    'react',
    '@typescript-eslint',
  ],
  'rules': {
    // General
    'no-console': [
      'warn', {
        allow: [
          'warn',
          'error',
          'info',
          'table',
          'debug',
        ],
      },
    ],
    camelcase: [
      'warn',
      {
        properties: 'always',
        ignoreDestructuring: true,
        ignoreImports: true,
        ignoreGlobals: true,
        allow: [
          '^[A-Z]',
          '^(r_)',
          '^(R_)',
          '^(cp_)',
          '^(CP_)',
          'required_error',
          'invalid_type_error',
        ],
      },
    ],
    'linebreak-style': 0,
    'max-len': 0,
    'object-curly-spacing': 2,
    'no-plusplus': [
      'error', { allowForLoopAfterthoughts: true },
    ],
    'no-continue': 'off',
    'no-empty': 'off',
    'no-multiple-empty-lines': ['error', {
      max: 1,
      maxEOF: 1,
      maxBOF: 0,
    }],
    'object-curly-newline': ['error', {
      // 'ObjectExpression': {
      //   'multiline': true,
      //   'minProperties': 10,
      // },
      // 'ObjectPattern': {
      //   'multiline': true,
      //   'minProperties': 10,
      // },
      'ImportDeclaration': {
        'multiline': true,
        'minProperties': 2,
      },
      'ExportDeclaration': {
        'multiline': true,
        'minProperties': 2,
      },
    }],
    // 'object-property-newline': ['error', { 'allowMultiplePropertiesPerLine': false }],
    // Variables
    'one-var': 'error',
    'no-unused-vars': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-shadow': 'off',
    // Functions
    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: false,
        MethodDefinition: false,
        ClassDeclaration: false,
        ArrowFunctionExpression: false,
        FunctionExpression: false,
      },
    }],
    'prefer-arrow-callback': 'off',
    'no-param-reassign': [2, { props: false }],
    'consistent-return': 'off',
    'func-names': 'off',
    // Classes
    'no-useless-constructor': 'off',
    'class-methods-use-this': 'off',
    'lines-between-class-members': 'off',
    // Imports
    'import/no-named-default': 'off',
    'import/no-cycle': 'error',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': [
      2, { ignore: ['^@'] },
    ],
    'import/no-extraneous-dependencies': [
      'error', {
        devDependencies: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/test/**/*.ts',
          '**/tests/**/*.ts',
        ],
      },
    ],
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'axios',
          importNames: ['default'],
          message: 'Please use the `Api` class instead.',
        },
        {
          name: 'lullo-utils',
          importNames: ['syncDelay'],
          message: 'Not meant to be used in production.',
        },
        {
          name: 'lodash',
          importNames: ['range'],
          message: 'Please use the `range` function from lullo-utils.',
        },
        {
          name: 'zustand/shallow',
          message: 'Please use the `shallow` function from the frameworks directory.',
        },
      ],
    }],
    'import/extensions': 'off',
    // TS - General

    '@typescript-eslint/indent': ['off', 2],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    // TS - Types
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/prefer-namespace-keyword': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/ban-types': [
      'warn',
      {
        types: {
          '{}': {
            message: 'Use object instead',
            fixWith: 'object',
          },
        },
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    // TS - Variables
    '@typescript-eslint/no-shadow': ['off'],
    '@typescript-eslint/no-use-before-define': ['off'],
    '@typescript-eslint/no-unused-vars': [
      'warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    // TS -Functions
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    // REACT
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-no-bind': [2,
      {
        ignoreDOMComponents: false,
        ignoreRefs: true,
        allowArrowFunctions: true,
        allowFunctions: true,
        allowBind: false,
      },
    ],
    'react/no-unknown-property': ['warn', { ignore: ['jsx', 'global'] }],
    'jsx-a11y/anchor-is-valid': [
      'warn',
      {
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
        aspects: ['invalidHref', 'preferButton'],
      },
    ],
    'jsx-a11y/label-has-associated-control': [2, {
      labelAttributes: ['label'],
      controlComponents: ['DelayInput', 'SelectWrapper'],
      depth: 3,
    }],
    'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.ts', '.js', '.jsx'] }],
    'react/jsx-props-no-spreading': 'off',
    'react/prop-types': 'off',
    'react/no-unused-prop-types': 'warn',
    'quote-props': 'off',
    'react/no-array-index-key': 'off',
    'react/button-has-type': 'off',
    'react/require-default-props': 'off',
    'react/jsx-indent': [2, 2, {
      checkAttributes: true,
      indentLogicalExpressions: true,
    }],
  },
  overrides: [
    {
      excludedFiles: [],
      files: [
        '**/*.test.ts',
        'tests/**/*.ts',
      ],
      rules: {
        'require-jsdoc': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
  ],
  'settings': {
    'import/core-modules': ['css'],
    'import/resolver': {
      'node': { 'extensions': ['.js', '.jsx', '.ts', '.tsx'] },
      'typescript': {
        // "alwaysTryTypes": true,
        // "paths": "./tsconfig.paths.json"
      },
    },
  },
};
