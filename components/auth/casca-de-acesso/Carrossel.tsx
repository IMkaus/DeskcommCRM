"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Quotes } from "@phosphor-icons/react";

import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";

import { DEPOIMENTOS_DO_ACESSO } from "./depoimentos";

const INTERVALO_MS = 6000;

/**
 * `prefers-reduced-motion`, como external store — o mesmo desenho de
 * `lib/theme.tsx` (que este arquivo não pode importar: só existe fora do meu
 * alcance de edição desta sessão, mas o PADRÃO é o mesmo e vale reaplicar).
 * `useState`+`useEffect` reexecutaria o valor na hidratação; aqui não há
 * conteúdo hidratado que dependa disso (o giro automático só liga DEPOIS de
 * montado), mas o external store evita qualquer aviso de mismatch de graça.
 */
function inscrever(ouvinte: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", ouvinte);
  return () => mql.removeEventListener("change", ouvinte);
}
function lerSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function lerSnapshotDoServidor(): boolean {
  return false;
}
function usePrefereMenosMovimento(): boolean {
  return useSyncExternalStore(inscrever, lerSnapshot, lerSnapshotDoServidor);
}

/**
 * O painel de marca do carrossel — a foto de montanha com véu escuro por
 * cima, e as frases sobre o produto girando na frente.
 *
 * ── Giro automático, com as três guardas que o pedido do redesign exige ────
 *
 * ~6s por frase, pausa em hover/foco, e ZERO rotação sob `prefers-reduced-
 * motion` (a `useEffect` abaixo nem arma o `setInterval` nesse caso — não é
 * só a transição visual que desliga, o RELÓGIO todo para).
 *
 * ── Acessibilidade ──────────────────────────────────────────────────────────
 *
 * `role="region"` + `aria-roledescription` traduzido (é o padrão da WAI-ARIA
 * Authoring Practices para nomear o TIPO de widget ao leitor de tela, e por
 * isso passa por `t()` como qualquer outro texto da tela — pt-BR ouve
 * "carrossel", es ouve "carrusel"). Os pontos são botões de verdade,
 * navegáveis por teclado, com `aria-current` no ativo. E a troca de frase é
 * anunciada por uma região `aria-live="polite"` separada da pilha visual —
 * a pilha em si é decorativa (`aria-hidden` nos slides inativos), então o
 * leitor de tela não ouve as quatro frases de uma vez, só a atual, uma vez.
 */
export function Carrossel({ classeDeExibicao }: { classeDeExibicao?: string }) {
  const t = useT();
  const prefereMenosMovimento = usePrefereMenosMovimento();
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = DEPOIMENTOS_DO_ACESSO.length;

  useEffect(() => {
    if (prefereMenosMovimento || pausado || total <= 1) return;
    const id = setInterval(() => {
      setIndice((atual) => (atual + 1) % total);
    }, INTERVALO_MS);
    return () => clearInterval(id);
    // `indice` na lista de dependências não é sobra: cada troca (automática OU
    // por clique num ponto) reinicia a contagem dos 6s, para um clique manual
    // não ser "engolido" por um giro automático meio segundo depois.
  }, [prefereMenosMovimento, pausado, total, indice]);

  const atual = DEPOIMENTOS_DO_ACESSO[indice % total]!;

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-8 xl:p-12"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setPausado(false);
      }}
    >
      {/* A foto de montanha, decorativa — o texto que importa está no cartão
          de vidro abaixo, sempre sobre o véu mais escuro do gradiente. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center [filter:grayscale(0.3)_brightness(0.55)_contrast(1.05)]"
        style={{ backgroundImage: "url(/branding/acesso-montanha.webp)" }}
      />
      {/* Véu: transparente no topo (a foto aparece) até opaco na base — a
          MESMA cor de fundo do produto (`--color-bg`, via `color-mix`), nunca
          um preto cru. Cresce o suficiente para o cartão de vidro nunca
          precisar competir com céu claro atrás do texto. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-bg) 20%, transparent) 0%, color-mix(in oklab, var(--color-bg) 58%, transparent) 42%, color-mix(in oklab, var(--color-bg) 94%, transparent) 74%, var(--color-bg) 100%)",
        }}
      />

      <div
        role="region"
        aria-roledescription={t("carrossel")}
        aria-label={t("Depoimentos sobre o produto")}
        className="w-full max-w-md rounded-[28px] border border-white/[0.09] bg-white/[0.05] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <Quotes aria-hidden weight="duotone" size={32} className="text-accent" />

        <div className="relative mt-4 min-h-[9rem]">
          {DEPOIMENTOS_DO_ACESSO.map((depoimento, i) => (
            <p
              key={depoimento.texto}
              aria-hidden={i !== indice}
              className={cn(
                "absolute inset-0 text-2xl font-medium leading-snug text-foreground transition-opacity duration-700 motion-reduce:transition-none",
                i === indice ? "opacity-100" : "pointer-events-none opacity-0",
                classeDeExibicao,
              )}
            >
              {t(depoimento.texto)}
              {depoimento.autor && (
                <span className="mt-4 block text-sm font-normal text-muted-foreground">
                  {depoimento.autor}
                  {depoimento.papel ? `, ${depoimento.papel}` : ""}
                </span>
              )}
            </p>
          ))}
        </div>

        {/* Anúncio para leitor de tela — desacoplado da pilha visual acima. */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {t(atual.texto)}
        </span>

        <div className="mt-6 flex items-center gap-2">
          {DEPOIMENTOS_DO_ACESSO.map((depoimento, i) => (
            <button
              key={depoimento.texto}
              type="button"
              onClick={() => setIndice(i)}
              aria-current={i === indice}
              aria-label={`${t("Ir para o depoimento")} ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all motion-reduce:transition-none",
                i === indice ? "w-6 bg-accent" : "w-1.5 bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
