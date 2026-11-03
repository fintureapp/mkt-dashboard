import { z } from 'zod';

const EnvSchema = z.object({
  META_ACCESS_TOKEN: z.string().min(20, 'Meta access token parece curto demais'),
  META_AD_ACCOUNT_ID: z.string().regex(/^\d+$/, 'Apenas dígitos, sem prefixo act_'),
  META_GRAPH_API_VERSION: z.string().default('v21.0'),
  // Chave da API da Anthropic para o botão "Diagnóstico". Opcional: sem ela o
  // botão aparece desabilitado e o resto da página funciona normalmente.
  ANTHROPIC_API_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const flat = z.flattenError(parsed.error);
  console.error('❌ Variáveis de ambiente inválidas:', flat.fieldErrors);
  throw new Error('Variáveis de ambiente inválidas — confira .env.local ou as env vars no Vercel.');
}

export const env = parsed.data;
