module.exports = {
	env: {
		browser: true,
		node: true,
		es2018: true,
	},
	parser: '@typescript-eslint/parser',
	extends: [
		'mdcs',
		'plugin:compat/recommended',
		'eslint:recommended',
	],
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	rules: {
		'semi': [
			'error',
			'always'
		],
		'quotes': [
			'error',
			'single'
		],
		'compat/compat': [
			'warn',
		],
		'prefer-const': [
			'error',
			{
				'destructuring': 'any',
				'ignoreReadBeforeAssign': false
			}
		],
		'no-unused-vars': [
			'error',
			{
				'varsIgnorePattern': '^_',
				'argsIgnorePattern': '^_'
			}
		],
		'no-useless-escape': [
			'off',
		],
		'no-throw-literal': [
			'error'
		],
		'no-irregular-whitespace': [
			'error'
		],
		'no-duplicate-imports': [
			'error'
		],
	},
	overrides: [
		{
			files: [ '*.ts' ],
			extends: [ 'plugin:@typescript-eslint/recommended' ],
			parser: '@typescript-eslint/parser',
			plugins: [ '@typescript-eslint' ],
			rules: {
				'@typescript-eslint/no-unused-vars': [
					'error',
					{
						'varsIgnorePattern': '^_',
						'argsIgnorePattern': '^_'
					}
				],
				'@typescript-eslint/no-explicit-any': [
					'off'
				],
			}
		},
		{
			files: [ '*.html' ],
			plugins: [ 'html' ],
		},
	]
};
