import { createLexer } from 'leac';

export const lexer = createLexer([
  { name: 'ws', regex: /\s+/, discard: true },

  { name: 'function', regex: /log|sin|cos|tan|sqrt|abs/i },
  { name: 'variable', str: 'x' },

  { name: 'number', regex: /0|([1-9][0-9]?)/ }, // 0 or non-zero int (max 2 digits)

  { name: 'plus', str: '+' },
  { name: 'minus', str: '-' },
  { name: 'times', str: '*' },
  { name: 'div', str: '/' },
  { name: 'caret', str: '^' },

  { name: 'const', regex: /pi|e/i },

  { name: 'lparen', str: '(' },
  { name: 'rparen', str: ')' },
]);
