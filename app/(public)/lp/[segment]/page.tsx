import { SegmentedLandingClient } from './client';

export default function Page() {
  return <SegmentedLandingClient />;
}

export function generateStaticParams() {
  return [
    { segment: 'infoprodutor' },
    { segment: 'profissional-liberal' },
    { segment: 'empresas' },
  ];
}
