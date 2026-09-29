import { env } from "@/lib/env";

import { marcaDaInstalacao, type LinhaDaMarca } from "./instalacao";
import { REGUA_DO_PRODUTO } from "./regua-do-produto";
import { camadaDaInstalacao, camadaDoAmbiente, resolverMarca, type MarcaResolvida } from "./resolve";

/**
 * A pilha de camadas da marca da instalação: BANCO acima, `.env` embaixo.
 *
 * Uma função só porque `generateMetadata`, `EstiloDaMarca` e `MarcaNoNavegador`
 * (layout raiz) e a casca das telas de acesso (`app/(public)/layout.tsx`)
 * precisam da MESMA resolução — montagens separadas da pilha divergiriam, e a
 * divergência apareceria como título da aba com uma marca, cor com outra e barra
 * lateral com uma terceira.
 *
 * A leitura do banco é memoizada em `lib/branding/instalacao.ts`, então as
 * chamadas por requisição custam UMA consulta a cada TTL.
 */
export async function marcaResolvidaDaInstalacao(): Promise<{
  /** A linha crua — só `EstiloDaMarca` precisa dela, para gravar o estado. */
  readonly linha: LinhaDaMarca | null;
  readonly marca: MarcaResolvida;
}> {
  const linha = await marcaDaInstalacao();
  const marca = resolverMarca(
    [camadaDaInstalacao(linha), camadaDoAmbiente(env)],
    REGUA_DO_PRODUTO,
  );
  return { linha, marca };
}
