import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { lexer } from '@/parser/lexer.ts';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [expression, setExpression] = useState('');

  useEffect(() => {
    console.log(lexer(expression));
  }, [expression]);

  return (
    <input
      placeholder={'Math here'}
      value={expression}
      onChange={(e) => setExpression(e.target.value)}
    />
  );
}
