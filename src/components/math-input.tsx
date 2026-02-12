import type { LexerResult } from 'leac';
import { useState } from 'react';
import { cn } from '@/lib/utils.ts';
import type { ASTBoundary } from '@/parser/ast.ts';
import { lexer } from '@/parser/lexer.ts';

export type PartialHint = ASTBoundary & { match: boolean };
export type Hints = PartialHint[] | 'full-match';

type MathInputProps = {
  length: number;
  error: boolean;
  hints: Hints | null;
  lexerResult: LexerResult | undefined | null;
  onLexerResult: (result: LexerResult) => void;
  disabled?: boolean;
};

export function MathInput({
  length,
  lexerResult,
  onLexerResult,
  error,
  hints,
  disabled,
}: MathInputProps) {
  const [expression, setExpression] = useState('');

  function handleExpressionChange(value: string) {
    if (disabled) return;
    const lexerResult = lexer(value);
    onLexerResult(lexerResult);

    if (lexerResult.complete) {
      setExpression(value);
      return;
    }

    let workingExpression = value;
    const validFirstPart = lexerResult.tokens
      .map((token) => token.text)
      .join('');

    if (
      validFirstPart.length > 0 &&
      workingExpression.startsWith(validFirstPart)
    )
      workingExpression = workingExpression.slice(validFirstPart.length);

    while (workingExpression.length > 0) {
      const partialLexerResult = lexer(workingExpression);

      if (partialLexerResult.tokens.length > 0) {
        const validExpression = validFirstPart + workingExpression;
        const composedResult = lexer(validExpression);
        onLexerResult(composedResult);
        setExpression(validExpression);
        return;
      }
      workingExpression = workingExpression.slice(1);
    }

    setExpression(value);
  }

  function handleBackspace() {
    if (disabled || !lexerResult) return;
    const tokens = [...lexerResult.tokens.slice(0, -1)];
    onLexerResult({
      ...lexerResult,
      tokens,
    });
    setExpression(tokens.map((token) => token.text).join(''));
  }

  return (
    <span className={'relative flex gap-3'}>
      <input
        className={cn(
          'opacity-0 absolute left-0 top-0 right-0 bottom-0 z-10',
          disabled && 'pointer-events-none',
        )}
        value={expression}
        readOnly={disabled}
        onChange={(e) => {
          handleExpressionChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Backspace') {
            e.preventDefault();
            handleBackspace();
          }
        }}
      />
      {Array.from({ length: length }).map((_, i) => {
        const token = lexerResult?.tokens[i];
        const relevantHints =
          hints !== 'full-match'
            ? hints?.filter((hint) => i >= hint.start && i < hint.end)
            : [];
        const fullMatch = hints === 'full-match';

        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: The position is stable as it corresponds to the fixed token index in the mathematical expression.
            key={i}
            className={cn(
              'h-24 w-18 border-2 rounded-xl transition-all flex-none',
              'flex items-center justify-center',
              !disabled && 'hover:ring-2 hover:ring-accent',
              disabled && 'opacity-40 bg-muted/20 border-muted',
              error && lexerResult?.tokens.length && 'border-red-500',
              relevantHints?.length && 'border-yellow-500',
              relevantHints?.some((hint) => hint.match) && 'border-green-500',
              fullMatch && 'border-green-500 bg-green-500/20',
            )}
          >
            <p className={'font-semibold text-3xl'}>{token?.text ?? ''}</p>
          </span>
        );
      })}
    </span>
  );
}
