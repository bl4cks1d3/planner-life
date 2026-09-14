# Planner Life

Sistema operacional pessoal de IA. Este repositorio contem a primeira versao
(v0.1) descrita na visao do projeto: um nucleo local (Planner Core), um
agente pessoal de IA, uma interface web e um no de rede P2P que ja pode
rodar tanto no computador principal quanto em um Raspberry Pi.

> A IA nao e dona dos dados. O Planner Life e o sistema que possui o
> contexto. Os agentes (Claude hoje, outros runtimes amanha) sao
> componentes substituiveis.

## Estrutura

```
planner-life/
├── packages/
│   ├── shared/     # Tipos e protocolo PLP (Planner Life Protocol) compartilhados
│   ├── core/       # Planner Core: NestJS + SQLite (projetos, tarefas, memoria, eventos)
│   ├── agent/      # Personal Agent: NestJS + Claude (tool use sobre a API do core)
│   └── p2p-node/   # No de rede P2P (libp2p) - roda no PC e no Raspberry Pi
└── apps/
    └── web/        # Dashboard (Next.js) - agenda, projetos, "Planejar meu dia"
```

| Pacote | Stack | Porta padrao |
| --- | --- | --- |
| `@planner-life/core` | NestJS + `node:sqlite` | 4000 |
| `@planner-life/agent` | NestJS + Groq/Gemini/Claude (plugavel) | 4100 |
| `@planner-life/p2p-node` | libp2p (TCP + mDNS + gossipsub) | 15000 (TCP) |
| `@planner-life/web` | Next.js (App Router) | 3000 |

## Como rodar

Pre-requisitos: Node.js 22.5+ (usa `node:sqlite`, ainda experimental) e
`pnpm`.

```bash
pnpm install
cp .env.example .env
# preencha GROQ_API_KEY e/ou GEMINI_API_KEY no .env (veja a secao abaixo)
```

Build do pacote compartilhado (necessario antes de rodar core/agent):

```bash
pnpm --filter @planner-life/shared build
```

Suba os servicos (em terminais separados, ou `pnpm dev` para core+agent+web
juntos):

```bash
pnpm dev:core   # http://localhost:4000
pnpm dev:agent  # http://localhost:4100
pnpm dev:web    # http://localhost:3000
```

### Provider de IA (free tier por padrao)

O `@planner-life/agent` nao esta preso a um modelo. Ele escolhe o provider
em tempo de execucao, na seguinte ordem de prioridade (todas com free
tier, exceto a ultima):

1. **Groq** (`GROQ_API_KEY`) - modelos abertos (Llama etc.) com free tier
   generoso e latencia muito baixa. Gere uma chave em
   https://console.groq.com/keys
2. **Gemini** (`GEMINI_API_KEY`) - free tier do Google AI Studio. Gere uma
   chave em https://aistudio.google.com/apikey
3. **Anthropic/Claude** (`ANTHROPIC_API_KEY`) - pago, mantido como opcao.

Basta preencher a chave da opcao que voce quiser usar no `.env` -- o
agente detecta sozinho qual delas esta configurada. Para forcar uma opcao
especifica (por exemplo, se voce tiver mais de uma chave preenchida), use
`AGENT_PROVIDER=groq|gemini|anthropic`. Os nomes de modelo (`GROQ_MODEL`,
`GEMINI_MODEL`, `ANTHROPIC_MODEL`) tambem sao configuraveis, ja que os
catalogos de modelos gratuitos mudam com frequencia.

Para conversar com o Personal Agent direto pelo terminal (sem passar pela
web):

```bash
pnpm --filter @planner-life/agent cli
```

Para subir um no P2P (no seu PC, ou copiando o pacote `p2p-node` para um
Raspberry Pi rodando Node.js):

```bash
pnpm dev:p2p
```

Dois nos na mesma rede local se descobrem automaticamente via mDNS e passam
a trocar eventos PLP (`task.created`, `project.updated`, etc.) por
gossipsub. Isso e a base da "Rede P2P" da visao do projeto: o Planner Core
publica um evento no `PlannerEventBus` sempre que algo muda, e um bridge
futuro (a ser adicionado em `packages/core`) vai encaminhar esses eventos
para o `p2p-node` local, propagando para os outros dispositivos.

## O que ja funciona no v0.1

- [x] Planner Core com projetos, tarefas, memoria e log de eventos (SQLite local)
- [x] Personal Agent com tool-use (Groq, Gemini ou Claude -- escolhido
      automaticamente pela chave configurada) para criar/listar tarefas e
      projetos e salvar memoria, chamando a API do core
- [x] Interface web minima (dashboard com agenda do dia, projetos e botao
      "Planejar meu dia")
- [x] No P2P (libp2p) capaz de descobrir outros nos na rede local e trocar
      eventos PLP - mesmo codigo roda no PC e no Raspberry Pi

## Proximos passos

- Bridge automatico `core -> p2p-node` (hoje os eventos ficam no
  `PlannerEventBus` em processo; falta publica-los na rede P2P e persistir o
  que chega de outros nos)
- Testar o `p2p-node` de verdade em um Raspberry Pi 3 (1GB RAM) na mesma
  rede do PC
- Agentes especializados adicionais (Research, Study, Coding, CRM,
  Planning) como novos providers dentro de `@planner-life/agent`
- Calendario, integracao com GitHub/e-mail, voz
- Protocolo PLP com schema versionado e assinatura criptografica por no
  (identidade do dispositivo)

## Filosofia

Os pacotes `core`, `agent` e `p2p-node` sao deliberadamente separados: o
`core` guarda dados e regras, o `agent` e apenas um runtime de IA que fala
com o core por HTTP, e o `p2p-node` e so transporte. Trocar Claude por
outro modelo, ou trocar libp2p por outro protocolo, nao deveria exigir
tocar no `core`.
