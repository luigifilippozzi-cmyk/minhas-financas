import { describe, it, expect } from 'vitest';
import { categorizarTransacao } from '../../src/js/utils/categorizer.js';

// Conjunto mínimo de categorias simulando o Firestore
const CATEGORIAS = [
  { id: 'cat-alim',  nome: 'Alimentação', tipo: 'despesa' },
  { id: 'cat-transp', nome: 'Transporte',  tipo: 'despesa' },
  { id: 'cat-saude',  nome: 'Saúde',       tipo: 'despesa' },
  { id: 'cat-lazer',  nome: 'Lazer',       tipo: 'despesa' },
  { id: 'cat-compras', nome: 'Compras',    tipo: 'despesa' },
  { id: 'cat-educ',   nome: 'Educação',    tipo: 'despesa' },
  { id: 'cat-morad',  nome: 'Moradia',     tipo: 'despesa' },
  { id: 'cat-pets',   nome: 'Pets',        tipo: 'despesa' },
];

// ── Camada 3: regras por palavras-chave (fallback estático) ───────────────────

describe('categorizarTransacao — regras por palavras-chave', () => {
  it('iFood → Alimentação', () => {
    expect(categorizarTransacao('IFOOD *REST ABC', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-alim');
  });

  it('Supermercado → Alimentação', () => {
    expect(categorizarTransacao('SUPERMERCADO MAMBO', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-alim');
  });

  it('Padaria → Alimentação', () => {
    expect(categorizarTransacao('PADARIA DO BAIRRO', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-alim');
  });

  it('Uber → Transporte', () => {
    expect(categorizarTransacao('UBER * VIAGEM', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-transp');
  });

  it('Combustível → Transporte', () => {
    expect(categorizarTransacao('POSTO IPIRANGA COMBUSTIVEL', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-transp');
  });

  it('Farmácia → Saúde', () => {
    expect(categorizarTransacao('FARMACIA DROGASIL', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-saude');
  });

  it('Academia → Saúde', () => {
    expect(categorizarTransacao('SMARTFIT ACADEMIA', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-saude');
  });

  it('Netflix → Lazer', () => {
    expect(categorizarTransacao('NETFLIX.COM', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-lazer');
  });

  it('Cinema → Lazer', () => {
    expect(categorizarTransacao('INGRESSO CINEMA', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-lazer');
  });

  it('Shopee → Compras', () => {
    expect(categorizarTransacao('SHOPEE PAGAMENTO', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-compras');
  });

  it('Amazon → Compras', () => {
    expect(categorizarTransacao('AMAZON MARKETPLACE', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-compras');
  });

  it('Curso online → Educação', () => {
    expect(categorizarTransacao('UDEMY CURSO', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-educ');
  });

  it('Energia elétrica → Moradia', () => {
    expect(categorizarTransacao('CEMIG ENERGIA LUZ', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-morad');
  });

  it('Pet shop → Pets', () => {
    expect(categorizarTransacao('COBASI PET SHOP', 'desconhecido', CATEGORIAS, {}))
      .toBe('cat-pets');
  });

  it('Estabelecimento desconhecido → string vazia', () => {
    expect(categorizarTransacao('LOJA GENÉRICA XYZ', 'desconhecido', CATEGORIAS, {}))
      .toBe('');
  });
});

// ── Camada 2: histórico global ────────────────────────────────────────────────

describe('categorizarTransacao — histórico global', () => {
  it('usa mapa de histórico quando disponível', () => {
    // A chave é gerada com .toLowerCase().trim() — acentos são PRESERVADOS.
    // Nota: isso significa que 'loja genérica xyz' (com acento) e
    // 'loja generica xyz' (sem acento) são chaves distintas.
    const mapaHist = { 'loja genérica xyz': 'cat-compras' };
    expect(categorizarTransacao('Loja Genérica XYZ', 'desconhecido', CATEGORIAS, mapaHist))
      .toBe('cat-compras');
  });

  it('NOTA DE DESIGN: chaves com e sem acento são distintas no mapa de histórico', () => {
    // 'loja generica xyz' (sem acento) NÃO casa com 'Loja Genérica XYZ'
    const mapaHistSemAcento = { 'loja generica xyz': 'cat-compras' };
    expect(categorizarTransacao('Loja Genérica XYZ', 'desconhecido', CATEGORIAS, mapaHistSemAcento))
      .toBe(''); // não encontra — potencial melhoria futura para normalizar acentos
  });

  it('ignora entrada de histórico se a categoriaId não existe nas categorias', () => {
    const mapaHist = { 'loja x': 'cat-inexistente' };
    // Deve cair no fallback de palavras-chave ou retornar vazio
    const resultado = categorizarTransacao('Loja X', 'desconhecido', CATEGORIAS, mapaHist);
    expect(resultado).toBe('');
  });
});

// ── Camada 1: histórico com contexto de banco (RF-022) ───────────────────────

describe('categorizarTransacao — histórico com contexto de banco', () => {
  it('prefere chave origem+estabelecimento à chave global', () => {
    const mapaHist = {
      'loja x':          'cat-compras',   // chave global
      'loja x|nubank':   'cat-lazer',     // chave com banco — deve ter prioridade
    };
    expect(categorizarTransacao('Loja X', 'nubank', CATEGORIAS, mapaHist))
      .toBe('cat-lazer');
  });

  it('cai para histórico global quando não há chave de origem específica', () => {
    const mapaHist = {
      'loja x': 'cat-compras',
    };
    expect(categorizarTransacao('Loja X', 'nubank', CATEGORIAS, mapaHist))
      .toBe('cat-compras');
  });

  it('cai para palavras-chave quando origem é "desconhecido"', () => {
    // Origem desconhecida pula camada 1 diretamente
    const mapaHist = {};
    expect(categorizarTransacao('IFOOD *REST', 'desconhecido', CATEGORIAS, mapaHist))
      .toBe('cat-alim');
  });
});

// ── Casos de borda ────────────────────────────────────────────────────────────

describe('categorizarTransacao — casos de borda', () => {
  it('retorna string vazia quando categorias é array vazio', () => {
    expect(categorizarTransacao('IFOOD', 'nubank', [], {})).toBe('');
  });

  it('retorna string vazia quando estab é null ou vazio', () => {
    expect(categorizarTransacao(null, 'nubank', CATEGORIAS, {})).toBe('');
    expect(categorizarTransacao('', 'nubank', CATEGORIAS, {})).toBe('');
  });
});
