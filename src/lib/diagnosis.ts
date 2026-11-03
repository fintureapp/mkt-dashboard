import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { loadCeoData, loadMediaTotals, mediaPeriodFor } from '@/lib/ceo-data';
import { buildDiagnosisInput } from '@/lib/diagnosis-input';
import { type Period, periodLabel, priorPeriod } from '@/lib/period';
import { ceoSummary } from '@/lib/plano-saude';

const MODEL = 'claude-opus-5-5';

export const DiagnosisSchema = z.object({
  resumo: z.string().describe('Duas ou três frases: a leitura geral do período.'),
  achados: z
    .array(
      z.object({
        titulo: z.string().describe('O problema ou oportunidade, em uma frase curta.'),
        prioridade: z.enum(['alta', 'media', 'baixa']),
        area: z.enum(['midia', 'funil', 'comercial', 'criativos']),
        evidencia: z.string().describe('Os números desta análise que sustentam o achado.'),
        acao: z.string().describe('O que fazer nesta semana, de forma concreta.'),
      }),
    )
    .describe('De 3 a 6 achados, do mais para o menos prioritário.'),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema> & { geradoEm: string };

const SYSTEM = `Você é um consultor sênior de growth e vendas de planos de saúde PME no Brasil.
Recebe os números de um período do funil comercial (CRM) e da mídia paga (Meta Ads) da Criteria e escreve um diagnóstico para o CEO.

Como os dados funcionam:
- "leads" do funil são os contatos que ENTRARAM no CRM no período; cada um aparece na etapa em que está HOJE.
- Etapas, em ordem: Novos leads → Leads frios (não responderam à validação) → Em atendimento → Em cotação → Em negociação → Vendas (fechado ganho + boleto pago). Perdidos ficam fora das etapas.
- O valor das vendas já vem multiplicado por 3 (volume que retorna para a operação). Os valores das demais etapas são o valor da proposta informado no card; muitas propostas não têm valor informado.
- "leadsMeta" conta formulários da Meta; pode diferir dos leads do CRM.
- Quando houver "funilAnterior"/"midiaAnterior", compare com o período anterior de mesmo tamanho.

Regras:
- Afirme só o que os números sustentam. Cite o número na evidência. Se um dado faltar (null), não invente; diga que falta quando for relevante.
- Volume pequeno (poucas dezenas de leads, poucas vendas) não sustenta conclusões fortes: diga isso.
- Ações concretas, executáveis por mídia, comercial ou gestão nesta semana. Nada genérico como "melhorar a comunicação".
- Português do Brasil, direto, sem jargão de marketing, sem travessão.`;

/**
 * Diagnóstico de um recorte, guardado por 6 h no cache remoto (compartilhado entre
 * instâncias): cliques repetidos no mesmo período não geram nova chamada paga.
 * `today` entra na chave para o "Tudo" e os atalhos virarem com o dia. Erros não
 * são cacheados (a função lança), então a próxima tentativa chama de novo.
 */
export async function cachedDiagnosis(period: Period | null, today: string): Promise<Diagnosis> {
  'use cache: remote';
  cacheTag('diagnostico');
  cacheLife({ stale: 300, revalidate: 6 * 3600, expire: 7 * 3600 });

  const data = await loadCeoData(period, today, 5);
  if (!data) throw new Error('Snapshot do CRM indisponível');

  const prior = period ? priorPeriod(period) : null;
  const mediaPrior = prior
    ? await loadMediaTotals(mediaPeriodFor(prior, data.snapshot, today))
    : null;

  const input = buildDiagnosisInput({
    periodo: period ? periodLabel(period) : 'todo o histórico do CRM',
    comparacao: prior ? periodLabel(prior) : null,
    current: data.summary,
    prior: prior ? ceoSummary(data.snapshot.cards, prior) : null,
    media: data.media,
    mediaPrior,
    creatives: data.creatives,
  });

  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: zodOutputFormat(DiagnosisSchema) },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Números do período, em JSON:\n${JSON.stringify(input, null, 2)}\n\nEscreva o diagnóstico.`,
      },
    ],
  });

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Error(`Diagnóstico sem resposta válida (stop_reason=${response.stop_reason})`);
  }
  return { ...response.parsed_output, geradoEm: new Date().toISOString() };
}
