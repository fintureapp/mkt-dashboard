import { connection } from 'next/server';

const TZ = 'America/Sao_Paulo';

export async function Footer({ accountId }: { accountId: string }) {
  await connection();
  const now = new Date();
  const ts = `${now.toLocaleDateString('pt-BR', { timeZone: TZ })} às ${now.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })}`;
  return (
    <footer className="mt-8 border-border border-t px-6 py-5 text-muted-foreground text-xs">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <span className="tabular">
          Conta: <span className="font-medium text-foreground/80">act_{accountId}</span>
          <span className="mx-2 text-muted-foreground/50">·</span>
          datas no fuso da conta de anúncios
        </span>
        <span className="tabular">Renderizado em {ts}</span>
      </div>
    </footer>
  );
}
