import { OverviewReport } from '@/components/overview-report';
import type { Period } from '@/lib/period';

type SP = Promise<{ since?: string; until?: string }>;

export default function OverviewPage({ searchParams }: { searchParams: SP }) {
  return <OverviewReport searchParams={searchParams} />;
}

export type { Period };
