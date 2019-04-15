module.exports = {
  'env': {
    'es6': true,
    'node': true
  },
  'globals': {
    'Node': true
  },
  'plugins': ['node'],
  'extends': ['airbnb-base', 'plugin:node/recommended', 'plugin:prettier/recommended'],
  'rules': {
    'max-len': [2, { 'code': 100, 'tabWidth': 2 }],
    'no-mixed-operators': 0,
    'no-bitwise': 0,
    'vars-on-top': 0,
    'no-unused-vars': ['error', { 'argsIgnorePattern': 'next' }],
    'no-plusplus': 0,
    'space-before-function-paren': 0,
    'prefer-destructuring': 0,
    'class-methods-use-this': 0,
    'no-use-before-define': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'func-names': 0,
    'prefer-template': 0,
    'consistent-return': 0,
    'object-shorthand': 0,
    'no-await-in-loop': 0,
    'no-continue': 0,
    'arrow-parens': ['error', 'as-needed'],
  }
};
