import { configs } from '@eslint/js';

export default [
	configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 'latest',
		},
		rules: {
			'no-unused-vars': 'warn',
			'no-console': 'off',
			'no-undef': 'error',
			'no-redeclare': 'error',
			'prefer-const': 'error',
			'prefer-arrow-callback': 'error',
			'arrow-body-style': ['error', 'as-needed'],
			'arrow-parens': ['error', 'as-needed'],
			'no-var': 'error',
			'prefer-template': 'error',
			'template-curly-spacing': ['error', 'never'],
			'object-shorthand': ['error', 'always'],
			'sort-imports': ['error', { ignoreCase: true }],
		},
	},
];
