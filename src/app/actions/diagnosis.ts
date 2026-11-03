'use server';

import { resolveCeoPeriod, todayInBrazil } from '@/lib/ceo-period';
import { cachedDiagnosis, type Diagnosis } from '@/lib/diagnosis';

export type DiagnosisResult =
  | { ok: true; data: Diagnosis }
  | { ok: false; reason: 'indisponivel' | 'erro' | 'periodo' };

/**
 * Gera (ou devolve do cache) o diagnóstico do recorte. Recebe só os parâmetros
 * da URL e recalcula os números no servidor: o browser nunca manda dados.
 */
export async function runDiagnosis(sp: {
  p?: string;
  since?: string;
  until?: string;
}): Promise<DiagnosisResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: 'indisponivel' };

  const today = todayInBrazil();
  const { period } = resolveCeoPeriod(
    { p: String(sp?.p ?? ''), since: String(sp?.since ?? ''), until: String(sp?.until ?? '') },
    today,
  );
  // Intervalo livre no futuro ou anterior a 2024 não tem dado: evita gastar chamada.
  if (period && (period.until > today || period.since < '2024-01-01')) {
    return { ok: false, reason: 'periodo' };
  }

  try {
    return { ok: true, data: await cachedDiagnosis(period, today) };
  } catch (err) {
    console.error('[diagnostico] falhou:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'erro' };
  }
}
