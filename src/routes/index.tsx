import { createFileRoute } from '@tanstack/react-router';
import type { LexerResult } from 'leac';
import { useState } from 'react';
import { mathnessParse } from '@/parser/parser.ts';
import { MathInput } from '@/routes/-math-input.tsx';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [lexerResult, setLexerResult] = useState<LexerResult>();

  return (
    <div
      className={'h-screen w-screen flex flex-1 justify-center items-center'}
    >
      <MathInput
        length={10}
        isValid={!!lexerResult && mathnessParse(lexerResult).valid}
        lexerResult={lexerResult}
        onLexerResult={setLexerResult}
      />
    </div>
  );
}
