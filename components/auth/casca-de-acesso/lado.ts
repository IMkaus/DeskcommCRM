/**
 * Em qual metade da tela de acesso o FORMULÁRIO de login fica.
 *
 * O dono do produto pediu o formulário à DIREITA no login (com o carrossel de
 * frases à esquerda) — o oposto das duas capturas de referência que ele mesmo
 * enviou (nelas o formulário fica à esquerda). Esta constante existe para que
 * essa escolha seja uma decisão de UMA linha, e não uma caça a classes
 * espalhadas pelo shell: trocar para `"left"` espelha o login inteiro, e o
 * cadastro segue sozinho — ele sempre usa o lado OPOSTO ao do login, nunca um
 * valor próprio, porque a animação de troca é "os dois painéis se cruzam".
 */
export type LadoDoPainel = "left" | "right";

export const LADO_DO_FORMULARIO_NO_LOGIN: LadoDoPainel = "right";

export function ladoOposto(lado: LadoDoPainel): LadoDoPainel {
  return lado === "left" ? "right" : "left";
}
