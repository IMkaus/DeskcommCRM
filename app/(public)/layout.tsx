import { CascaDeAcesso } from "@/components/auth/casca-de-acesso/CascaDeAcesso";
import { LogotipoDoProduto } from "@/components/branding/MarcaDoProduto";
import { marcaEhADoProduto } from "@/lib/branding";
import { cssDaMarca, ESCOPO_DA_CASCA_ESCURA } from "@/lib/branding/css";
import { marcaResolvidaDaInstalacao } from "@/lib/branding/instalacao-resolvida";
import { marcaDaSaida } from "@/lib/branding/saida";
import { createClient } from "@/lib/supabase/server";
import { IdiomaProvider } from "@/lib/i18n/IdiomaProvider";

/**
 * A casca das telas de acesso — login, cadastro, recuperação, MFA.
 *
 * Redesign (referência OuTree, identidade visual Scalium): o antigo card
 * central de uma coluna virou `CascaDeAcesso`, um shell de duas colunas que
 * anima a troca de lado entre `/login` e `/signup` — ver o cabeçalho daquele
 * componente. Este arquivo continua resolvendo SÓ o que é dele: marca e
 * idioma. A estrutura visual (painéis, cor, animação) é toda de
 * `components/auth/casca-de-acesso/**`.
 *
 * SEM Archivo via `next/font/google` aqui — foi tentado e revertido: o
 * carregador de fonte do Next é uma transformação do compilador (SWC dentro do
 * pipeline do `next build`/`next dev`), não uma função comum, e chamá-la fora
 * desse pipeline — que é exatamente o que `tests/unit/marca-na-fachada-de-
 * acesso.test.tsx` faz ao importar e invocar este layout direto pelo Vitest —
 * ou tenta buscar a fonte pela rede de verdade (tempo de teste esgotado, sem
 * internet no sandbox) ou lança `TypeError: Archivo is not a function`,
 * medido nas duas formas ao vivo. A exibição usa o `--font-sans` do produto
 * (Atkinson), só com peso/tracking mais firmes — a saída que o próprio pedido
 * do redesign já previa ("otherwise keep the app fonts").
 *
 * ── Por que o LOGO mora aqui, e não em `login/page.tsx` ───────────────────────
 *
 * São seis telas no grupo `(public)`, e todas são "antes de entrar": quem instala
 * o produto para clientes mostra a marca dele exatamente aí. Um `<img>` por
 * página seriam seis cópias que divergem na primeira vez que alguém mexer numa
 * só — e a que ficaria para trás é sempre a que ninguém abre (recuperação de
 * senha, cadastro de MFA), que é justamente onde o cliente do revendedor
 * aparece sozinho e sem contexto.
 *
 * ── Por que `marcaDaSaida(null)` ──────────────────────────────────────────────
 *
 * Aqui não existe organização resolvida: `null` é a declaração disso, e a pilha
 * resultante é a mesma do layout raiz (banco acima, `.env` embaixo). Montar a
 * pilha à mão nesta tela faria a fachada anunciar uma precedência que o resto do
 * produto não usa. E `marcaDaSaida` NUNCA lança (ver o cabeçalho dela): uma cor
 * ou um logo mal gravados não podem derrubar a única tela por onde se entra para
 * corrigi-los.
 *
 * Sem logo configurado E com o nome padrão, a fachada mostra o logotipo do
 * PRODUTO (`components/branding/MarcaDoProduto.tsx`) — inline, sem `<img>`,
 * para que `tests/e2e/marca-logo.spec.ts` continue medindo "a fachada está sem
 * `<img>`" como "sem logo do revendedor".
 *
 * O NOME continua saindo de `branding()` dentro de cada página — não é descuido,
 * está medido em `tests/e2e/icone-da-marca.spec.ts:64-77`: aquela spec cruza duas
 * resoluções independentes (o título da aba, que lê o banco, contra o texto sob
 * o "Entrar", que lê o `.env`). Trocar o texto para este mesmo resolvedor
 * deixaria a spec verde medindo nada.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const marca = await marcaDaSaida(null);
  // A maioria destas telas roda ANTES do login (não há usuário nenhum), mas
  // duas — `/login/mfa` e, em parte, `/login/recovery` — rodam com uma sessão
  // parcial já criada (primeiro fator verificado, segundo pendente). Onde há
  // sessão, o idioma salvo no perfil vale; sem ela, `IdiomaProvider` já cai no
  // padrão pt-BR sozinho (ver o cabeçalho do provider) — nunca lança.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = (user?.user_metadata?.locale as string | undefined) ?? null;

  const logo = marca.logoUrl ? (
    // <img> em vez de next/image pelo mesmo motivo da barra lateral: a URL é de
    // quem hospeda e o `next/image` exige allowlist de domínios fechada em
    // BUILD — a imagem pré-buildada do self-host recusaria o domínio do
    // operador. Largura fixa (é uma marca larga: 1121×568) e altura livre, para
    // não distorcer arte de proporção desconhecida.
    //
    // O `alt` é o nome DESTA resolução (`marca.nome`), e não o de `branding()`:
    // é a legenda da imagem que está ali, e nomeá-la com a marca de outra fonte
    // descreveria uma marca que não é a do logo.
    //
    // O `data-testid` é lido por `tests/e2e/marca-logo.spec.ts`, que prova que o
    // logo da EMPRESA não vaza para cá. Sem ele a spec caía na "primeira <img>
    // da página", e uma asserção de negação com seletor largo passa sozinha
    // assim que outra imagem entra na tela.
    //
    // SEM chip de fundo: a versão anterior embrulhava o logo num chip claro
    // ligado ao tema (ver o histórico em
    // tests/unit/logo-nao-some-no-tema-escuro.test.ts), pensado para dar
    // contraste a um logo escuro sobre superfície escura — mas com a marca
    // atual (traço vermelho sobre fundo transparente) esse chip produzia o
    // defeito oposto: um logo BRANCO configurado por engano ficava
    // branco-sobre-branco dentro dele, e a tela mostrava só um retângulo em
    // branco. Vermelho sobre o fundo escuro desta casca lê bem sozinho — sem
    // chip, sem esse modo de falha.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-testid="logo-da-fachada"
      src={marca.logoUrl}
      alt={marca.nome}
      className="h-auto w-40 object-contain sm:w-44 [@media(max-height:780px)]:w-32"
    />
  ) : marcaEhADoProduto({ name: marca.nome, logoUrl: null }) ? (
    <LogotipoDoProduto nome={marca.nome} className="h-12 w-auto" />
  ) : null;

  // A casca é sempre escura e se marca num `<div>`, não no `<html>`: sem este
  // bloco, o `[data-theme="dark"]` do `globals.css` repinta os botões com o
  // accent de fábrica por cima da marca. Ver `ESCOPO_DA_CASCA_ESCURA`. O motivo
  // de uma cor recusada já é registrado por `EstiloDaMarca`, no layout raiz.
  const { marca: marcaCompleta } = await marcaResolvidaDaInstalacao();
  const cssDaCasca = cssDaMarca(marcaCompleta.cor, ESCOPO_DA_CASCA_ESCURA).css;

  return (
    <IdiomaProvider locale={locale}>
      {cssDaCasca && (
        <style id="marca-casca-de-acesso" dangerouslySetInnerHTML={{ __html: cssDaCasca }} />
      )}
      <CascaDeAcesso logo={logo}>{children}</CascaDeAcesso>
    </IdiomaProvider>
  );
}
