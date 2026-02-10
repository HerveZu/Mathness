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
import { lexer } from '@/parser/lexer.ts';
import { mathnessParse } from '@/parser/parser.ts';
import { MathInput } from '@/routes/-math-input.tsx';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

const targetResult = mathnessParse(lexer('x^2+4'));
const TARGET_LENGTH = 5;

function RouteComponent() {
  const [lexerResult, setLexerResult] = useState<LexerResult>();

  const data = useMemo(() => {
    if (!targetResult.valid) return [];

    const guessFn =
      lexerResult?.tokens.length === TARGET_LENGTH && lexerResult?.complete
        ? mathnessParse(lexerResult)
        : null;

    return generateSamples(
      (x) => targetResult.ast.evaluate(x),
      guessFn?.valid ? (x) => guessFn.ast.evaluate(x) : undefined,
    );
  }, [lexerResult]);

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
                strokeDasharray="5 5"
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
          lexerResult={lexerResult}
          onLexerResult={setLexerResult}
        />
      </div>
    </div>
  );
}

const generateSamples = (
  targetFn: (x: number) => number,
  guessFn?: (x: number) => number,
  min = -50,
  max = 50,
  step = 1,
) => {
  const samples = [];
  for (let x = min; x <= max; x += step) {
    const xVal = parseFloat(x.toFixed(2));
    samples.push({
      x: xVal,
      target: targetFn(xVal),
      guess: guessFn?.(xVal),
    });
  }
  return samples;
};
