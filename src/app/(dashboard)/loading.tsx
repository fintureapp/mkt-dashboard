import { Skeleton } from '@/components/ui/skeleton';

const HERO_KEYS = ['hero-1', 'hero-2', 'hero-3'];
const SECONDARY_KEYS = [
  'sec-1',
  'sec-2',
  'sec-3',
  'sec-4',
  'sec-5',
  'sec-6',
  'sec-7',
  'sec-8',
  'sec-9',
];

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56 sm:h-10" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-col gap-4">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HERO_KEYS.map((k) => (
            <Skeleton key={k} className="h-[8.5rem] rounded-lg" />
          ))}
        </section>
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {SECONDARY_KEYS.map((k) => (
            <Skeleton key={k} className="h-28 rounded-lg" />
          ))}
        </section>
      </div>
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
