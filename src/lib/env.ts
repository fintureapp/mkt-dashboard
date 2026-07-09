import { z } from 'zod';

const EnvSchema = z.object({
  META_ACCESS_TOKEN: z.string().min(20, 'Meta access token parece curto demais'),
  META_AD_ACCOUNT_ID: z.string().regex(/^\d+$/, 'Apenas dígitos, sem prefixo act_'),
  META_GRAPH_API_VERSION: z.string().default('v21.0'),
  BASIC_AUTH_USER: z.string().min(1),
  BASIC_AUTH_PASS: z.string().min(8, 'Mínimo 8 caracteres'),
  // Token do link público (sem login) da Visão Geral. Opcional: se ausente, a
  // rota /publico/[token] fica fechada atrás do basic auth (fail-closed).
  PUBLIC_SHARE_TOKEN: z.string().min(24, 'Use um valor aleatório longo (≥24 chars)').optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const flat = z.flattenError(parsed.error);
  console.error('❌ Variáveis de ambiente inválidas:', flat.fieldErrors);
  throw new Error('Variáveis de ambiente inválidas — confira .env.local ou as env vars no Vercel.');
}

export const env = parsed.data;
