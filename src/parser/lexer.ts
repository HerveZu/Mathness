import { createLexer } from 'leac';

export const lexer = createLexer([
  { name: 'ws', regex: /\s+/, discard: true },

  { name: 'function', regex: /log|sin|cos|tan|sqrt/ },
  { name: 'variable', str: 'x' },

  { name: 'number', regex: /[0-9]+(\.[0-9]+)?/ },

  { name: 'plus', str: '+' },
  { name: 'minus', str: '-' },
  { name: 'times', str: '*' },
  { name: 'div', str: '/' },
  { name: 'caret', str: '^' },

  { name: 'lparen', str: '(' },
  { name: 'rparen', str: ')' },
]);
