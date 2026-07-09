'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/plano-saude', label: 'Visão Geral' },
  { href: '/plano-saude/kanban', label: 'Kanban' },
] as const;

/**
 * Alternador entre as duas visualizações do Plano de Saúde. Espelha o submenu
 * do header dentro da própria página, para trocar de view sem depender do hover.
 * Estilo contido em tons neutros (sem pílula colorida — regra de nav do DESIGN.md).
 */
export function PlanoSaudeTabs() {
  const pathname = usePathname();
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
      role="tablist"
      aria-label="Visualização do Plano de Saúde"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              'rounded-[0.3rem] px-3 py-1 font-medium text-sm transition-colors duration-150',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
