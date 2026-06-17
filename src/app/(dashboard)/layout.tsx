import { Suspense } from 'react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { env } from '@/lib/env';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <Suspense fallback={null}>
        <Footer accountId={env.META_AD_ACCOUNT_ID} />
      </Suspense>
    </div>
  );
}
