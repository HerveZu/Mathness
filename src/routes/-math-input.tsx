import type { LexerResult } from 'leac';
import { useState } from 'react';
import { cn } from '@/lib/utils.ts';
import type { SimilarCompareResult } from '@/parser/ast.ts';
import { lexer } from '@/parser/lexer.ts';

export type Hints = (SimilarCompareResult & { match: boolean })[];

type MathInputProps = {
  length: number;
  error: boolean;
  hints: Hints | null;
  lexerResult: LexerResult | undefined;
  onLexerResult: (result: LexerResult) => void;
};

export function MathInput({
  length,
  lexerResult,
  onLexerResult,
  error,
  hints,
}: MathInputProps) {
  const [expression, setExpression] = useState('');

  function handleExpressionChange(value: string) {
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
    if (!lexerResult) return;
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
        className={'opacity-0 absolute left-0 top-0 right-0 bottom-0 z-10'}
        value={expression}
        onChange={(e) => {
          handleExpressionChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault();
            handleBackspace();
          }
        }}
      />
      {Array.from({ length: length }).map((_, i) => {
        const token = lexerResult?.tokens[i];
        const relevantHints = hints?.filter(
          (hint) => hint.start <= i && hint.end >= i + 1,
        );

        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: The position is stable
            key={i}
            className={cn(
              'h-24 w-18 border-2 rounded-xl hover:ring-2 hover:ring-accent',
              'flex items-center justify-center',
              error && lexerResult?.tokens.length && 'border-red-500',
              relevantHints?.length && 'border-yellow-500',
              relevantHints?.some((hint) => hint.match) && 'border-green-500',
            )}
          >
            <p className={'font-semibold text-3xl'}>{token?.text ?? ''}</p>
          </span>
        );
      })}
    </span>
  );
}
