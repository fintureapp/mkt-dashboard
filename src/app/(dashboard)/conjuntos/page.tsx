import { LevelPage, type SP } from '@/app/(dashboard)/_lib/level-page';

export default async function AdsetsPage({ searchParams }: { searchParams: SP }) {
  return (
    <LevelPage
      searchParams={searchParams}
      spec={{
        level: 'adset',
        title: 'Conjuntos de anúncios',
        subtitle: 'Performance por ad set',
        idOf: (r) => r.adset_id ?? '',
        nameOf: (r) => `${r.adset_name ?? '—'} · ${r.campaign_name ?? '—'}`,
      }}
    />
  );
}
