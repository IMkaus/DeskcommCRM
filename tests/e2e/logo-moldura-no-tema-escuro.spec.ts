/**
 * A SILHUETA BRANCA DO LOGO NO TEMA ESCURO — QUEM A RECEBE, E QUEM NÃO RECEBE.
 * (O nome do arquivo guarda o da solução anterior, a moldura clara; ver abaixo.)
 *
 * ═══ O QUE ESTA SPEC MEDE, E POR QUE ELA EXISTE ═══
 *
 * O produto aceita UM logo só, enviado por quem hospeda, e a arte costuma ser
 * pensada para fundo claro. Contra `--color-surface` escuro (`#1d1c17`) um logo
 * azul-marinho ou preto simplesmente some — sem erro, sem aviso, e sem nada na
 * tela dizendo que sumiu.
 *
 * O PR #659 resolvia isso com uma MOLDURA clara (chip `dark:bg-white dark:px-…`)
 * por trás do logo. Ela foi trocada por uma SILHUETA BRANCA: no tema escuro o
 * próprio `<img>` recebe `filter: brightness(0) invert(1)` (classe
 * `dark:[filter:brightness(0)_invert(1)]`), sem chip nenhum; no tema claro o
 * filtro é `none` e a arte fica com as cores originais. Serve a qualquer arte
 * sem inspecionar pixel de URL externa.
 *
 * Já existe uma cerca para isso: `tests/unit/logo-nao-some-no-tema-escuro.test.ts`.
 * Ela lê a FONTE e prova que o filtro está no `<img>` — e o cabeçalho dela diz,
 * em voz alta, o que ela NÃO faz:
 *
 *   > O que ele NÃO faz é medir contraste num navegador — isso é Playwright com
 *   > `getComputedStyle`, e está anotado como pendência.
 *
 * Esta spec é essa pendência. Ela não relê a fonte: ela abre a tela, escolhe o
 * tema como uma pessoa escolhe, e pergunta ao NAVEGADOR qual `filter` foi
 * aplicado — e, nos casos com arte enviada, qual COR o pixel do centro do logo
 * tem de fato. A diferença não é de rigor formal — uma classe `dark:` escrita no
 * JSX e uma classe `dark:` que o Tailwind de fato compilou para o seletor certo
 * (`@custom-variant dark (&:where([data-theme="dark"], …))`, `app/globals.css`)
 * são coisas diferentes, e só a segunda pinta pixel.
 *
 * ═══ A FRONTEIRA ═══
 *
 * A `main` tem o ramo `marcaDoProduto` (#642) — a identidade PRÓPRIA do produto,
 * um `<svg>` inline desenhado para os dois temas:
 *
 *   - logo ENVIADO por quem hospeda  → vira silhueta branca no escuro
 *   - arte do PRODUTO (`marcaDoProduto`) → NÃO recebe filtro (já serve os dois temas)
 *
 * O caso (5) é essa fronteira, e é o que mais importa: aplicar a silhueta à
 * marca do produto seria dar o remédio a quem não tem a doença — apagaria as
 * cores da identidade — e violaria a condição com que o dono aprovou a mudança
 * ("desde que não quebre o visual que já existe e está consolidado há meses").
 * O que se mede é a ausência de filtro E de fundo claro em toda a cadeia.
 *
 * ═══ UMA SEGUNDA FRONTEIRA, ABERTA PELO REDESIGN DA CASCA DE ACESSO ═══
 *
 * O caso (3) media a TELA DE ENTRADA nos dois temas e exigia moldura no
 * escuro — igual à barra lateral. O redesign da casca de acesso (referência
 * OuTree, identidade Scalium) tirou essa moldura de lá, e de propósito: ver o
 * cabeçalho de `app/(public)/layout.tsx` e de
 * `tests/unit/logo-nao-some-no-tema-escuro.test.ts`. Duas razões, as duas já
 * escritas nesses dois lugares e só resumidas aqui:
 *
 *   1. a marca instalada é hoje um traço VERMELHO sobre TRANSPARENTE — e
 *      vermelho sobre o fundo escuro da casca lê bem sem moldura nenhuma;
 *   2. a casca força `data-theme="dark"` SEMPRE (a identidade é escura por
 *      doutrina), então qualquer tratamento condicional ao tema deixaria de ser
 *      condicional ao tema salvo do visitante — e uma variante BRANCA da marca
 *      configurada por engano voltaria a desenhar um retângulo em branco
 *      dentro dela, sem nada visível, na PRIMEIRA tela que um cliente em
 *      potencial abre.
 *
 * O caso (3) mede que a fachada continua SEM moldura em qualquer tema salvo, e
 * que o `data-theme` que vale para os TOKENS dela (não o do `<html>`, que ainda
 * segue a escolha salva — é outro atributo, numa árvore diferente) é sempre
 * `"dark"`. Ele segue como estava.
 *
 * ═══ A CONDIÇÃO DO DONO É MENSURÁVEL, E O CASO (6) A MEDE ═══
 *
 * "Não quebrar o que já existe" tem um sentido geométrico exato para quem NÃO
 * enviou logo: o cabeçalho da barra lateral (`h-14`, 56px) tem de ocupar o MESMO
 * retângulo nos dois temas, e a marca do produto dentro dele também. O caso (6)
 * mede `getBoundingClientRect` nos dois temas e exige igualdade — e grava os
 * números em `evidence/` para que a comparação com um build anterior seja
 * aritmética, não impressão.
 *
 * ═══ A LOGO É O CONTROLE DE RECOLHER, E O CASO (7) A MEDE ═══
 *
 * O cabeçalho da barra contém um `<button>` ("Recolher sidebar" / "Expandir
 * sidebar", `aria-expanded`) que embrulha a marca: clicar nela recolhe (64px) ou
 * reabre (240px) a barra, e a marca fica centralizada nos dois estados. O botão
 * "Recolher" do rodapé deixou de existir.
 *
 * ═══ AS TRÊS SUPERFÍCIES ═══
 *
 * A silhueta vale em duas superfícies que desenham o logo do operador, e
 * consertar uma só devolveria o defeito na outra; a terceira (a tela de entrada)
 * é a fronteira do caso (3):
 *
 *   1. a barra lateral do app   (`components/shell/Sidebar.tsx`)   — casos 1,2,5,6,7
 *   2. a tela de entrada        (`app/(public)/layout.tsx`)        — caso 3
 *   3. a PRÉVIA da tela de marca(`components/branding/CampoDeLogo.tsx`) — caso 4
 *
 * A prévia é a que mais engana: se ela mostrar o logo cru onde o app real
 * desenha a silhueta, deixa de ser prévia — o operador aprova uma coisa na tela
 * de marca e recebe outra no produto.
 *
 * ═══ COMO O TEMA É ESCOLHIDO (e por que de dois jeitos) ═══
 *
 * Dentro de `/app/*` existe um controle de verdade — `ThemeToggle`
 * (`components/theme/theme-toggle.tsx`), dentro do `UserMenu` —, então lá o tema
 * é trocado CLICANDO, que é o caminho da pessoa.
 *
 * Em `/login` não há controle nenhum: a fachada é anterior à sessão. Lá o estado
 * é semeado em `localStorage` ANTES do primeiro byte (`addInitScript`), que é
 * exatamente o que o navegador de quem já escolheu escuro e saiu da conta faz —
 * `THEME_INIT_SCRIPT` (`app/layout.tsx:122`) lê `deskcomm-theme` no `<head>`.
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

import { test, expect, type Page, type Locator } from "@playwright/test";

import { generateTotp, msUntilNextTotpWindow } from "./utils/totp";

const CREDS_PATH = path.join(process.cwd(), ".e2e-creds.json");
const EVIDENCIA = path.join(process.cwd(), "evidence", "logo-moldura-tema-escuro");

interface E2ECreds {
  password: string;
  org_id: string;
  users: Record<string, { id: string; email: string; role: string }>;
  admin_totp?: { factor_id: string; secret: string };
  dono_totp?: { factor_id: string; secret: string };
}

function loadCreds(): E2ECreds {
  const precisaSemear = (): boolean => {
    if (!fs.existsSync(CREDS_PATH)) return true;
    const c = JSON.parse(fs.readFileSync(CREDS_PATH, "utf8")) as E2ECreds;
    return !c.users?.dono || !c.dono_totp?.secret || !c.org_id;
  };
  if (precisaSemear()) {
    execFileSync("npx", ["tsx", "scripts/seed-e2e-credentials.ts"], { stdio: "inherit" });
  }
  // Promove `dono` a platform admin (e revoga a do `admin`) — idempotente. Sem
  // isto `/admin/marca` responde 403 e a spec mede a tela de recusa.
  execFileSync("npx", ["tsx", "scripts/seed-e2e-system-update.ts"], { stdio: "inherit" });
  return JSON.parse(fs.readFileSync(CREDS_PATH, "utf8")) as E2ECreds;
}

const creds = loadCreds();

// ── Um PNG de verdade, montado byte a byte ──────────────────────────────────
//
// Mesma construção de `marca-logo.spec.ts`, e pelo mesmo motivo: um base64
// colado no meio da spec é um blob que ninguém consegue auditar. A COR importa
// aqui — azul-marinho é a arte do relato original (o logo que sumia), e é
// justamente o pior caso contra `#1d1c17`.

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(tipo: string, dados: Buffer): Buffer {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "latin1"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function pngSolido(lado: number, cor: [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  const linhas: Buffer[] = [];
  for (let y = 0; y < lado; y++) {
    const linha = Buffer.alloc(1 + lado * 3);
    for (let x = 0; x < lado; x++) {
      linha[1 + x * 3] = cor[0];
      linha[2 + x * 3] = cor[1];
      linha[3 + x * 3] = cor[2];
    }
    linhas.push(linha);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(linhas))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Azul-marinho: a arte do relato — invisível contra `#1d1c17` sem a moldura. */
const PNG_AZUL_MARINHO = pngSolido(64, [16, 24, 64]);

// ── Medição ─────────────────────────────────────────────────────────────────

interface Caixa {
  readonly x: number;
  readonly y: number;
  readonly largura: number;
  readonly altura: number;
}

interface Moldura {
  /** A tag do elemento que embrulha o logo — `div` com a moldura, outra coisa sem. */
  readonly tagDoPai: string;
  readonly classeDoPai: string;
  /** `getComputedStyle().backgroundColor` do pai — o que o NAVEGADOR pintou. */
  readonly fundo: string;
  /** [topo, direita, baixo, esquerda], em px. */
  readonly padding: readonly number[];
  readonly sombra: string;
  readonly raio: string;
  readonly caixaDoPai: Caixa;
  readonly caixaDoLogo: Caixa;
}

const px = (s: string): number => Number.parseFloat(s) || 0;

/**
 * Mede o elemento que EMBRULHA o logo — o pai direto, seja ele qual for.
 *
 * O seletor é deliberadamente cego à classe da moldura. Perguntar por
 * `.dark\:bg-white` acharia o elemento pela classe que se quer provar, e passaria
 * verde num DOM onde a moldura existe mas não embrulha nada (a sabotagem do
 * "chip irmão auto-fechado" que derrubou a primeira versão da cerca unitária).
 * Partindo do `<img>` e subindo um nível, o que se mede é o que de fato está
 * atrás do logo — se a moldura for movida para um irmão, o pai medido passa a
 * ser outro e o fundo volta a ser transparente.
 */
async function medirMoldura(logo: Locator): Promise<Moldura> {
  await expect(logo).toBeVisible({ timeout: 15_000 });
  const bruto = await logo.evaluate((el) => {
    const pai = el.parentElement as HTMLElement;
    const cs = getComputedStyle(pai);
    const rp = pai.getBoundingClientRect();
    const rl = el.getBoundingClientRect();
    return {
      tagDoPai: pai.tagName.toLowerCase(),
      classeDoPai: typeof pai.className === "string" ? pai.className : "",
      fundo: cs.backgroundColor,
      padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft],
      sombra: cs.boxShadow,
      raio: cs.borderRadius,
      caixaDoPai: { x: rp.x, y: rp.y, largura: rp.width, altura: rp.height },
      caixaDoLogo: { x: rl.x, y: rl.y, largura: rl.width, altura: rl.height },
    };
  });
  return { ...bruto, padding: bruto.padding.map(px) };
}

/** `rgb(r,g,b)` / `rgba(r,g,b,a)` → canais + alfa. `null` quando não é cor. */
function canais(cor: string): { r: number; g: number; b: number; a: number } | null {
  const m = cor.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/);
  if (!m) return null;
  return { r: +m[1]!, g: +m[2]!, b: +m[3]!, a: m[4] === undefined ? 1 : +m[4]! };
}

/**
 * "Fundo claro" medido, não adjetivado: opaco E com os três canais altos.
 *
 * O limiar é 200/255 porque a moldura do produto é `bg-white` puro (255) e o
 * `--color-surface` escuro é `#1d1c17` (29,28,23) — não há nada entre os dois
 * que este número precise arbitrar.
 */
function fundoEClaro(cor: string): boolean {
  const c = canais(cor);
  if (!c || c.a < 0.9) return false;
  return c.r >= 200 && c.g >= 200 && c.b >= 200;
}

/** Nenhum fundo pintado: o `rgba(0, 0, 0, 0)` que o Chromium devolve. */
function fundoETransparente(cor: string): boolean {
  const c = canais(cor);
  return c !== null && c.a === 0;
}

interface Elo {
  readonly tag: string;
  readonly classe: string;
  readonly fundo: string;
  readonly filtro: string;
}

interface Silhueta {
  /** `getComputedStyle(<img>).filter` — `none` ou `brightness(0) invert(1)`. */
  readonly filtro: string;
  /** Cada ancestral entre o `<img>` (exclusive) e a raiz (exclusive). */
  readonly ancestrais: readonly Elo[];
  readonly caixaDoLogo: Caixa;
  readonly caixaDaRaiz: Caixa;
}

/**
 * Mede o que o NAVEGADOR aplicou ao logo: o `filter` do próprio `<img>` e a
 * cadeia de ancestrais até `raiz` (um seletor: `aside` na barra, o
 * `[data-previa-do-logo]` na prévia). A raiz fica de fora da cadeia de
 * propósito: é ela que carrega o fundo da superfície (`bg-card`, ou a cor
 * simulada da caixa), e esse fundo é o adversário, não o defeito.
 *
 * A cadeia inteira, e não só o pai: um fundo claro acrescentado em qualquer avô
 * pintaria igual na tela, e uma asserção sobre um nível só passaria verde ao
 * lado do defeito.
 */
async function medirSilhueta(logo: Locator, raiz: string): Promise<Silhueta> {
  await expect(logo).toBeVisible({ timeout: 15_000 });
  return logo.evaluate((el, seletor) => {
    const caixa = (e: Element) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, largura: r.width, altura: r.height };
    };
    const ancestrais: { tag: string; classe: string; fundo: string; filtro: string }[] = [];
    let no = el.parentElement;
    while (no && !no.matches(seletor)) {
      const cs = getComputedStyle(no);
      ancestrais.push({
        tag: no.tagName.toLowerCase(),
        classe: typeof no.className === "string" ? no.className : "",
        fundo: cs.backgroundColor,
        filtro: cs.filter,
      });
      no = no.parentElement;
    }
    const raizEl = el.closest(seletor) ?? document.body;
    return {
      filtro: getComputedStyle(el).filter,
      ancestrais,
      caixaDoLogo: caixa(el),
      caixaDaRaiz: caixa(raizEl),
    };
  }, raiz);
}

/** A silhueta: `brightness(0)` zera as cores e `invert(1)` faz o preto virar branco. */
function ehSilhuetaBranca(filtro: string): boolean {
  return /brightness\(0\)/.test(filtro) && /invert\(1\)/.test(filtro);
}

/**
 * A COR que o pixel do CENTRO do logo tem de fato, depois do filtro.
 *
 * `getComputedStyle().filter` prova que a regra foi compilada e casou; o pixel
 * prova que ela pintou. O screenshot do elemento vem do compositor (com filtro),
 * e é decodificado numa aba em branco do mesmo contexto — `about:blank` não tem
 * CSP nem origem que "contamine" o canvas, ao contrário de ler a `<img>`
 * cross-origin (URL do Storage) direto.
 */
async function corDoCentro(page: Page, alvo: Locator): Promise<readonly [number, number, number]> {
  const png = (await alvo.screenshot()).toString("base64");
  const aux = await page.context().newPage();
  try {
    return await aux.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
      return [d[0]!, d[1]!, d[2]!] as const;
    }, png);
  } finally {
    await aux.close();
  }
}

/** Branco de verdade: os três canais no teto (a silhueta é `invert(1)` de preto puro). */
const pixelEBranco = (c: readonly number[]): boolean => c.every((v) => v >= 240);

/** O azul-marinho de `PNG_AZUL_MARINHO` (16,24,64), com folga para gerenciamento de cor. */
const pixelEAzulMarinho = (c: readonly number[]): boolean =>
  c[0]! <= 60 && c[1]! <= 60 && c[2]! >= 30 && c[2]! <= 110;

async function temaDaPagina(page: Page): Promise<string | null> {
  return page.evaluate(() => document.documentElement.getAttribute("data-theme"));
}

/**
 * Troca o tema CLICANDO no controle que a pessoa clica.
 *
 * `ThemeToggle` cicla claro → escuro → sistema → claro. O laço clica até o
 * `data-theme` do `<html>` ser o pedido, com teto: um controle que parou de
 * funcionar tem de reprovar aqui, não consumir o timeout do caso.
 */
async function escolherTemaPelaTela(page: Page, alvo: "dark" | "light"): Promise<void> {
  const botao = page.getByRole("button", { name: /^Tema:/ });
  await expect(botao, "o controle de tema não está na tela").toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < 4; i++) {
    if ((await temaDaPagina(page)) === alvo) return;
    await botao.click();
    // O `setTheme` escreve o atributo no mesmo tick do clique; a espera curta é
    // para o repaint, não para a lógica.
    await page.waitForTimeout(150);
  }
  throw new Error(
    `o controle de tema não chegou em "${alvo}" em 4 cliques ` +
      `(data-theme=${await temaDaPagina(page)})`,
  );
}

type Escopo = "instalacao" | "organizacao";

async function loginComTotp(page: Page, email: string, secret: string): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click({ timeout: 15_000 });
  await page.waitForURL(/\/login\/mfa/);

  const digito1 = page.locator('input[aria-label="Dígito 1"]');
  const recusa = page.locator("form").getByRole("alert");

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    if (msUntilNextTotpWindow() < 3_000) await page.waitForTimeout(msUntilNextTotpWindow() + 200);
    await digito1.click({ timeout: 15_000 });
    await page.keyboard.type(generateTotp(secret), { delay: 40 });

    const desfecho = await Promise.race([
      page.waitForURL(/\/app\//, { timeout: 60_000 }).then(
        () => "entrou" as const,
        () => "sem-desfecho" as const,
      ),
      recusa.waitFor({ state: "visible", timeout: 60_000 }).then(
        () => "recusado" as const,
        () => "sem-desfecho" as const,
      ),
    ]);
    if (desfecho === "entrou") return;
    if (desfecho === "sem-desfecho") {
      throw new Error(
        `o desafio de MFA de ${email} não terminou em 60s (url=${page.url()})`,
      );
    }
    await page.waitForTimeout(msUntilNextTotpWindow() + 200);
  }
  throw new Error(`MFA falhou depois de 2 tentativas para ${email} (url=${page.url()})`);
}

async function subir(
  page: Page,
  escopo: Escopo,
  arquivo: { nome: string; mime: string; bytes: Buffer },
): Promise<void> {
  // A HIDRATAÇÃO, e não a visibilidade: o input existe no HTML do SSR antes de o
  // React atar o `onChange`, e arquivo posto nessa janela não dispara requisição
  // nenhuma. Ver o comentário homônimo em `marca-logo.spec.ts`.
  await expect(
    page.locator(`[data-campo-de-logo='${escopo}'][data-hidratado]`),
    `o campo de logo da camada "${escopo}" não hidratou`,
  ).toBeVisible({ timeout: 15_000 });
  await page.locator(`#logo-${escopo}`).setInputFiles({
    name: arquivo.nome,
    mimeType: arquivo.mime,
    buffer: arquivo.bytes,
  });
  await expect(page.getByText(/logo atualizado/i)).toBeVisible({ timeout: 15_000 });
}

async function removerLogoSeHouver(page: Page, tela: string, escopo: Escopo): Promise<void> {
  await page.goto(tela);
  const remover = page
    .locator(`[data-campo-de-logo='${escopo}']`)
    .getByRole("button", { name: /^remover$/i });
  if ((await remover.count()) === 0) return;
  await remover.click();
  await expect(page.getByText(/logo removido/i)).toBeVisible({ timeout: 15_000 });
}

function evidencia(nome: string): string {
  fs.mkdirSync(EVIDENCIA, { recursive: true });
  return path.join(EVIDENCIA, nome);
}

/** Grava o número medido ao lado do screenshot: comparação vira aritmética. */
function anotar(nome: string, dado: unknown): void {
  fs.writeFileSync(evidencia(nome), JSON.stringify(dado, null, 2) + "\n", "utf8");
}

/** O cabeçalho da barra lateral: o primeiro filho do `<aside>` (`h-14`, `border-b`). */
function cabecalhoDaBarra(page: Page): Locator {
  return page.locator("aside > div").first();
}

async function medirCaixa(alvo: Locator): Promise<Caixa> {
  await expect(alvo).toBeVisible({ timeout: 15_000 });
  return alvo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, largura: r.width, altura: r.height };
  });
}

// ── A spec ──────────────────────────────────────────────────────────────────

test.describe.configure({ mode: "serial" });

test.describe("a moldura do logo no tema escuro", () => {
  // Cada caso faz o próprio login: `mode: "serial"` encadeia ORDEM e estado do
  // BANCO, não a sessão do navegador (as fixtures `page`/`context` são de escopo
  // de teste). Ver o comentário longo em `marca-logo.spec.ts`.
  test.setTimeout(120_000);

  const secret = (): string => {
    const s = creds.dono_totp?.secret;
    expect(s, "sem `dono_totp` no .e2e-creds.json — rode seed-e2e-credentials.ts").toBeTruthy();
    return s!;
  };

  test("(1) tema ESCURO + logo ENVIADO: a barra lateral desenha a silhueta branca", async ({
    page,
  }) => {
    await loginComTotp(page, creds.users.dono!.email, secret());

    await page.goto("/admin/marca");
    await subir(page, "instalacao", {
      nome: "logo-azul-marinho.png",
      mime: "image/png",
      bytes: PNG_AZUL_MARINHO,
    });

    await page.goto("/app/inbox");
    await escolherTemaPelaTela(page, "dark");
    expect(await temaDaPagina(page), "o <html> não ficou no tema escuro").toBe("dark");

    const logo = page.locator("aside img").first();
    const m = await medirSilhueta(logo, "aside");
    const centro = await corDoCentro(page, logo);
    anotar("1-barra-escuro.json", { ...m, centro });
    await page.screenshot({ path: evidencia("1-barra-escuro.png") });

    expect(
      ehSilhuetaBranca(m.filtro),
      `o <img> do logo não virou silhueta branca no tema escuro: filter=${m.filtro} — ` +
        `um logo azul-marinho volta a sumir contra o fundo escuro da barra`,
    ).toBe(true);
    // A silhueta SUBSTITUIU a moldura: nenhum ancestral entre o logo e a barra
    // pinta fundo claro (o chip `dark:bg-white` não pode voltar em lugar nenhum).
    const comMoldura = m.ancestrais.filter((n) => fundoEClaro(n.fundo));
    expect(
      comMoldura,
      `a moldura clara voltou por trás do logo: ${JSON.stringify(comMoldura)}`,
    ).toEqual([]);
    // O pixel é a prova de que o filtro PINTOU: o PNG é azul-marinho sólido, e
    // no escuro o centro dele tem de sair branco.
    expect(
      pixelEBranco(centro),
      `o centro do logo não é branco no tema escuro: rgb(${centro.join(", ")}) — o filtro ` +
        `casou no CSS mas não pintou`,
    ).toBe(true);

    // Barra ABERTA: logo com a altura de `h-11` (44px), no meio do `<aside>`.
    expect(m.caixaDoLogo.altura, "o logo da barra aberta deixou de ter 44px de altura").toBeCloseTo(
      44,
      0,
    );
    const desvio = Math.abs(
      m.caixaDoLogo.x + m.caixaDoLogo.largura / 2 - (m.caixaDaRaiz.x + m.caixaDaRaiz.largura / 2),
    );
    expect(desvio, "o logo não está centralizado na barra aberta").toBeLessThanOrEqual(2);
  });

  test("(2) tema CLARO + logo ENVIADO: NÃO há silhueta — o filtro é `dark:`", async ({ page }) => {
    await loginComTotp(page, creds.users.dono!.email, secret());
    await page.goto("/app/inbox");
    await escolherTemaPelaTela(page, "light");
    expect(await temaDaPagina(page)).toBe("light");

    const logo = page.locator("aside img").first();
    const m = await medirSilhueta(logo, "aside");
    const centro = await corDoCentro(page, logo);
    anotar("2-barra-claro.json", { ...m, centro });
    await page.screenshot({ path: evidencia("2-barra-claro.png") });

    expect(
      m.filtro,
      `no tema claro o logo ganhou filtro (${m.filtro}) — a silhueta deveria ser só \`dark:\``,
    ).toBe("none");
    // No claro a arte fica com as cores originais e nada é pintado por trás dela.
    expect(
      pixelEAzulMarinho(centro),
      `no tema claro o centro do logo não é o azul-marinho da arte: rgb(${centro.join(", ")})`,
    ).toBe(true);
    const comFundo = m.ancestrais.filter((n) => !fundoETransparente(n.fundo));
    expect(
      comFundo,
      `no tema claro há fundo pintado por trás do logo: ${JSON.stringify(comFundo)}`,
    ).toEqual([]);
  });

  test("(3) a TELA DE ENTRADA é sempre escura e nunca desenha a moldura, em qualquer tema salvo", async ({
    browser,
  }) => {
    // Contexto novo e deslogado: é o estado de quem só recebeu o endereço. O
    // tema é semeado antes do primeiro byte, exatamente como o navegador de
    // quem já escolheu um tema e saiu da conta faz sozinho — e é justamente
    // essa escolha que a casca de acesso agora IGNORA de propósito.
    for (const temaSalvo of ["dark", "light"] as const) {
      const contexto = await browser.newContext();
      try {
        const pagina = await contexto.newPage();
        await pagina.addInitScript(
          (t) => window.localStorage.setItem("deskcomm-theme", t),
          temaSalvo,
        );
        await pagina.goto("/login");

        // O `<html data-theme>` segue a escolha salva de sempre — é o
        // `THEME_INIT_SCRIPT` do layout RAIZ, que este redesign não tocou.
        expect(
          await temaDaPagina(pagina),
          `o <html> não ficou em ${temaSalvo} — o script de tema mudou de comportamento`,
        ).toBe(temaSalvo);

        const logo = pagina.getByTestId("logo-da-fachada");
        const dataThemeDaCasca = await logo.evaluate((el) => {
          const casca = el.closest("[data-theme]") as HTMLElement | null;
          return casca?.getAttribute("data-theme") ?? null;
        });
        expect(
          dataThemeDaCasca,
          `a casca de acesso não está marcada data-theme="dark" com o tema salvo em ${temaSalvo} — ` +
            `a identidade da marca deveria ser escura sempre, independente da escolha do visitante`,
        ).toBe("dark");

        const m = await medirMoldura(logo);
        anotar(`3-fachada-${temaSalvo}.json`, m);
        await pagina.screenshot({ path: evidencia(`3-fachada-${temaSalvo}.png`) });

        expect(
          fundoETransparente(m.fundo),
          `a fachada desenhou uma moldura clara por trás do logo (fundo=${m.fundo}, tema salvo=` +
            `${temaSalvo}) — a casca de acesso não tem mais esse chip (ver o cabeçalho desta spec)`,
        ).toBe(true);
        expect(
          m.padding,
          `a fachada não pode ter folga de moldura nenhuma (tema salvo=${temaSalvo})`,
        ).toEqual([0, 0, 0, 0]);
      } finally {
        await contexto.close();
      }
    }
  });

  test("(4) a PRÉVIA da tela de marca prevê o que o app desenha", async ({ page }) => {
    await loginComTotp(page, creds.users.dono!.email, secret());
    await page.goto("/admin/marca");

    // As duas caixas convivem no MESMO tema real (o fundo é simulado por
    // `style`), então a condição lá é o rótulo da caixa — e é justamente por isso
    // que a prévia pode divergir do app sem nada gritar.
    const logoEscuro = page.locator("[data-previa-do-logo='escuro'] img");
    const logoClaro = page.locator("[data-previa-do-logo='claro'] img");
    const escura = await medirSilhueta(logoEscuro, "[data-previa-do-logo]");
    const clara = await medirSilhueta(logoClaro, "[data-previa-do-logo]");
    const centroEscuro = await corDoCentro(page, logoEscuro);
    const centroClaro = await corDoCentro(page, logoClaro);
    anotar("4-previa-escura.json", { ...escura, centro: centroEscuro });
    anotar("4-previa-clara.json", { ...clara, centro: centroClaro });
    await page.screenshot({ path: evidencia("4-previa.png"), fullPage: true });

    expect(
      ehSilhuetaBranca(escura.filtro),
      `a prévia da aparência ESCURA mostra o logo cru (filter=${escura.filtro}) — ela deixa ` +
        `de prever o que o app desenha, e o operador aprova uma coisa e recebe outra`,
    ).toBe(true);
    expect(
      pixelEBranco(centroEscuro),
      `o centro do logo na prévia ESCURA não é branco: rgb(${centroEscuro.join(", ")})`,
    ).toBe(true);
    const molduraNaPrevia = escura.ancestrais.filter((n) => fundoEClaro(n.fundo));
    expect(
      molduraNaPrevia,
      `a prévia da aparência ESCURA voltou a desenhar moldura clara: ${JSON.stringify(molduraNaPrevia)}`,
    ).toEqual([]);
    expect(
      clara.filtro,
      `a prévia da aparência CLARA ganhou filtro (${clara.filtro}) — o app não desenha isso`,
    ).toBe("none");
    expect(
      pixelEAzulMarinho(centroClaro),
      `o centro do logo na prévia CLARA não é o azul-marinho da arte: rgb(${centroClaro.join(", ")})`,
    ).toBe(true);
  });

  test("(5) A FRONTEIRA: no escuro, a marca do PRODUTO não vira silhueta nem ganha moldura", async ({
    page,
  }) => {
    await loginComTotp(page, creds.users.dono!.email, secret());
    // Tira o logo enviado: sem ele, e com o nome padrão, a barra cai no ramo
    // `marcaDoProduto` — o `<svg>` inline desenhado para os dois temas.
    await removerLogoSeHouver(page, "/admin/marca", "instalacao");

    await page.goto("/app/inbox");
    await escolherTemaPelaTela(page, "dark");
    expect(await temaDaPagina(page)).toBe("dark");

    const barra = page.locator("aside").first();
    await expect(
      barra.locator("img"),
      "ainda há um <img> na barra — o logo enviado não foi removido, e o caso mediria outra coisa",
    ).toHaveCount(0, { timeout: 15_000 });

    const marca = barra.getByRole("img", { name: "DeskcommCRM" });
    await expect(
      marca,
      "a barra não caiu no ramo `marcaDoProduto` — sem ele não há fronteira para medir",
    ).toBeVisible({ timeout: 15_000 });

    // A negação é sobre TODA a cadeia entre a marca e o `<aside>` (a própria
    // marca inclusive), e não só sobre o pai: um fundo claro ou um filtro
    // acrescentado em qualquer avô pintaria igual na tela — o `filter` de um
    // ancestral se aplica a tudo dentro dele —, e uma asserção sobre um nível só
    // passaria verde ao lado do defeito.
    const cadeia = await marca.evaluate((el) => {
      const saida: { tag: string; classe: string; fundo: string; filtro: string }[] = [];
      let no = el as HTMLElement | null;
      while (no && no.tagName.toLowerCase() !== "aside") {
        const cs = getComputedStyle(no);
        saida.push({
          tag: no.tagName.toLowerCase(),
          classe: typeof no.className === "string" ? no.className : "",
          fundo: cs.backgroundColor,
          filtro: cs.filter,
        });
        no = no.parentElement;
      }
      return saida;
    });
    anotar("5-marca-do-produto-escuro.json", cadeia);
    await page.screenshot({ path: evidencia("5-marca-do-produto-escuro.png") });

    const comFiltro = cadeia.filter((n) => n.filtro !== "none");
    expect(
      comFiltro,
      `a marca do PRODUTO recebeu filtro no tema escuro — a silhueta branca apagaria as cores ` +
        `da identidade, e quebra o visual que já existia: ${JSON.stringify(comFiltro)}`,
    ).toEqual([]);
    const comMoldura = cadeia.filter((n) => fundoEClaro(n.fundo));
    expect(
      comMoldura,
      `a marca do PRODUTO ganhou fundo claro no tema escuro — é o remédio dado a quem ` +
        `não tem a doença, e quebra o visual que já existia: ${JSON.stringify(comMoldura)}`,
    ).toEqual([]);
  });

  test("(6) A CONDIÇÃO DO DONO: sem logo enviado, o cabeçalho não muda de retângulo", async ({
    page,
  }) => {
    await loginComTotp(page, creds.users.dono!.email, secret());
    await page.goto("/app/inbox");

    // A marca do produto mora dentro do botão que recolhe a barra; medir o
    // botão é medir a marca, e ele não depende do texto acessível (que muda
    // com o estado da barra) porque é o único `<button>` do cabeçalho.
    const marca = (): Locator => cabecalhoDaBarra(page).locator("button").first();

    await escolherTemaPelaTela(page, "light");
    const claro = await medirCaixa(cabecalhoDaBarra(page));
    const marcaClara = await medirCaixa(marca());
    await page.screenshot({ path: evidencia("6-cabecalho-claro.png") });

    await escolherTemaPelaTela(page, "dark");
    const escuro = await medirCaixa(cabecalhoDaBarra(page));
    const marcaEscura = await medirCaixa(marca());
    await page.screenshot({ path: evidencia("6-cabecalho-escuro.png") });

    anotar("6-cabecalho-sem-logo.json", { claro, escuro, marcaClara, marcaEscura });

    // A igualdade é o sentido geométrico exato de "não quebra o que já existe"
    // para quem NUNCA enviou logo: a silhueta é do outro ramo, e nenhum pixel do
    // cabeçalho dessa instalação pode se mover ao trocar de tema.
    expect(
      escuro,
      `o cabeçalho da barra MUDOU de retângulo entre os temas numa instalação SEM logo ` +
        `enviado — claro=${JSON.stringify(claro)} escuro=${JSON.stringify(escuro)}`,
    ).toEqual(claro);
    expect(
      marcaEscura,
      `a marca do produto MUDOU de retângulo entre os temas — ` +
        `claro=${JSON.stringify(marcaClara)} escuro=${JSON.stringify(marcaEscura)}`,
    ).toEqual(marcaClara);
    // E ele continua sendo o `h-14` de sempre, no topo: a igualdade acima passaria
    // se os DOIS tivessem mudado junto. (O `px-2` e o `justify-center` do
    // cabeçalho não entram na régua: ela mede a caixa do cabeçalho, que ocupa a
    // barra inteira, e não o espaço interno dele.)
    expect(escuro.altura, "o cabeçalho deixou de ser `h-14` (56px)").toBe(56);
    expect(escuro.y, "o cabeçalho saiu do topo da barra").toBe(0);
  });

  test("(7) clicar na logo recolhe e reabre a barra; o botão \"Recolher\" do rodapé não existe mais", async ({
    page,
  }) => {
    await loginComTotp(page, creds.users.dono!.email, secret());
    // Logo ENVIADO de novo (o caso (5) o removeu): assim o que fica centralizado
    // nos dois estados é o `<img>`, que muda de altura — 44px aberta, 20px recolhida.
    await page.goto("/admin/marca");
    await subir(page, "instalacao", {
      nome: "logo-azul-marinho.png",
      mime: "image/png",
      bytes: PNG_AZUL_MARINHO,
    });
    await page.goto("/app/inbox");

    const barra = page.locator("aside").first();
    const logo = barra.locator("img").first();
    const largura = async (): Promise<number> => Math.round((await medirCaixa(barra)).largura);
    const desvioDeCentro = async (): Promise<number> => {
      const l = await medirCaixa(logo);
      const b = await medirCaixa(barra);
      return Math.abs(l.x + l.largura / 2 - (b.x + b.largura / 2));
    };

    try {
      // Estado de partida: aberta (o cookie de sidebar não persiste entre contextos).
      await expect.poll(largura, { message: "a barra não começou aberta (240px)" }).toBe(240);
      await expect(
        page.getByRole("button", { name: "Expandir sidebar" }),
        "a barra começou recolhida",
      ).toHaveCount(0);
      // O botão "Recolher" do rodapé foi REMOVIDO: a logo é o único controle.
      await expect(
        barra.getByText("Recolher", { exact: true }),
        "voltou um texto \"Recolher\" na barra (o botão do rodapé)",
      ).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Recolher$/ })).toHaveCount(0);
      expect(await desvioDeCentro(), "logo fora do centro com a barra aberta").toBeLessThanOrEqual(2);

      // 1º clique: recolhe.
      const recolher = page.getByRole("button", { name: "Recolher sidebar" });
      await expect(recolher).toHaveAttribute("aria-expanded", "true");
      await recolher.click();
      await expect.poll(largura, { message: "a barra não chegou a ~64px" }).toBe(64);
      await expect(logo, "o logo sumiu com a barra recolhida").toBeVisible();
      await expect
        .poll(desvioDeCentro, { message: "o logo não ficou centralizado na barra recolhida" })
        .toBeLessThanOrEqual(2);
      await page.screenshot({ path: evidencia("7-recolhida.png") });

      // 2º clique, no MESMO controle (agora "Expandir sidebar"): reabre.
      const expandir = page.getByRole("button", { name: "Expandir sidebar" });
      await expect(expandir).toHaveAttribute("aria-expanded", "false");
      await expandir.click();
      await expect.poll(largura, { message: "a barra não voltou a ~240px" }).toBe(240);
      await expect(logo).toBeVisible();
      await expect
        .poll(desvioDeCentro, { message: "o logo não ficou centralizado na barra reaberta" })
        .toBeLessThanOrEqual(2);
      await expect(page.getByRole("button", { name: "Recolher sidebar" })).toBeVisible();
      await page.screenshot({ path: evidencia("7-reaberta.png") });
    } finally {
      // O estado da barra vai para um cookie: se o caso estourou recolhido, o
      // que rodar depois (na ordem `serial`) mediria uma barra de 64px.
      const expandir = page.getByRole("button", { name: "Expandir sidebar" });
      if (await expandir.isVisible().catch(() => false)) await expandir.click().catch(() => {});
    }
  });

  /**
   * A restauração. Num `afterAll` porque ele roda mesmo quando um caso estoura —
   * medido: com A→B(estouro)→C, a ordem observada é ["A","B","afterAll"], ou
   * seja o hook rodou e o caso seguinte não. Deixar a limpeza num caso final a
   * transformaria em refém do caso anterior.
   */
  test.afterAll(async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const pagina = await contexto.newPage();
      await loginComTotp(pagina, creds.users.dono!.email, secret());
      await removerLogoSeHouver(pagina, "/admin/marca", "instalacao");
    } finally {
      await contexto.close();
    }
  });
});
