module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended'
    ],
    'overrides': [
        {
            'env': {
                'node': true
            },
            'files': [
                '.eslintrc.{js,cjs}'
            ],
            'parserOptions': {
                'sourceType': 'script'
            }
        }
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module',
        'project': './tsconfig.json'
    },
    'plugins': [
        '@typescript-eslint',
        'react'
    ],
    'rules': {
        '@typescript-eslint/no-floating-promises': ['error'],
	'require-await' : 'off',
	'typescript-eslint/no-explicit-any': 'off',
        'indent': [
            'error',
            2,
            { "SwitchCase": 1 }
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        "@typescript-eslint/quotes": [
          "warn",
          "single",
          {
            "avoidEscape": true,
            "allowTemplateLiterals": true
          }
        ],
        'semi': [
            'error',
            'never'
        ]
    }
}
