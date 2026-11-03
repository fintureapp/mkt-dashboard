import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MediaTotals } from './ceo-data.ts';
import { buildDiagnosisInput } from './diagnosis-input.ts';
import { ceoSummary, type PlanoCard } from './plano-saude.ts';

// Dados 100% sintéticos.
function card(stage: string, name: string, value = 0): PlanoCard {
  return {
    bucket: null,
    stage,
    convId: 12345,
    name,
    value,
    eventDate: '2026-10-10T12:00:00Z',
    createdDate: '2026-10-10T12:00:00Z',
    hasValue: value > 0,
  };
}

const cards = [
  card('Novos Leads', 'Maria Exemplo Silva'),
  card('Atendimento Humano / Em Cotação', 'João Teste Souza', 800),
  card('Boleto pago', '5511999990000@c.us', 500),
  card('Fechado - Perdido', 'Ana Fictícia'),
];
const media: MediaTotals = {
  spend: 1000,
  leads: 40,
  cpl: 25,
  ctr: 1.234,
  cpm: 30,
  clicks: 120,
  impressions: 9724,
};

describe('buildDiagnosisInput', () => {
  const input = buildDiagnosisInput({
    periodo: '01/10/2026 – 31/10/2026',
    comparacao: '01/09/2026 – 30/09/2026',
    current: ceoSummary(cards, null),
    prior: ceoSummary([], null),
    media,
    mediaPrior: null,
    creatives: [
      {
        id: '1',
        name: 'Anúncio A',
        spend: 300,
        impressions: 1000,
        clicks: 20,
        ctr: 2,
        leads: 10,
        cpl: 30,
        imageUrl: 'https://x',
      },
    ],
  });
  const json = JSON.stringify(input);

  it('não leva nenhum dado de lead (nome, telefone, id)', () => {
    for (const leak of ['Maria', 'Souza', 'Fictícia', '5511999990000', 'c.us', '12345']) {
      assert.ok(!json.includes(leak), `vazou: ${leak}`);
    }
  });

  it('não leva URL de imagem do criativo', () => {
    assert.ok(!json.includes('https://'));
  });

  it('resume funil, custo por venda e comparação', () => {
    assert.equal(input.funil.leads, 4);
    assert.equal(input.funil.vendas, 1);
    assert.equal(input.funil.valorVendasR$, 1500);
    assert.equal(input.custoPorVenda, 1000);
    assert.equal(input.midia?.ctrPct, 1.23);
    assert.equal(input.funilAnterior?.leads, 0);
    assert.equal(input.midiaAnterior, null);
  });

  it('sem vendas, custo por venda é null', () => {
    const i = buildDiagnosisInput({
      periodo: 'x',
      comparacao: null,
      current: ceoSummary([card('Novos Leads', 'X')], null),
      prior: null,
      media,
      mediaPrior: null,
      creatives: null,
    });
    assert.equal(i.custoPorVenda, null);
    assert.equal(i.funilAnterior, null);
    assert.equal(i.criativos, null);
  });
});
