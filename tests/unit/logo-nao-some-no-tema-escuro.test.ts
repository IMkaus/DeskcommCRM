/**
 * O LOGO DE QUEM HOSPEDA NUNCA É DESENHADO CRU CONTRA UM FUNDO ESCURO.
 *
 * ═══ O DEFEITO ═══
 *
 * O produto aceita UM logo só — `platform_branding.logo_url` /
 * `organizations.settings.branding` —, e não há segunda arte para o tema
 * escuro. A arte que o operador sobe é, quase sempre, pensada para fundo
 * claro. O `--color-surface` do tema escuro é `#1d1c17`: um logo azul-marinho
 * ou preto ali não tem contraste nenhum e simplesmente some, sem erro, sem
 * aviso e sem nada na tela dizendo que sumiu.
 *
 * O conserto, na barra lateral e na prévia, é uma SILHUETA BRANCA do logo no
 * tema escuro (`filter: brightness(0) invert(1)`, sem chip). Vale em DUAS superfícies, e as duas precisam concordar — consertar uma só
 * devolve o defeito na outra:
 *
 *   1. a barra lateral do app          (`components/shell/Sidebar.tsx`)
 *   2. a PRÉVIA da tela de marca       (`components/branding/CampoDeLogo.tsx`)
 *
 * A segunda é a que mais engana: se a prévia mostrar o logo cru onde o app
 * real desenha um chip, ela deixa de ser prévia — o operador aprova na tela de
 * marca uma coisa e recebe outra no produto.
 *
 * ═══ A TERCEIRA SUPERFÍCIE SAIU — E FOI DECISÃO, NÃO DESCUIDO ═══
 *
 * A TELA DE ENTRADA (`app/(public)/layout.tsx`) tinha o mesmo chip até o
 * redesign da casca de acesso (referência OuTree, identidade Scalium). Ele
 * passou a produzir o defeito OPOSTO: a marca instalada é um traço VERMELHO
 * sobre fundo TRANSPARENTE, e um logo branco (variante que existe ao lado da
 * vermelha) configurado por engano ficava branco-sobre-branco dentro do chip —
 * um retângulo em branco, sem nada visível, na PRIMEIRA tela que um cliente em
 * potencial abre. E a casca nova força `data-theme="dark"` sempre (a
 * identidade da marca é escura por doutrina, não segue mais o tema salvo do
 * visitante), então o chip deixou de ser condicional — seria incondicional, e
 * o retângulo em branco também. Vermelho sobre o fundo escuro da casca lê bem
 * sozinho, sem chip. A cerca abaixo (`sem chip na fachada`) prova a ausência
 * deliberada; ver o cabeçalho de `app/(public)/layout.tsx` para o raciocínio
 * completo.
 *
 * ═══ ⚠️ ESTE TESTE É UMA CERCA, NÃO UMA PROVA ═══
 *
 * Ele garante que o `<img>` do logo continue ENVOLVIDO pelo chip, que é o modo
 * pelo qual o conserto voltaria atrás em silêncio: desembrulhar a imagem não
 * gera conflito de merge, não muda tipo nenhum, e nada na tela grita. O que ele
 * NÃO faz é medir contraste num navegador — isso é Playwright com
 * `getComputedStyle`, e está anotado como pendência.
 *
 * A barra lateral usa a variante `dark:` do Tailwind, que neste repo é
 * `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`
 * (app/globals.css) — ou seja, segue o tema DO APP, não o do sistema
 * operacional. A prévia da tela de marca NÃO pode usar `dark:`: ela desenha as
 * duas aparências lado a lado no MESMO tema real, simulando o fundo por
 * `style`, então lá a condição é o rótulo da caixa.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const RAIZ = join(__dirname, "..", "..");
const leia = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

/** Tira comentário para que uma menção em prosa não satisfaça a cerca. */
const semComentario = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");

describe("o logo do operador não some no tema escuro", () => {
  it("a BARRA LATERAL desenha o logo como silhueta branca quando o tema é escuro", () => {
    const fonte = semComentario(leia("components/shell/Sidebar.tsx"));

    // O filtro tem de estar no PRÓPRIO `<img>` do logo: em qualquer irmão ou
    // ancestral ele deixaria a arte crua de novo. `[^>]*` não atravessa o fim da
    // tag, e o `cn(` do className não contém `>`.
    const img = fonte.match(/<img\s[^>]*>/)?.[0] ?? "";
    expect(img, "a barra lateral deixou de desenhar o logo com `<img>`").not.toBe("");
    expect(
      img,
      "o `<img>` do logo da barra lateral perdeu `dark:[filter:brightness(0)_invert(1)]` — " +
        "um logo escuro some contra o fundo escuro",
    ).toMatch(/dark:\[filter:brightness\(0\)_invert\(1\)\]/);
    // A moldura branca antiga NÃO volta: a silhueta a substituiu.
    expect(fonte).not.toMatch(/dark:bg-white/);
  });

  it("a TELA DE ENTRADA NÃO desenha mais o chip — decisão do redesign, não regressão", () => {
    // Ver o cabeçalho deste arquivo e o de `app/(public)/layout.tsx`: o chip
    // aqui trocava um defeito por outro (branco sobre branco quando a arte
    // configurada é a variante clara da marca), e a casca nova é sempre
    // escura — não haveria mais estado "claro" para o chip alternar.
    const fonte = semComentario(leia("app/(public)/layout.tsx"));
    expect(
      fonte,
      "o chip `dark:bg-white` voltou à tela de entrada — isso reintroduz o " +
        "retângulo em branco quando a marca configurada é a variante clara " +
        "(ver o cabeçalho de app/(public)/layout.tsx)",
    ).not.toMatch(/dark:bg-white/);
  });

  it("a PRÉVIA da tela de marca mostra a silhueta na caixa da aparência escura", () => {
    // Aqui a condição não pode ser `dark:` — ver o cabeçalho. Ela é o rótulo da
    // caixa, e o chip é incondicional dentro dela.
    const fonte = semComentario(leia("components/branding/CampoDeLogo.tsx"));

    expect(
      fonte,
      "a prévia da aparência escura voltou a mostrar o logo cru — ela deixa de prever o que o app desenha",
    ).toMatch(/Apar.ncia escura["')\s]*\s*\?\s*["'`][^"'`]*\[filter:brightness\(0\)_invert\(1\)\]/);
  });

  it("CONTROLE: as três superfícies continuam sendo as três que desenham o logo do operador", () => {
    // Se uma quarta tela passar a desenhar `<img src={logo}>`, esta cerca fica
    // com escopo velho sem avisar — que é exatamente o modo de falha que o
    // `barra-lateral-nao-perde-o-sticky` registra. O número aqui é MEDIDO, não
    // chutado: em 2026-09-11, na prévia do merge do PR #659, `logoUrl`/`logo`
    // chegava a um `<img>` em exatamente três arquivos.
    const SUPERFICIES = [
      "components/shell/Sidebar.tsx",
      "app/(public)/layout.tsx",
      "components/branding/CampoDeLogo.tsx",
    ];
    for (const arquivo of SUPERFICIES) {
      expect(semComentario(leia(arquivo)), `${arquivo} deixou de desenhar o logo`).toMatch(/<img\b/);
    }
  });
});
