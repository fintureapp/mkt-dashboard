import { LevelPage, type SP } from '@/app/(dashboard)/_lib/level-page';

export default async function CampaignsPage({ searchParams }: { searchParams: SP }) {
  return (
    <LevelPage
      searchParams={searchParams}
      spec={{
        level: 'campaign',
        title: 'Campanhas',
        subtitle: 'Performance por campanha',
        idOf: (r) => r.campaign_id ?? '',
        nameOf: (r) => r.campaign_name ?? '—',
      }}
    />
  );
}
