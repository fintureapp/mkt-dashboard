'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard]', error);
  }, [error]);

  const isMeta = error.message.includes('Meta API') || error.name === 'MetaApiError';

  return (
    <div className="mx-auto mt-12 max-w-xl rounded-lg border border-border bg-card p-8">
      <div className="flex items-start gap-4">
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="flex flex-col gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            {isMeta ? 'Não consegui buscar os dados da Meta' : 'Algo deu errado'}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{error.message}</p>
          {isMeta && (
            <p className="text-muted-foreground/80 text-xs leading-relaxed">
              Verifique se{' '}
              <code className="rounded bg-secondary px-1 py-0.5 font-mono text-foreground">
                META_ACCESS_TOKEN
              </code>{' '}
              está válido (token de usuário expira em 60d) e se a conta{' '}
              <code className="rounded bg-secondary px-1 py-0.5 font-mono text-foreground">
                META_AD_ACCOUNT_ID
              </code>{' '}
              tem permissão{' '}
              <code className="rounded bg-secondary px-1 py-0.5 font-mono text-foreground">
                ads_read
              </code>
              .
            </p>
          )}
          <div className="mt-1">
            <Button onClick={reset} size="sm" variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
