import Link from 'next/link';
import { Suspense } from 'react';
import { NavLinks, NavMobileMenu } from '@/components/header-nav';
import { PeriodSelector } from '@/components/period-selector';
import { RefreshButton } from '@/components/refresh-button';
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-border border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-6 sm:gap-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Marketing BI — voltar para a Visão Geral"
        >
          <span
            className="inline-flex size-7 items-center justify-center rounded bg-primary font-display font-bold text-primary-foreground"
            aria-hidden="true"
          >
            f
          </span>
          <span className="font-display font-semibold text-base text-foreground tracking-tight">
            Marketing BI
          </span>
        </Link>

        <NavLinks className="hidden md:flex" />

        <div className="ml-auto flex items-center gap-2">
          <Suspense fallback={<Skeleton className="h-8 w-44" />}>
            <PeriodSelector />
          </Suspense>
          <RefreshButton />
          <NavMobileMenu className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
