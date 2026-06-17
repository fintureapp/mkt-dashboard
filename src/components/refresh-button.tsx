'use client';

import { RefreshCw } from 'lucide-react';
import { useTransition } from 'react';
import { refreshInsights } from '@/app/actions/refresh';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RefreshButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => refreshInsights())}
      className="gap-2"
      aria-label={pending ? 'Atualizando dados' : 'Atualizar dados da Meta'}
    >
      <RefreshCw className={cn(pending && 'animate-spin')} aria-hidden="true" />
      <span className="hidden sm:inline">{pending ? 'Atualizando…' : 'Atualizar'}</span>
    </Button>
  );
}
