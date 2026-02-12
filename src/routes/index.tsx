import { createFileRoute } from '@tanstack/react-router';
import { Game } from '@/components/game.tsx';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Game
      guessCount={6}
      sampleRangeMin={-50}
      sampleRangeMax={50}
      sampleCount={1000}
      matchThreshold={10e-4}
      maxTokens={8}
      minTokens={6}
    />
  );
}
