import { LevelPage, type SP } from '@/app/(dashboard)/_lib/level-page';

export default async function AdsPage({ searchParams }: { searchParams: SP }) {
  return (
    <LevelPage
      searchParams={searchParams}
      spec={{
        level: 'ad',
        title: 'Anúncios',
        subtitle: 'Performance por criativo',
        idOf: (r) => r.ad_id ?? '',
        nameOf: (r) => `${r.ad_name ?? '—'} · ${r.adset_name ?? ''}`,
      }}
    />
  );
}
