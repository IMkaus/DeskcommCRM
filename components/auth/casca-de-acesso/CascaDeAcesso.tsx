"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Alternador } from "./Alternador";
import { Carrossel } from "./Carrossel";
import estilo from "./casca-de-acesso.module.css";
import { LADO_DO_FORMULARIO_NO_LOGIN, ladoOposto } from "./lado";

/**
 * A casca de duas colunas das telas de acesso — login, cadastro, recuperação,
 * MFA. Vive no layout do grupo `(public)` (que persiste através da navegação
 * `/login` ↔ `/signup`, ver o cabeçalho de `app/(public)/layout.tsx`), e é
 * ela quem decide QUAL lado cada painel ocupa a cada rota, lendo só o
 * `pathname` — os campos do formulário em si continuam vindo de `children`,
 * exatamente como cada `page.tsx` já os renderizava antes deste redesign.
 *
 * Forçada **sempre escura** (`data-theme="dark"`): a identidade da marca é
 * escura por doutrina, e a tela de acesso não segue a preferência de tema do
 * visitante — ver a instrução do redesign. O atributo aqui, e não em algo
 * mais alto na árvore, é o que o `@custom-variant dark` de `app/globals.css`
 * já sabe interpretar: `:where([data-theme="dark"], [data-theme="dark"] *)`
 * casa esta subárvore inteira, então toda classe `dark:` (e, mais que isso,
 * toda variável `--color-*` sem prefixo) resolve para o valor ESCURO aqui
 * dentro, não importa o que o `<html>` diga.
 */
export function CascaDeAcesso({
  logo,
  children,
}: {
  logo: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const estaNoCadastro = pathname === "/signup";

  const ladoDoFormulario = estaNoCadastro
    ? ladoOposto(LADO_DO_FORMULARIO_NO_LOGIN)
    : LADO_DO_FORMULARIO_NO_LOGIN;
  const ladoDoCarrossel = ladoOposto(ladoDoFormulario);

  return (
    <div
      data-theme="dark"
      data-casca-de-acesso=""
      className={cn(estilo.casca, "bg-background text-foreground")}
    >
      <div className={estilo.trilha}>
        <div
          className={cn(
            estilo.painel,
            estilo.painelDeFormulario,
            ladoDoFormulario === "left" ? estilo.aEsquerda : estilo.aDireita,
          )}
        >
          {/* `my-auto` e não `justify-center`: centralizar com justify num
              contêiner menor que o conteúdo faz ele vazar para CIMA e para
              baixo por igual, e o topo (o logo) fica fora de alcance até da
              rolagem. A margem automática centraliza quando cabe e encosta no
              topo quando não cabe. */}
          <div className="flex min-h-full w-full flex-col px-6 py-12 sm:px-10 lg:px-12 xl:px-16 [@media(max-height:780px)]:py-6">
            <div className="mx-auto my-auto flex w-full max-w-sm flex-col gap-6 [@media(max-height:780px)]:gap-4">
              {logo && <div className="flex justify-center">{logo}</div>}
              <Alternador />
              <div>{children}</div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            estilo.painel,
            estilo.painelDeCarrossel,
            ladoDoCarrossel === "left" ? estilo.aEsquerda : estilo.aDireita,
          )}
        >
          <Carrossel classeDeExibicao={estilo.exibicao} />
        </div>
      </div>
    </div>
  );
}
