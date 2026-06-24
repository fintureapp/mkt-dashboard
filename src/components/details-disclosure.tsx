import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Disclosure editorial: esconde densidade por padrão (tela limpa para leitura de 5s),
 * revela sob demanda. Usa <details> nativo — acessível por teclado, sem JS, e respeita
 * prefers-reduced-motion automaticamente.
 */
export function DetailsDisclosure({
  summary,
  hint,
  children,
}: {
  summary: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="size-4 transition-transform duration-150 group-open:rotate-180"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="font-medium">{summary}</span>
        {hint && <span className="text-muted-foreground/60 text-xs">{hint}</span>}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
