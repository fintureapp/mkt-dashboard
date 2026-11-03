import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

/**
 * Ingestão do snapshot de leads de Consórcio, publicado por um fluxo do Power
 * Automate (que lê a planilha de controle no SharePoint). Grava o JSON no Vercel
 * Blob com pathname estável, de onde a aba /consorcio lê (CONSORCIO_SNAPSHOT_URL).
 *
 * Auth: header `Authorization: Bearer <CONSORCIO_INGEST_SECRET>`. A rota é isenta
 * do basic auth no middleware justamente por validar esse segredo aqui.
 *
 * Body esperado: { generatedAt?: string, leads: object[] } — onde cada item de
 * `leads` são as linhas cruas da tabela do Excel (chaves = nomes das colunas). O
 * normalizador da lib (consorcio.ts) tolera tanto esses nomes quanto camelCase.
 */

const BLOB_PATHNAME = 'consorcio-snapshot.json';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CONSORCIO_INGEST_SECRET;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!secret || !blobToken) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 });
  }

  const header = req.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!supplied || !timingSafeEqual(supplied, secret)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { generatedAt?: string; leads?: unknown };
  try {
    body = (await req.json()) as { generatedAt?: string; leads?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!Array.isArray(body.leads)) {
    return NextResponse.json({ ok: false, error: 'leads_must_be_array' }, { status: 400 });
  }

  const snapshot = {
    generatedAt: body.generatedAt || new Date().toISOString(),
    leads: body.leads,
  };

  try {
    const { url } = await put(BLOB_PATHNAME, JSON.stringify(snapshot), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      token: blobToken,
    });
    return NextResponse.json({ ok: true, url, count: body.leads.length });
  } catch {
    return NextResponse.json({ ok: false, error: 'blob_write_failed' }, { status: 502 });
  }
}
