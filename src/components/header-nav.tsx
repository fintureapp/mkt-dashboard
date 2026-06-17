'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Visão Geral' },
  { href: '/campanhas', label: 'Campanhas' },
  { href: '/conjuntos', label: 'Conjuntos' },
  { href: '/anuncios', label: 'Anúncios' },
  { href: '/plano-saude', label: 'Plano de Saúde' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn('items-center gap-1', className)} aria-label="Seções do dashboard">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative px-3 py-1.5 font-medium text-sm transition-colors duration-150',
              'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {active && (
              <span
                aria-hidden="true"
                className="-bottom-[19px] absolute inset-x-3 h-[2px] bg-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavMobileMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className={cn(className)}
          aria-label="Abrir menu de seções"
        >
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-44 shadow-floating border-border bg-popover"
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'cursor-pointer text-sm',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {item.label}
                {active && (
                  <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
