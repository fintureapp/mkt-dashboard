/**
 * Run with: `npx tsx scripts/discover-actions.ts`
 * Requires META_ACCESS_TOKEN and META_AD_ACCOUNT_ID set in env (loads from .env.local).
 *
 * Lists every distinct action_type returned by the account in the last 30 days,
 * so you can pick which ones map to "lead" / "purchase" in conversion-mapping.ts.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvLocal() {
  try {
    const file = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
    for (const line of file.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // no .env.local — fall back to process.env
  }
}

type Entry = { action_type: string; value: string };
type InsightsRow = {
  actions?: Entry[];
  action_values?: Entry[];
  cost_per_action_type?: Entry[];
};

async function main() {
  loadEnvLocal();

  const TOKEN = process.env.META_ACCESS_TOKEN;
  const ACCOUNT = process.env.META_AD_ACCOUNT_ID ?? '535285117171536';
  const VERSION = process.env.META_GRAPH_API_VERSION ?? 'v21.0';

  if (!TOKEN || TOKEN.startsWith('PLACEHOLDER')) {
    console.error('Missing META_ACCESS_TOKEN env var (or still placeholder).');
    process.exit(1);
  }

  const url = new URL(`https://graph.facebook.com/${VERSION}/act_${ACCOUNT}/insights`);
  url.searchParams.set('level', 'account');
  url.searchParams.set('fields', 'actions,action_values,cost_per_action_type');
  url.searchParams.set('date_preset', 'last_30d');
  url.searchParams.set('access_token', TOKEN);

  const res = await fetch(url);
  if (!res.ok) {
    console.error('Meta API error:', res.status, await res.text());
    process.exit(1);
  }

  const body = (await res.json()) as { data: InsightsRow[] };

  const allTypes = new Map<string, { count: number; sumValue: number; hasRevenue: boolean }>();
  for (const row of body.data ?? []) {
    for (const a of row.actions ?? []) {
      const t = allTypes.get(a.action_type) ?? { count: 0, sumValue: 0, hasRevenue: false };
      t.count += Number(a.value) || 0;
      allTypes.set(a.action_type, t);
    }
    for (const a of row.action_values ?? []) {
      const t = allTypes.get(a.action_type) ?? { count: 0, sumValue: 0, hasRevenue: false };
      t.sumValue += Number(a.value) || 0;
      t.hasRevenue = true;
      allTypes.set(a.action_type, t);
    }
  }

  console.log(`\nAction types from act_${ACCOUNT} (last 30d):\n`);
  if (allTypes.size === 0) {
    console.log('  (nenhuma ação retornada — sem conversões/eventos no período)\n');
    return;
  }
  const sorted = [...allTypes.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [type, stats] of sorted) {
    const flag = stats.hasRevenue ? ' [REVENUE]' : '';
    console.log(
      `  ${type.padEnd(45)} count=${stats.count.toFixed(0).padStart(8)}  value=${stats.sumValue.toFixed(2)}${flag}`,
    );
  }
  console.log(
    '\nUpdate src/lib/conversion-mapping.ts with the lead/purchase action_types you see above.\n',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
