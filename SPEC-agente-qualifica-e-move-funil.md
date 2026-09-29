# Spec: agente de IA que qualifica lead e move o funil, com as regras em código

Documento autossuficiente, escrito para uma IA (ou pessoa) que trabalha em **outro repositório**
e nunca viu este. Descreve um padrão que existe e está implementado no DeskcommCRM
(MIT, © 2026 Rafael Melgaço — se copiar trechos de código, mantenha o aviso de copyright).
Os nomes de arquivo no fim são só para consulta; adapte nomes e stack ao seu sistema.

## 0. Instrução para a IA que vai implementar

> Você vai implementar, no repositório em que trabalha, um agente conversacional (WhatsApp/chat)
> que qualifica leads e move o lead pelo funil sozinho. Leia esta spec inteira antes de escrever
> código. Regra central: **a IA decide o julgamento; o código decide o que é permitido e executa.**
> Não invente regras que a spec não pede e não pule as seções 6 (aceite) e 8 (armadilhas).
> Antes de começar, mapeie no SEU sistema as entidades equivalentes (seção 7, passo 1) e
> me mostre o mapeamento. Onde a spec disser "extensão proposta", isso NÃO existe na referência.

## 1. Princípio e divisão de responsabilidades

| Decisão | Quem decide | Onde |
|---|---|---|
| O lead está qualificado? Avançou de verdade? | **LLM principal** (com evidência) | prompt + ferramenta `update_lead_state` |
| Esse avanço é um movimento legal? | **Código**, determinístico | máquina de estados (seção 3.1) |
| O que a IA pode gravar e em quem | **Código** | schema estrito + identidade vinda do runtime |
| Qual etapa do funil do cliente corresponde ao passo | **Configuração** do cliente | coluna de mapeamento (3.4) |
| O card se move ou não | **Código** | sincronizador (3.4) |
| Perder um negócio (motivo) | **Humano** | a IA sinaliza, nunca escreve o motivo |
| Uma dica de estágio | Classificador barato, **só consultivo** | 3.3 |

O código **não avalia** se o lead é "qualificado": não existe regra do tipo "orçamento > X". O
critério mora no prompt do agente. O código só garante sequência, forma do dado, identidade,
escopo e rastro. (Trava dura opcional: ver 4.2.)

## 2. Fluxo de um turno

```
mensagem do lead
   ├─► [em paralelo] classificador auxiliar barato ──► dica de estágio (opcional)
   ▼
prompt = instruções do negócio + contexto do lead + estágio atual (+ dica)
   ▼
LLM principal conversa e pode chamar ferramentas:
   send_message · update_lead_state · search_knowledge · schedule_followup · request_human_handoff
   ▼ (se chamou update_lead_state com stage novo)
applyLeadStateUpdate: valida payload → valida transição → grava estado + histórico (atômico)
   ▼ (só se houve transição)
sincronizaEstagio: acha o negócio do contato → escopo → etapa com o "hint" do passo → move o card
   com trava otimista → registra atividade na timeline
   ▼
resultado do espelho: moveu | não-movimento rotulado (log ou item na caixa de entrada humana)
```

## 3. Componentes

### 3.1 Máquina de estados fixa (por contato)

Sete passos fixos, iguais para todos os clientes (não configuráveis por cliente):

```
new → contacted → qualifying → qualified → negotiating → won | lost
```

`lost` é alcançável de qualquer passo ativo; `won` e `lost` são terminais. Regressão e salto são
proibidos. Fonte única das transições:

```ts
const TRANSITIONS = {
  new: ['contacted','lost'], contacted: ['qualifying','lost'],
  qualifying: ['qualified','lost'], qualified: ['negotiating','lost'],
  negotiating: ['won','lost'], won: [], lost: [],
} as const;
```

Escolha de projeto: o estado do agente é **por contato**; o card do funil é **por negócio**. São
entidades diferentes e a ponte (3.4) resolve a diferença.

### 3.2 Ferramenta `update_lead_state` e a função que a executa

Contrato para o LLM: `{ stage?, qualification?: {budget, authority, need, timeline}, next_action?, reason? }`.
Descrição da ferramenta (essencial): "marca um avanço REAL; só o PRÓXIMO estágio válido;
`reason` = evidência curta; nunca invente avanço sem evidência".

`applyLeadStateUpdate(db, {tenantId, leadId, jobId}, rawInput)`:

1. Rejeitar chaves proibidas (`__proto__`, `constructor`, `prototype`) **explicitamente, antes do
   parse** (alguns validadores as descartam em silêncio; aqui elas devem virar erro).
2. Validar com schema **estrito** (campo extra é erro, nunca é descartado). Limites de tamanho por
   campo (ex.: 300 caracteres nos de qualificação, 500 em `next_action`/`reason`).
3. `tenantId` e `leadId` vêm **sempre do runtime** (linha do job/conversa), **nunca** do payload.
4. Ler o estágio atual (default `new`). Se `stage` é igual ao atual: **no-op idempotente** (retry
   não duplica histórico nem assusta o modelo). Se diferente e inválido: devolver um **erro de
   ensino** ao modelo, em texto claro, dizendo o estágio atual e os avanços válidos.
5. Gravar num **único statement atômico** o upsert de `lead_state` e o append em
   `lead_state_transitions` (com `from`, `to`, `reason`, `job_id`). `qualification` é mesclada com
   a anterior, não substituída.

Erros de ensino em vez de exceção são deliberados: o modelo lê o erro e corrige no mesmo turno.

Simplificação assumida na referência: o read-then-write não usa lock, porque a fila garante **uma
lane por lead** (dois turnos do mesmo lead nunca rodam em paralelo). Se seu sistema não garante
isso, use lock ou `update ... where stage = $atual`.

### 3.3 Classificador auxiliar (opcional; fase 2)

Um modelo barato, a cada turno, recebe o contexto + estágio atual e responde **uma palavra** (um
dos 7). Regras que importam:

- **Sem caminho de escrita.** Não importa nem chama `applyLeadStateUpdate`. Vale ter um teste
  estático que garanta isso.
- A saída entra no prompt como **dica**, na parte volátil do prompt (depois do prefixo cacheável),
  com texto explícito: "é só uma sugestão; VOCÊ decide; se concordar, confirme pela ferramenta".
- **Falha do auxiliar degrada para "sem dica"** (provedor fora, modelo mal configurado, saída sem
  estágio reconhecível). O turno nunca morre por causa dele. **Exceção:** estouro de orçamento de
  IA deve propagar, para acionar a passagem a um humano em vez de deixar o lead no vácuo.
- Divergência (dica X, modelo confirmou Y ≠ X) é gravada como candidato a conjunto de avaliação
  para curadoria humana. Sem dica, sem confirmação ou concordância: nada gravado.
- Custo: **uma chamada extra de LLM por turno**. Só adote depois de medir que o agente erra
  estágio sem ele.

### 3.4 Ponte para o funil do cliente

O cliente nomeia as etapas dele ("Entendendo o caso", "Quer agendar"…); o agente fala nos 7 passos.

- Adicione à tabela de etapas uma coluna **`agent_stage_hint`** (nullable) com `CHECK` limitando
  aos 7 valores, e **único por funil** (dois estágios com o mesmo hint são impossíveis no banco —
  a recusa mora na configuração, não no uso). `NULL` é legítimo (etapas sem equivalente).
- Coerência com colunas `is_won`/`is_lost` existentes por `CHECK` nos dois sentidos, para que
  agente e quadro nunca discordem sobre o mesmo lugar.
- **Nunca** mover "para a etapa mais próxima por posição": sem mapeamento, não move.

`sincronizaEstagio({orgId, contactId, passo, escopoDeFunis?})`:

1. Ler os negócios do contato. **Ler o erro do SELECT** (ver 8): banco fora ≠ "sem negócio".
2. Resolver **qual** negócio: um só resolvedor em todo o sistema. Nenhum aberto → `sem_negocio`;
   mais de um aberto → `ambiguo` (**não move nenhum**: mover o errado é pior que não mover).
3. Escopo de funil (3.5), **depois** de rotear, para não confundir "sem permissão" com "sem negócio".
4. Buscar a etapa não arquivada com `agent_stage_hint = passo`. Nenhuma → `sem_mapeamento`.
   Já está nela → `ja_esta_la`.
5. Se a etapa de destino é de **perda** → `perda_sem_motivo`, **não move**. O motivo da perda é
   vocabulário do funil do cliente e decisão humana; a IA não o escreve (nem reaproveita o motivo
   antigo de um negócio reaberto).
6. `UPDATE negocio SET etapa = destino WHERE id = X AND etapa = origem_lida` — **trava otimista**.
   Se afetou 0 linhas: `conflito_humano` (um humano moveu no meio; a decisão dele vence; **não**
   emitir atividade de algo que não aconteceu).
7. Emitir atividade na timeline com a **mesma gramática** do arrasto humano; quem agiu vai no
   campo de ator.

Rótulos de resultado, cada um dizendo a verdade sobre o que houve (`moveu`, `sem_mapeamento`,
`ja_esta_la`, `sem_negocio`, `ambiguo`, `conflito_humano`, `fora_do_escopo`, `perda_sem_motivo`,
`falha_de_escrita`, `indisponivel`). Tratamento pelo chamador:

- Estado legítimo sem ação humana (`sem_mapeamento`, `conflito_humano`): só log.
- Falta ação humana (`perda_sem_motivo`, `fora_do_escopo`) ou incidente (`falha_de_escrita`,
  `indisponivel`): abrir **item na caixa de entrada humana**, com texto próprio de cada caso,
  **deduplicado** por (tipo, referência, título) — senão nasce uma linha por mensagem do cliente.
- **Falha do espelho nunca reverte o estado do agente nem falha o turno.** O estado do agente é a
  fonte da verdade; o card é reflexo.

### 3.5 Escopo de funil (quais funis o agente pode mexer)

Função pura `podeOperarNoFunil(escopo, funilId)`: **escopo vazio = nenhum funil, nunca "todos"**;
`undefined` = chamador legado que ainda não sabe do escopo. Para ferramentas de escrita, mantenha
uma tabela declarativa "ferramenta → de onde sai o funil"; **ferramenta de escrita ausente da
tabela é recusada** (e um teste reprova escrita nova sem decisão explícita).

> **Aviso de gap na referência:** na cópia lida, `sincronizaEstagio` aceita `escopoDeFunis`, mas o
> chamador de produção do espelho **não o passa** — nesse caminho a trava não estava ativa. Não
> replique o gap: passe o escopo em todos os chamadores e teste o caminho de produção.

### 3.6 Handoff humano e follow-up

- `request_human_handoff`: o agente **avisa o lead antes** ("vou chamar alguém da equipe") e só
  então chama a ferramenta; depois dela não fala mais. Campos obrigatórios que quem assume vê:
  por que, o que já tentou, o que o cliente quer. Se ele não avisar, o sistema manda um aviso
  padrão. Instrução crítica na descrição: nunca dizer "já passei para a equipe" sem chamar a
  ferramenta no mesmo turno.
- `schedule_followup`: o agente agenda o próprio retorno (motivo, horário ISO no futuro, o que
  prometeu). Um agendamento por promessa.
- Não verifiquei na referência se chegar em `qualified` encerra a conversa da IA sozinho. Trate
  isso como decisão sua: prompt + handoff, ou regra explícita (4.2).

## 4. O que fica no prompt e o que pode virar código

### 4.1 No prompt (não em código)
Identidade e tom; as perguntas de qualificação (uma por vez); o que significa "qualificado" para
o negócio; regras de objeção; quando chamar humano; o que a IA **não** faz (ex.: diagnóstico
médico). Não repita no prompt o que o código já impõe (sequência de estágios, escopo).

### 4.2 Extensão proposta (NÃO existe na referência): trava dura de qualificação
Se "qualificado" precisa ser verificável, acrescente à máquina de estados uma tabela
`REQUIRED_FIELDS[to_stage]`, p.ex. `qualified: ['need','timeline']`, e em `applyLeadStateUpdate`
recuse a transição (com erro de ensino listando o que falta) quando `qualification` não tiver
esses campos preenchidos e não vazios. Isso torna o portão determinístico sem tirar o julgamento
da IA sobre *o conteúdo*. Marque essa parte como sua divergência da referência.

## 5. Dados (derivados das consultas do código; ajuste tipos ao seu banco)

- `lead_state`: `id`, `organization_id`, `contact_id`, `stage`, `qualification jsonb`,
  `next_action`, `next_action_seq`, `updated_at`; único `(organization_id, contact_id)`.
  `next_action_seq` só sobe quando a próxima ação é reescrita (útil se humanos autorizam a
  proposta corrente; opcional).
- `lead_state_transitions` (append-only): `organization_id`, `contact_id`, `job_id`, `from_stage`,
  `to_stage`, `reason`, timestamp.
- Etapas do funil: `agent_stage_hint text null` + os dois `CHECK`s + índice único parcial por funil
  (só hint não nulo, etapas não arquivadas).
- Se multi-tenant: toda tabela com `organization_id` e isolamento por RLS/escopo.

## 6. Critérios de aceite (escreva estes testes primeiro)

1. `contacted→qualifying` grava estado e **uma** linha de histórico com o `reason`.
2. `new→qualified` é rejeitado com mensagem que cita o estágio atual e os avanços válidos; nada gravado.
3. `qualified→qualifying` (regressão) é rejeitado.
4. Mesmo estágio: no-op, sem histórico duplicado.
5. Payload com `organization_id`/`__proto__`/campo extra é **rejeitado**, não descartado.
6. Etapa sem hint: card não move, estado do agente avança, só log, sem item de caixa de entrada.
7. Destino é etapa de perda: card não move, item de caixa criado, e nenhum motivo é escrito pela IA.
8. Humano move o card entre a leitura e a escrita: 0 linhas afetadas → `conflito_humano`, sem atividade.
9. Contato com dois negócios abertos: nenhum é movido (`ambiguo`).
10. Banco indisponível na leitura: rótulo `indisponivel`, não `sem_negocio`.
11. Falha do espelho não reverte `lead_state` e não falha o turno.
12. Item de caixa repetido para o mesmo (tipo, lead, título) não duplica.
13. Classificador com erro/lixo: turno segue sem dica; estouro de orçamento propaga.
14. Teste estático: o módulo do classificador não referencia a função de escrita.
15. Escopo: com escopo vazio nada é movido; teste que passa pelo **chamador de produção**, não só
    pela função interna.
16. Divergência dica×modelo gera candidato de revisão; concordância não gera.

## 7. Plano de aplicação

1. **Inventário:** mapeie lead/contato, negócio/card, funil, etapa, mensagem, job/fila do seu
   sistema. Decida a unidade do estado do agente (contato) e do card (negócio). Mostre ao dono.
2. Fixe os passos e as transições (3.1). Se não for vendas, renomeie os 7, mas mantenha o grafo
   linear com `lost` acessível.
3. Crie as tabelas (seção 5).
4. Implemente `applyLeadStateUpdate` + schema estrito + erros de ensino. Testes 1-5.
5. Exponha a ferramenta ao LLM, com identidade vinda do runtime.
6. Adicione `agent_stage_hint` + `CHECK`s + índice único e uma tela para o cliente mapear etapas.
7. Implemente `sincronizaEstagio` (3.4) e os rótulos; ligue o espelho **depois** da transição.
   Testes 6-12, 15.
8. Item de caixa de entrada humana com dedupe.
9. Prompt de qualificação do seu negócio (4.1) e ferramentas de handoff/follow-up (3.6).
10. Só então, se medido necessário: classificador (3.3) e a trava dura (4.2).
11. Prova ponta a ponta com **canal real** antes de chamar de pronto.

## 8. Armadilhas que a referência já pagou

- Cliente de banco que **não lança** em falha de rede (devolve `{data:null,error}`): descartar o
  erro transforma "banco fora" em "sem dados" e disfarça incidente de rotina. Leia sempre o erro.
- Rótulo reaproveitado mente. Cada não-movimento tem o seu.
- Dois resolvedores de "qual negócio deste contato" divergem no primeiro ajuste: mantenha um.
- Não invente semântica: sem mapeamento não há fallback por posição.
- Motivo de perda escrito pela IA ou herdado de perda antiga = causa que ninguém afirmou.
- Sem dedupe, a caixa de entrada vira uma linha por mensagem e enterra o que importa.
- Regra de escopo que existe na função mas não é passada pelo chamador real não protege nada.
- Frase de estado em documentação envelhece; prefira teste ou comando que responde.

## 9. Maturidade — leia antes de prometer algo a um cliente

- Na referência, essas peças têm testes unitários e roteiros de prova (nomes abaixo); **não os
  executei**. O próprio `docs/current-state.md` do projeto de origem registra que **ninguém fechou
  o ciclo completo com uma mensagem real de WhatsApp** (prova em aberto, do dono do projeto).
- O gap do escopo de funil no espelho (3.5) é real na cópia lida.
- O classificador custa uma chamada de LLM por turno.
- Qualificação médica/jurídica não pode ser decidida pela IA: os critérios vêm de um especialista e
  a avaliação final é humana.

## 10. Onde está na referência (só para consulta)

- Máquina de estados, schema e aplicação: `lib/agent-engine/agent/lead-state.ts` (`:23-43`, `:50-63`, `:172-257`)
- Definição das ferramentas do agente: `lib/agent-engine/agent/inbound-turn.ts` (`:190-330`) e execução de
  `update_lead_state` (`:3201-3265`)
- Classificador e dica: `lib/agent-engine/agent/stage-classifier.ts`; chamada em `inbound-turn.ts` (`:3756-3793`),
  divergência (`:4202-4223`)
- Espelho e rótulos: `lib/agent-engine/edge/crm/move-lead-stage.ts`
- Sincronizador, resolução de destino, trava otimista: `lib/leads/agent-stage-sync.ts` (`:92-106`, `:191-352`)
- Mapeamento etapa→passo: `supabase/migrations/20260725140000_0084_agent_stage_hint.sql`
- Escopo de funil: `lib/leads/escopo-de-funil.ts`
- Testes de referência (não executados por mim): `tests/unit/agent-stage-sync.test.ts`,
  `tests/unit/etapa-de-perda-do-agente.test.ts`, `tests/prova-ciclo-funil.ts`
