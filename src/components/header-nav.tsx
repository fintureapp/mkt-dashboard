'use client';

import { ChevronDown, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type NavChild = { href: string; label: string };
type NavItem = { href: string; label: string; children?: readonly NavChild[] };

const NAV: readonly NavItem[] = [
  { href: '/', label: 'Visão Geral' },
  { href: '/campanhas', label: 'Campanhas' },
  { href: '/conjuntos', label: 'Conjuntos' },
  { href: '/anuncios', label: 'Anúncios' },
  {
    href: '/plano-saude',
    label: 'Plano de Saúde',
    children: [
      { href: '/plano-saude', label: 'Visão Geral' },
      { href: '/plano-saude/kanban', label: 'Kanban' },
    ],
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative px-3 py-1.5 font-medium text-sm transition-colors duration-150',
        'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      {active && (
        <span aria-hidden="true" className="-bottom-[19px] absolute inset-x-3 h-[2px] bg-primary" />
      )}
    </Link>
  );
}

/**
 * Item de nav com submenu que abre no hover (e no focus, por teclado). O rótulo
 * continua sendo um link para a própria seção — clicar leva à Visão Geral; passar
 * o mouse (ou focar) revela as sub-views. Fecha no Escape, no blur e ao sair.
 */
function NavItemWithSubmenu({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = isActive(pathname, item.href);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Fecha o submenu ao navegar (troca de rota).
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname dispara o efeito, não é lido no corpo
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  // Limpa o timer de fechamento ao desmontar.
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: container de hover/focus do submenu; a navegação real é via link + menuitems
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        cancelClose();
        setOpen(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'relative flex items-center gap-1 px-3 py-1.5 font-medium text-sm transition-colors duration-150',
          'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {item.label}
        <ChevronDown
          className={cn('size-3.5 transition-transform duration-150', open && 'rotate-180')}
          aria-hidden="true"
        />
        {active && (
          <span aria-hidden="true" className="-bottom-[19px] absolute inset-x-3 h-[2px] bg-primary" />
        )}
      </Link>

      <div
        className={cn(
          'absolute top-full left-0 z-40 min-w-44 pt-2 transition-opacity duration-150 motion-reduce:transition-none',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        <div
          role="menu"
          aria-label={item.label}
          className="flex flex-col gap-0.5 rounded-md border border-border bg-popover p-1 shadow-floating"
        >
          {item.children?.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                aria-current={childActive ? 'page' : undefined}
                tabIndex={open ? 0 : -1}
                className={cn(
                  'flex items-center justify-between gap-6 rounded-[0.3rem] px-2.5 py-1.5 text-sm transition-colors duration-150',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  childActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {child.label}
                {childActive && (
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn('items-center gap-1', className)} aria-label="Seções do dashboard">
      {NAV.map((item) =>
        item.children ? (
          <NavItemWithSubmenu key={item.href} item={item} pathname={pathname} />
        ) : (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActive(pathname, item.href)}
          />
        ),
      )}
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
            <Fragment key={item.href}>
              <DropdownMenuItem asChild>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'cursor-pointer text-sm',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                  {active && !item.children && (
                    <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </DropdownMenuItem>
              {item.children?.map((child) => {
                const childActive = pathname === child.href;
                return (
                  <DropdownMenuItem key={child.href} asChild>
                    <Link
                      href={child.href}
                      aria-current={childActive ? 'page' : undefined}
                      className={cn(
                        'cursor-pointer pl-6 text-sm',
                        childActive ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {child.label}
                      {childActive && (
                        <span
                          aria-hidden="true"
                          className="ml-auto size-1.5 rounded-full bg-primary"
                        />
                      )}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
