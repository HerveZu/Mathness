import { createFileRoute } from '@tanstack/react-router';
import type { LexerResult } from 'leac';
import { useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type ASTNode, VariableNode } from '@/parser/ast.ts';
import { lexer } from '@/parser/lexer.ts';
import { mathnessParse } from '@/parser/parser.ts';
import { MathInput, type PartialHint } from '@/routes/-math-input.tsx';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

const targetResult = mathnessParse(lexer('log(x) - x'));
// biome-ignore lint/style/noNonNullAssertion: Manual tests
const targetAst = targetResult.valid ? targetResult.ast : null!;

const TARGET_LENGTH = 8;
const samples = samplePoints(-50, 50, 1_000);

function RouteComponent() {
  const [lexerResult, setLexerResult] = useState<LexerResult>();

  const guessAst = useMemo(() => {
    const guessResult =
      lexerResult?.tokens.length === TARGET_LENGTH && lexerResult?.complete
        ? mathnessParse(lexerResult)
        : null;

    return guessResult?.valid ? guessResult.ast : null;
  }, [lexerResult]);

  const hints = useMemo(() => {
    if (guessAst && samples.every((x) => isMatch(guessAst, targetAst, x))) {
      return 'full-match';
    }
    const targetSubExpressions = getAllSubExprs(targetAst);

    function exprHints(guessSubExpr: ASTNode): PartialHint[] {
      return targetSubExpressions.flatMap((targetSubExpr) => {
        const match = samples.every((x) => {
          // otherwise, we'll get false positives when the current x sample happens to match a subexpression
          if (
            guessSubExpr instanceof VariableNode ||
            targetSubExpr instanceof VariableNode
          ) {
            return false;
          }
          return isMatch(guessSubExpr, targetSubExpr, x);
        });
        const compareResult = guessSubExpr.compare(targetSubExpr);

        return compareResult.similar
          ? [{ ...compareResult, match, guessSubExpr, targetSubExpr }]
          : [];
      });
    }

    return guessAst ? getAllSubExprs(guessAst).flatMap(exprHints) : null;
  }, [guessAst]);

  const data = useMemo(() => {
    if (!targetResult.valid) return [];

    return samples.map((x) => ({
      x,
      guess: guessAst?.evaluate(x),
      target: targetResult.ast.evaluate(x),
    }));
  }, [guessAst]);

  hints && console.log('hints', hints);

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-background p-4">
      <div className="w-full max-w-4xl flex flex-col gap-20 items-center">
        <div style={{ width: '100%', aspectRatio: 1.618 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="x" type="number" domain={[-50, 50]} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="guess"
                stroke="#8884d8"
                dot={false}
                strokeWidth={5}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#82ca9d"
                dot={false}
                strokeWidth={5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <MathInput
          length={TARGET_LENGTH}
          error={
            !!lexerResult &&
            lexerResult.tokens.length === TARGET_LENGTH &&
            !mathnessParse(lexerResult).valid
          }
          hints={hints}
          lexerResult={lexerResult}
          onLexerResult={setLexerResult}
        />
      </div>
    </div>
  );
}

function isMatch(a: ASTNode, b: ASTNode, x: number): boolean {
  const aValue = a.evaluate(x);
  const bValue = b.evaluate(x);

  // when both functions return NaN, they are considered equal as the sample points might reach out of their domain
  if (Number.isNaN(aValue) && Number.isNaN(bValue)) return true;
  return Math.abs(aValue - bValue) < 10e-5;
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
