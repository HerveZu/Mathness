import type { LexerResult } from 'leac';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MathInput, type PartialHint } from '@/components/math-input.tsx';
import { type ASTNode, VariableNode } from '@/parser/ast.ts';
import { generateFunction } from '@/parser/function-generator.ts';
import { lexer } from '@/parser/lexer.ts';
import { mathnessParse } from '@/parser/parser.ts';

interface GameProps {
  minTokens: number;
  maxTokens: number;
  guessCount: number;
  sampleRangeMin: number;
  sampleRangeMax: number;
  sampleCount: number;
  matchThreshold: number;
}

type Guess = { id: number; lexerResult: LexerResult | null };
const generateGuess = (count: number) =>
  Array(count)
    .fill(0)
    .map((_) => ({ id: Math.random(), lexerResult: null }));

export function Game({
  minTokens,
  maxTokens,
  guessCount,
  sampleRangeMin,
  sampleRangeMax,
  sampleCount,
  matchThreshold,
}: GameProps) {
  const [guesses, setGuesses] = useState<Guess[]>(generateGuess(guessCount));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);

  const samples = useMemo(() => {
    return samplePoints(sampleRangeMin, sampleRangeMax, sampleCount);
  }, [sampleRangeMin, sampleRangeMax, sampleCount]);

  const [targetFn, setTargetFn] = useState(() => {
    const randomFn = generateFunction({
      minToken: minTokens,
      maxToken: maxTokens,
    });
    const targetLexerResult = lexer(randomFn);
    const targetResult = mathnessParse(targetLexerResult);
    if (!targetResult.valid) throw new Error('Invalid target function');
    return { lexerResult: targetLexerResult, ast: targetResult.ast };
  });

  const resetGame = () => {
    const randomFn = generateFunction({
      minToken: minTokens,
      maxToken: maxTokens,
    });
    console.log(randomFn);
    const targetLexerResult = lexer(randomFn);
    const targetResult = mathnessParse(targetLexerResult);
    if (!targetResult.valid) throw new Error('Invalid target function');
    setTargetFn({ lexerResult: targetLexerResult, ast: targetResult.ast });
    setGuesses(generateGuess(guessCount));
    setCurrentGuessIndex(0);
  };

  const targetAst = targetFn.ast;
  const inputLength = targetFn.lexerResult.tokens.length;

  const guessAsts = useMemo(() => {
    return guesses.map(({ lexerResult }) => {
      const guessResult =
        lexerResult?.tokens.length === inputLength && lexerResult?.complete
          ? mathnessParse(lexerResult)
          : null;

      return guessResult?.valid ? guessResult.ast : null;
    });
  }, [guesses, inputLength]);

  const allHints = useMemo(() => {
    return guessAsts.map((guessAst) => {
      if (!guessAst) return null;
      if (
        samples.every((x) => isMatch(guessAst, targetAst, x, matchThreshold))
      ) {
        return 'full-match';
      }
      const targetSubExpressions = getAllSubExprs(targetAst);

      function exprHints(guessSubExpr: ASTNode): PartialHint[] {
        return targetSubExpressions.flatMap((targetSubExpr) => {
          const match = samples.every((x) => {
            if (
              guessSubExpr instanceof VariableNode ||
              targetSubExpr instanceof VariableNode
            ) {
              return false;
            }
            return isMatch(guessSubExpr, targetSubExpr, x, matchThreshold);
          });
          const similar = guessSubExpr.compare(targetSubExpr);
          const boundary = match
            ? guessSubExpr.boundaries.match
            : guessSubExpr.boundaries.similar;
          return similar ? [{ ...boundary, match }] : [];
        });
      }

      return getAllSubExprs(guessAst).flatMap(exprHints);
    });
  }, [guessAsts, targetAst, samples, matchThreshold]);

  const lastGuess = useMemo(
    () => guessAsts.filter(Boolean).at(-1),
    [guessAsts],
  );

  const data = useMemo(() => {
    return samples.map((x) => {
      const targetVal = targetAst.evaluate(x);
      const val = lastGuess?.evaluate(x);
      return {
        x,
        target: Number.isFinite(targetVal) ? targetVal : undefined,
        guess: Number.isFinite(val) ? val : undefined,
      };
    });
  }, [lastGuess, targetAst, samples]);

  const handleGuess = (index: number, result: LexerResult) => {
    const newGuesses = [...guesses];
    newGuesses[index].lexerResult = result;
    setGuesses(newGuesses);

    if (result.tokens.length === inputLength && result.complete) {
      const parseResult = mathnessParse(result);
      if (parseResult.valid) {
        const isFullMatch = samples.every((x) =>
          isMatch(parseResult.ast, targetAst, x, matchThreshold),
        );
        if (!isFullMatch && index < guessCount - 1) {
          setCurrentGuessIndex(index + 1);
        }
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-background overflow-hidden">
      <div className="grow shrink-0 max-w-fit flex flex-col items-center justify-start p-8 gap-4 overflow-y-auto border-b md:border-b-0 md:border-r">
        <div className="flex justify-between w-full items-center mb-4">
          <h1 className="text-4xl font-bold">Mathness</h1>
          <button
            type={'button'}
            onClick={resetGame}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Reset
          </button>
        </div>
        <div className="flex flex-col w-full gap-6 overflow-x-auto pb-4">
          {guesses.map(({ id, lexerResult }, i) => (
            <MathInput
              key={id}
              length={inputLength}
              error={
                !!lexerResult &&
                lexerResult.tokens.length === inputLength &&
                !mathnessParse(lexerResult).valid
              }
              hints={allHints[i]}
              lexerResult={lexerResult}
              onLexerResult={(result) => handleGuess(i, result)}
              disabled={i !== currentGuessIndex}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 justify-center grow flex flex-col items-center p-8 bg-muted/30">
        <ResponsiveContainer className={'w-full h-full'}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={true}
              horizontal={true}
            />
            <XAxis dataKey={'x'} />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#82ca9d"
              dot={false}
              strokeWidth={2}
              animationDuration={300}
            />
            <Line
              type="monotone"
              dataKey="guess"
              dot={false}
              stroke="#8884d8"
              strokeWidth={4}
              animationDuration={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function isMatch(
  a: ASTNode,
  b: ASTNode,
  x: number,
  threshold: number,
): boolean {
  const aValue = a.evaluate(x);
  const bValue = b.evaluate(x);
  if (Number.isNaN(aValue) && Number.isNaN(bValue)) return true;
  return Math.abs(aValue - bValue) < threshold;
}

function getAllSubExprs(ast: ASTNode): ASTNode[] {
  return [ast, ...ast.subExpressions.flatMap(getAllSubExprs)];
}

function samplePoints(a: number, b: number, count: number) {
  return Array.from(
    { length: count },
    (_, i) => a + ((b - a) * i) / (count - 1),
  );
}
