import { createFileRoute } from '@tanstack/react-router';
import { MathInput } from '@/routes/-math-input.tsx';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div
      className={'h-screen w-screen flex flex-1 justify-center items-center'}
    >
      <MathInput length={10} />
    </div>
  );
}
