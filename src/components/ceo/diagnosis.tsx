'use client';

import { AlertTriangle, ArrowDown, ArrowUp, Minus, Sparkles, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useState, useTransition } from 'react';
import { type DiagnosisResult, runDiagnosis } from '@/app/actions/diagnosis';
import { Button } from '@/components/ui/button';
import type { Diagnosis as DiagnosisData } from '@/lib/diagnosis';
import { cn } from '@/lib/utils';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: DiagnosisResult };

type Ctx = { state: State; run: () => void; close: () => void; enabled: boolean };
const DiagnosisCtx = createContext<Ctx | null>(null);

function useDiagnosis(): Ctx {
  const ctx = useContext(DiagnosisCtx);
  if (!ctx) throw new Error('useDiagnosis fora do DiagnosisProvider');
  return ctx;
}

/**
 * Liga o botão (no topo) ao painel (abaixo do período) sem modal. O `key` vem do
 * recorte da URL, então trocar de período fecha o diagnóstico anterior.
 */
export function DiagnosisProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const sp = useSearchParams();
  return (
    <DiagnosisState key={sp.toString()} enabled={enabled} sp={sp}>
      {children}
    </DiagnosisState>
  );
}

function DiagnosisState({
  enabled,
  sp,
  children,
}: {
  enabled: boolean;
  sp: URLSearchParams;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [, startTransition] = useTransition();

  const run = () => {
    setState({ status: 'loading' });
    startTransition(async () => {
      const result = await runDiagnosis({
        p: sp.get('p') ?? undefined,
        since: sp.get('since') ?? undefined,
        until: sp.get('until') ?? undefined,
      }).catch((): DiagnosisResult => ({ ok: false, reason: 'erro' }));
      setState({ status: 'done', result });
    });
  };

  return (
    <DiagnosisCtx.Provider
      value={{ state, run, close: () => setState({ status: 'idle' }), enabled }}
    >
      {children}
    </DiagnosisCtx.Provider>
  );
}

export function DiagnosisButton() {
  const { state, run, enabled } = useDiagnosis();
  const loading = state.status === 'loading';
  return (
    <Button
      type="button"
      size="sm"
      disabled={!enabled || loading}
      onClick={run}
      className="gap-2"
      title={enabled ? undefined : 'Diagnóstico indisponível: falta configurar a IA'}
    >
      <Sparkles className={cn(loading && 'animate-pulse')} aria-hidden="true" />
      {loading ? 'Analisando…' : 'Diagnóstico'}
    </Button>
  );
}

const PRIORITY = {
  alta: { label: 'Prioridade alta', Icon: ArrowUp, color: '#c26d74' },
  media: { label: 'Prioridade média', Icon: Minus, color: '#f8b96b' },
  baixa: { label: 'Prioridade baixa', Icon: ArrowDown, color: '#b0a89c' },
} as const;

const AREA = { midia: 'Mídia', funil: 'Funil', comercial: 'Comercial', criativos: 'Criativos' };
const ORDER = { alta: 0, media: 1, baixa: 2 };

const FAIL: Record<'indisponivel' | 'erro' | 'periodo', string> = {
  indisponivel: 'O diagnóstico ainda não está configurado neste ambiente.',
  erro: 'Não foi possível gerar o diagnóstico agora. Tente de novo em alguns minutos.',
  periodo: 'Escolha um período com dados (entre 2024 e hoje) para gerar o diagnóstico.',
};

export function DiagnosisPanel() {
  const { state, close } = useDiagnosis();
  if (state.status === 'idle') return null;

  return (
    <section
      aria-live="polite"
      aria-label="Diagnóstico"
      className="relative rounded-2xl border border-primary/40 bg-card px-5 py-6 sm:px-8"
    >
      {state.status !== 'loading' && (
        <button
          type="button"
          onClick={close}
          aria-label="Fechar diagnóstico"
          className="absolute top-4 right-4 rounded-md p-1.5 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      )}
      <h2 className="flex items-center gap-2 font-display font-semibold text-foreground text-lg tracking-tight">
        <Sparkles className="size-4 text-primary" aria-hidden="true" />
        Diagnóstico
      </h2>

      {state.status === 'loading' ? (
        <p className="mt-3 text-muted-foreground text-sm">
          Lendo o funil e a mídia do período. Leva por volta de meio minuto na primeira vez; depois
          fica guardado por algumas horas.
        </p>
      ) : state.result.ok ? (
        <DiagnosisBody d={state.result.data} />
      ) : (
        <p className="mt-3 flex items-center gap-2 text-muted-foreground text-sm">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {FAIL[state.result.reason]}
        </p>
      )}
    </section>
  );
}

function DiagnosisBody({ d }: { d: DiagnosisData }) {
  const achados = [...d.achados].sort((a, b) => ORDER[a.prioridade] - ORDER[b.prioridade]);
  const quando = new Date(d.geradoEm).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <>
      <p className="mt-3 max-w-[75ch] text-base text-foreground leading-relaxed">{d.resumo}</p>
      <ol className="mt-6 flex flex-col divide-y divide-border">
        {achados.map((a) => {
          const p = PRIORITY[a.prioridade];
          return (
            <li
              key={a.titulo}
              className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-6"
            >
              <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 font-medium text-sm"
                  style={{ color: p.color }}
                >
                  <p.Icon className="size-3.5" aria-hidden="true" />
                  {p.label}
                </span>
                <span className="text-muted-foreground text-xs">{AREA[a.area]}</span>
              </div>
              <div className="flex max-w-[75ch] flex-col gap-1.5">
                <h3 className="font-display font-semibold text-base text-foreground">{a.titulo}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{a.evidencia}</p>
                <p className="text-foreground text-sm leading-relaxed">
                  <span className="font-medium text-primary">O que fazer: </span>
                  {a.acao}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-muted-foreground text-xs">
        Análise gerada por IA em {quando} a partir dos números desta página. Confira antes de agir.
      </p>
    </>
  );
}
