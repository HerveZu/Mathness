import { lexer } from './lexer';

const OPERATORS = ['+', '-', '*', '/', '^'] as const;
const FUNCTIONS = ['sin', 'cos', 'tan', 'sqrt', 'abs', 'log'] as const;
const CONSTANTS = ['pi', 'e'] as const;

const MAX_GENERATION_ATTEMPTS = 50;
const FALLBACK_TOKEN_COUNT = 1000;
const TERMINAL_X_PROBABILITY = 0.4;
const TERMINAL_CONSTANT_PROBABILITY = 0.6;
const BINARY_OP_PROBABILITY = 0.5;
const FUNCTION_PROBABILITY = 0.8;
const MIN_NUMBER = -10;
const MAX_NUMBER = 10;
const MIN_DEPTH = 2;
const MAX_DEPTH = 5;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function countTokens(expr: string): number {
  try {
    return lexer(expr).tokens.length;
  } catch {
    return FALLBACK_TOKEN_COUNT; // Should not happen with valid generated code
  }
}

function generateNode(
  maxDepth: number,
  targetTokens: number,
  hasX: boolean,
): string {
  // Base case: if depth is 0 or we're close to target tokens, return a terminal
  if (maxDepth === 0 || targetTokens <= 1) {
    const r = Math.random();
    if (!hasX && r < TERMINAL_X_PROBABILITY) {
      return 'x';
    }
    if (r < TERMINAL_X_PROBABILITY) return 'x';
    if (r < TERMINAL_CONSTANT_PROBABILITY) return randomChoice(CONSTANTS);
    return randomInt(MIN_NUMBER, MAX_NUMBER).toString();
  }

  const choice = Math.random();

  // binary operation
  if (choice < BINARY_OP_PROBABILITY && targetTokens > 2) {
    const operator = randomChoice(OPERATORS);
    const leftTokens = Math.max(
      1,
      Math.floor(targetTokens / 2) + randomInt(-1, 1),
    );
    const rightTokens = Math.max(1, targetTokens - leftTokens - 1);

    const left = generateNode(maxDepth - 1, leftTokens, hasX);
    const leftHasX = left.includes('x');
    const right = generateNode(maxDepth - 1, rightTokens, hasX || leftHasX);

    // Add parentheses for proper precedence
    const leftNeedsParen =
      (operator === '*' || operator === '/' || operator === '^') &&
      (left.includes('+') || left.includes('-'));
    const rightNeedsParen =
      (operator === '*' ||
        operator === '/' ||
        operator === '-' ||
        operator === '^') &&
      (right.includes('+') || right.includes('-'));

    const leftExpr = leftNeedsParen ? `(${left})` : left;
    const rightExpr = rightNeedsParen ? `(${right})` : right;

    return `${leftExpr} ${operator} ${rightExpr}`;
  }

  // function
  if (choice < FUNCTION_PROBABILITY && targetTokens > 3) {
    const func = randomChoice(FUNCTIONS);
    const arg = generateNode(maxDepth - 1, targetTokens - 3, hasX);
    return `${func}(${arg})`;
  }

  // Terminal fallback
  const r = Math.random();
  if (!hasX && r < TERMINAL_X_PROBABILITY) {
    return 'x';
  }
  if (r < TERMINAL_X_PROBABILITY) return 'x';
  if (r < TERMINAL_CONSTANT_PROBABILITY) return randomChoice(CONSTANTS);
  return randomInt(MIN_NUMBER, MAX_NUMBER).toString();
}

export function generateFunction({
  minToken,
  maxToken,
}: {
  minToken: number;
  maxToken: number;
}): string {
  let attempts = 0;
  while (attempts < MAX_GENERATION_ATTEMPTS) {
    const targetTokens = randomInt(minToken, maxToken);
    const maxDepth = randomInt(MIN_DEPTH, MAX_DEPTH);

    let expr = generateNode(maxDepth, targetTokens, false);

    // Ensure x is present at least once
    if (!expr.includes('x')) {
      // Replace a number or constant with x
      if (/-?\d+/.test(expr)) {
        expr = expr.replace(/-?\d+/, 'x');
      } else if (/pi|e/.test(expr)) {
        expr = expr.replace(/pi|e/, 'x');
      } else {
        // fallback
        expr = `x + (${expr})`;
      }
    }

    const tokens = countTokens(expr);
    if (tokens >= minToken && tokens <= maxToken) {
      return expr;
    }
    attempts++;
  }

  // Final fallback: just 'x' if we failed to find something in range,
  // though we should try to make it at least minToken if possible.
  return 'x';
}
