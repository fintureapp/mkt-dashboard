import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveCeoPeriod } from './ceo-period.ts';
import {
  ceoFunnel,
  ceoStageOf,
  ceoSummary,
  earliestEntry,
  firstName,
  type PlanoCard,
  recentMoves,
} from './plano-saude.ts';

// Dados 100% sintéticos.
function card(stage: string, value = 0, createdDate = '2026-10-10', eventDate = createdDate) {
  return {
    bucket: null,
    stage,
    convId: 0,
    name: 'fulano de tal',
    value,
    eventDate: `${eventDate}T12:00:00Z`,
    createdDate: `${createdDate}T12:00:00Z`,
    hasValue: value > 0,
  } satisfies PlanoCard;
}

describe('ceoStageOf', () => {
  it('agrupa as colunas do CRM nas 6 etapas de saúde', () => {
    assert.equal(ceoStageOf('Novos Leads'), 'novos');
    assert.equal(ceoStageOf('Validação de Dados'), 'novos');
    assert.equal(ceoStageOf('Leads Frios - Segunda Validação'), 'frios');
    assert.equal(ceoStageOf('Necessita Atendimento'), 'atendimento');
    assert.equal(ceoStageOf('Enviado para Cotação'), 'cotacao');
    assert.equal(ceoStageOf('Atendimento Humano / Em Cotação'), 'cotacao');
    assert.equal(ceoStageOf('Negociação'), 'negociacao');
    assert.equal(ceoStageOf('Negociações quentes'), 'negociacao');
    assert.equal(ceoStageOf('Fechado - Ganho'), 'vendas');
    assert.equal(ceoStageOf('Boleto pago'), 'vendas');
    assert.equal(ceoStageOf('Fechado - Perdido'), 'perdidos');
  });
});

describe('ceoSummary', () => {
  const cards = [
    card('Novos Leads'),
    card('Leads Frios - Segunda Validação'),
    card('Atendimento Humano / Em Cotação', 1000),
    card('Atendimento Humano / Em Cotação'),
    card('Negociações quentes', 2000),
    card('Boleto pago', 500),
    card('Fechado - Perdido', 9999),
    card('Novos Leads', 0, '2026-01-01'),
  ];

  it('conta, soma valores e aplica a regra ×3 só em Vendas', () => {
    const s = ceoSummary(cards, null);
    assert.equal(s.total, 8);
    assert.equal(s.stages.find((x) => x.key === 'novos')?.count, 2);
    assert.equal(s.stages.find((x) => x.key === 'cotacao')?.value, 1000);
    assert.equal(s.vendas, 1);
    assert.equal(s.vendasValor, 1500);
    assert.equal(s.volumeNegociacao, 3000);
    assert.equal(s.comValor, 2);
    assert.equal(s.perdidos.count, 1);
    assert.equal(s.emAndamento, 6);
    assert.equal(s.conversao, 1 / 8);
  });

  it('recorta pela data de entrada no CRM', () => {
    const s = ceoSummary(cards, { since: '2026-10-01', until: '2026-10-31' });
    assert.equal(s.total, 7);
    assert.equal(s.stages.find((x) => x.key === 'novos')?.count, 1);
  });

  it('não divide por zero sem leads', () => {
    const s = ceoSummary([], null);
    assert.equal(s.conversao, null);
    assert.ok(s.stages.every((x) => x.share === 0));
  });
});

describe('dados pessoais', () => {
  it('firstName devolve só o primeiro nome', () => {
    assert.equal(firstName('MARIA da silva souza'), 'Maria');
    assert.equal(firstName('  joão  '), 'João');
    assert.equal(firstName('.'), 'Sem nome');
    assert.equal(firstName(''), 'Sem nome');
    assert.equal(firstName('5511999990000@c.us'), 'Sem nome');
    assert.equal(firstName('+55 11 99999-0000'), 'Sem nome');
    assert.equal(firstName('fulano@exemplo.com'), 'Sem nome');
  });

  it('recentMoves não carrega nome completo nem id de conversa', () => {
    const [m] = recentMoves([card('Negociação', 10)], null);
    assert.deepEqual(Object.keys(m).sort(), [
      'entrada',
      'firstName',
      'stage',
      'stageKey',
      'ultima',
      'value',
    ]);
    assert.equal(m.firstName, 'Fulano');
    assert.equal(m.stage, 'Em negociação');
  });

  it('recentMoves ordena da movimentação mais recente', () => {
    const list = recentMoves(
      [
        card('Negociação', 0, '2026-10-01', '2026-10-02'),
        card('Boleto pago', 0, '2026-10-01', '2026-10-09'),
      ],
      null,
    );
    assert.equal(list[0].stageKey, 'vendas');
  });

  it('tolera card sem data (snapshot real tem casos)', () => {
    const semData = {
      ...card('Negociação'),
      eventDate: null,
      createdDate: null,
    } as unknown as PlanoCard;
    assert.equal(earliestEntry([semData]), null);
    assert.equal(recentMoves([semData], null)[0].ultima, '');
  });

  it('earliestEntry acha a entrada mais antiga', () => {
    assert.equal(
      earliestEntry([card('X', 0, '2026-05-02'), card('X', 0, '2026-03-01')]),
      '2026-03-01',
    );
  });
});

describe('resolveCeoPeriod', () => {
  const today = '2026-11-03';
  it('padrão é 30 dias incluindo hoje', () => {
    assert.deepEqual(resolveCeoPeriod({}, today), {
      preset: '30d',
      period: { since: '2026-10-05', until: today },
    });
  });
  it('tudo não recorta', () => {
    assert.deepEqual(resolveCeoPeriod({ p: 'tudo' }, today), { preset: 'tudo', period: null });
  });
  it('7 dias e hoje', () => {
    assert.equal(resolveCeoPeriod({ p: '7d' }, today).period?.since, '2026-10-28');
    assert.equal(resolveCeoPeriod({ p: 'hoje' }, today).period?.since, today);
  });
  it('intervalo livre vence o atalho e é normalizado', () => {
    assert.deepEqual(
      resolveCeoPeriod({ p: 'tudo', since: '2026-10-20', until: '2026-10-01' }, today),
      {
        preset: null,
        period: { since: '2026-10-01', until: '2026-10-20' },
      },
    );
  });
  it('datas inválidas caem no padrão', () => {
    assert.equal(resolveCeoPeriod({ since: 'ontem', until: '2026-10-01' }, today).preset, '30d');
  });
});

describe('ceoFunnel', () => {
  const cards = [
    card('Novos Leads'),
    card('Leads Frios - Segunda Validação'),
    card('Necessita Atendimento'),
    card('Atendimento Humano / Em Cotação'),
    card('Atendimento Humano / Em Cotação'),
    card('Negociação'),
    card('Negociações quentes'),
    card('Boleto pago'),
    card('Fechado - Perdido'),
  ];
  const f = ceoFunnel(ceoSummary(cards, null));
  const get = (k: string) => f.find((x) => x.key === k);

  it('conta quem chegou na etapa ou passou dela', () => {
    assert.deepEqual(
      f.map((x) => x.count),
      [9, 7, 6, 3, 1],
    );
  });

  it('é monotônico (nenhuma etapa maior que a anterior)', () => {
    for (let i = 1; i < f.length; i++) assert.ok(f[i].count <= f[i - 1].count);
  });

  it('taxa entre etapas', () => {
    assert.equal(get('total')?.fromPrev, null);
    assert.equal(get('negociacao')?.fromPrev, 3 / 6);
    assert.equal(get('vendas')?.fromPrev, 1 / 3);
  });

  it('sem leads, taxas são null', () => {
    assert.ok(ceoFunnel(ceoSummary([], null)).every((x) => x.fromPrev === null));
  });
});
