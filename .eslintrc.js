module.exports = {
	env: {
		browser: true,
		node: true,
		es2020: true,
	},
	parser: '@typescript-eslint/parser',
	extends: [
		'mdcs',
		'plugin:compat/recommended',
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	rules: {
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				'varsIgnorePattern': '^_',
				'argsIgnorePattern': '^_'
			}
		],
		'no-throw-literal': [
			'error'
		],
		'quotes': [
			'error',
			'single'
		],
		'prefer-const': [
			'error',
			{
				'destructuring': 'any',
				'ignoreReadBeforeAssign': false
			}
		],
		'no-irregular-whitespace': [
			'error'
		],
		'no-duplicate-imports': [
			'error'
		],
	},
};
