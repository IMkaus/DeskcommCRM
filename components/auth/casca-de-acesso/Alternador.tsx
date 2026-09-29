"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";

/**
 * O par "Entrar" / "Criar conta" no topo do painel de formulário — os botões
 * de alternância que a referência do dono do produto trazia (capturas 20/21).
 * São LINKS de navegação de verdade, não abas client-side: cada clique troca
 * de rota, e é essa troca de rota que a `CascaDeAcesso` (o layout, que
 * persiste através dela) anima como o painel do formulário cruzando para o
 * outro lado.
 *
 * Só aparece nas duas telas que alternam entre si (`/login` e `/signup`) — as
 * demais do grupo (`/login/forgot`, `/login/mfa`, `/login/recovery`,
 * `/login/reset`) são passos de um fluxo em curso, não um convite a trocar de
 * intenção, e por isso ficam sem o alternador.
 */
function AlternadorInterno() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useT();

  const estaNoLogin = pathname === "/login";
  const estaNoCadastro = pathname === "/signup";
  if (!estaNoLogin && !estaNoCadastro) return null;

  // A MESMA extração de `app/(public)/login/page.tsx`: o link para o
  // cadastro carrega o convite que veio embrulhado no `next` de "Você foi
  // convidado" — preservar isso é o que o pedido do redesign exige ("os
  // botões... preservam os parâmetros ?invite=/next que os links existentes
  // já carregam"). Duplicado aqui de propósito: `lib/auth/**` está fora do
  // meu alcance nesta sessão, e a extração é um regex puro, sem estado.
  const next = searchParams.get("next");
  const conviteDoNext = next ? (/^\/team\/accept-invite\/([^/?#]+)/.exec(next)?.[1] ?? null) : null;
  const hrefCriarConta = conviteDoNext
    ? `/signup?invite=${encodeURIComponent(conviteDoNext)}`
    : "/signup";

  const base = "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-colors";
  const ativo = "bg-accent text-accent-foreground";
  const inativo = "text-muted-foreground hover:text-foreground";

  return (
    <nav
      aria-label={t("Alternar entre entrar e criar conta")}
      className="flex gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] p-1"
    >
      <Link
        href="/login"
        aria-current={estaNoLogin ? "page" : undefined}
        className={cn(base, estaNoLogin ? ativo : inativo)}
      >
        {t("Entrar")}
      </Link>
      <Link
        href={hrefCriarConta}
        aria-current={estaNoCadastro ? "page" : undefined}
        className={cn(base, estaNoCadastro ? ativo : inativo)}
      >
        {t("Criar conta")}
      </Link>
    </nav>
  );
}

/**
 * `useSearchParams()` exige fronteira de Suspense (Next.js App Router). O
 * fallback fica `null` — nas duas telas que importam o alternador aparece
 * um instante depois da hidratação, e nunca quebra o layout enquanto isso.
 */
export function Alternador() {
  return (
    <Suspense fallback={null}>
      <AlternadorInterno />
    </Suspense>
  );
}
