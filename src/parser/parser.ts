import type { LexerResult, Token } from 'leac';
import {
  type ASTNode,
  BinaryNode,
  ConstNode,
  FunctionNode,
  NumberNode,
  type TokenWithPosition,
  Unary,
  VariableNode,
} from '@/parser/ast.ts';

interface ParserState {
  readonly tokens: readonly Token[];
  index: number;
}

export type ParserResult =
  | {
      valid: true;
      ast: ASTNode;
    }
  | {
      valid: false;
      error: string;
    };

export function mathnessParse(lexerResult: LexerResult): ParserResult {
  if (!lexerResult.complete) {
    return { valid: false, error: 'Lexer result is not complete' };
  }

  const state: ParserState = { tokens: lexerResult.tokens, index: 0 };

  const peek = () => state.tokens[state.index];

  const consume = (name?: string) => {
    const token = peek();
    if (!token) throw new Error('Unexpected end of input');
    if (name && token.name !== name) {
      throw new Error(
        `Expected ${name} but found ${token.name} at ${token.column}`,
      );
    }
    const tokenPosition = state.index;
    state.index++;
    return { ...token, position: tokenPosition } as TokenWithPosition;
  };

  const parsePrimary = (): ASTNode => {
    const token = peek();
    if (!token) throw new Error('Unexpected end of input');

    if (token.name === 'number') {
      return new NumberNode(consume());
    }
    if (token.name === 'variable') {
      return new VariableNode(consume());
    }
    if (token.name === 'const') {
      return new ConstNode(consume());
    }
    if (token.name === 'function') {
      const name = consume();
      consume('lparen');
      const argument = parseExpression();
      consume('rparen');
      return new FunctionNode(name, argument);
    }
    if (token.name === 'lparen') {
      consume('lparen');
      const node = parseExpression();
      consume('rparen');
      return node;
    }
    throw new Error(`Unexpected token: ${token.name}`);
  };

  const parseUnary = (): ASTNode => {
    const token = peek();
    if (token?.name === 'minus' || token?.name === 'plus') {
      const operator = consume();
      return new Unary(operator, parseUnary());
    }
    return parsePrimary();
  };

  const parseExponent = (): ASTNode => {
    let node = parseUnary();
    if (peek()?.name === 'caret') {
      const operator = consume();
      // Recurse on the right side for right-associativity (e.g. 2^3^4)
      node = new BinaryNode(operator, node, parseExponent());
    }
    return node;
  };

  const parseMultiplication = (): ASTNode => {
    let node = parseExponent();
    while (peek()?.name === 'times' || peek()?.name === 'div') {
      const operator = consume();
      node = new BinaryNode(operator, node, parseExponent());
    }
    return node;
  };

  const parseAdditive = (): ASTNode => {
    let node = parseMultiplication();
    while (peek()?.name === 'plus' || peek()?.name === 'minus') {
      const operator = consume();
      node = new BinaryNode(operator, node, parseMultiplication());
    }
    return node;
  };

  const parseExpression = (): ASTNode => parseAdditive();

  try {
    const result = parseExpression();

    if (state.index < state.tokens.length) {
      return { valid: false, error: 'Unexpected extra token' };
    }

    return { valid: true, ast: result };
  } catch (e) {
    return { valid: false, error: e?.toString() ?? 'Unknown error' };
  }
}
