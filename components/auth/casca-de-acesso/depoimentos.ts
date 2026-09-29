/**
 * Frases curtas sobre o produto, para o carrossel do painel de marca das
 * telas de acesso (login/cadastro).
 *
 * Nenhuma é atribuída a uma pessoa que não existe: esta tela é vista por
 * clientes em potencial de verdade, e um depoimento fabricado — atribuído a
 * um nome inventado — é propaganda enganosa. Por isso as frases de partida
 * falam do que o produto FAZ, sem `autor`/`papel`. Os dois campos existem
 * para que quem administra a instalação troque por uma citação real de
 * cliente mais tarde, sem tocar no componente que renderiza — só nesta
 * lista.
 *
 * `texto` é a CHAVE do dicionário de i18n (o texto em português — ver a
 * regra de ouro no topo de `lib/i18n/dicionario.ts`), nunca renderizado sem
 * passar por `t()`.
 */
export type DepoimentoDoAcesso = {
  readonly texto: string;
  /** Nome de quem disse, quando for uma citação real. Ausente = frase institucional. */
  readonly autor?: string;
  /** Cargo ou empresa de quem disse — só faz sentido junto de `autor`. */
  readonly papel?: string;
};

export const DEPOIMENTOS_DO_ACESSO: readonly DepoimentoDoAcesso[] = [
  {
    texto:
      "O WhatsApp da operação, atendido por IA 24 horas por dia. Nenhum lead espera até segunda.",
  },
  {
    texto:
      "Cada agendamento cai direto na agenda, sem ninguém copiar número de uma tela para outra.",
  },
  {
    texto:
      "Um funil só, da primeira mensagem ao fechamento: pipeline, tarefas e histórico no mesmo lugar.",
  },
  {
    texto:
      "Time humano e agentes de IA na mesma fila. A IA resolve o simples; o time entra no que importa.",
  },
];
