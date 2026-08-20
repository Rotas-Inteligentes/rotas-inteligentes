# Rotas Inteligentes — Arquitetura por fases

Este documento mostra a evolução da arquitetura. A regra é simples: começar com a menor infraestrutura que permite testar uma viagem real e adicionar componentes somente quando houver contrato, uso ou necessidade comprovada.

## Visão geral

```mermaid
flowchart LR
    A["Fase 1A<br/>desenvolvimento local"] --> B["Fase 1B<br/>piloto técnico gratuito"]
    B --> C["Fase 3/4<br/>cliente contratado"]
    C --> D["Fase futura<br/>escala guiada por uso"]
```

## Fase 1A — Desenvolvimento local

**Objetivo:** aprender NestJS, criar a primeira API e testar integração entre aplicativo, API e Supabase sem custo de hospedagem.

```mermaid
flowchart TB
    subgraph DEV["Computador de desenvolvimento"]
        API["API NestJS<br/>Node.js + TypeScript<br/>localhost:3000"]
        PANEL["Painel Gestor React<br/>localhost"]
        TUNNEL["Cloudflare Tunnel<br/>URL HTTPS temporária"]
        API --> TUNNEL
    end

    subgraph APPS["Celulares e navegador de teste"]
        DRIVER["App Motorista<br/>Flutter Android"]
        PASSENGER["App Passageiro<br/>Flutter Android"]
        MANAGER["Gestor no navegador"]
    end

    subgraph FREE["Serviços gratuitos"]
        SUPA["Supabase Free<br/>PostgreSQL + Auth + Realtime + Storage"]
        FCM["Firebase Cloud Messaging<br/>notificações push"]
    end

    DRIVER -->|"HTTPS temporário"| TUNNEL
    PASSENGER -->|"HTTPS temporário"| TUNNEL
    MANAGER --> PANEL
    API --> SUPA
    API --> FCM
    SUPA -->|"canal privado de localização"| PASSENGER
    SUPA -->|"canal privado de localização"| MANAGER
```

### Limites desta fase

- O computador precisa estar ligado para a API funcionar.
- A URL do tunnel é temporária; não deve ser usada em uma viagem real.
- Não existe promessa de disponibilidade nem backup automático.

## Fase 1B — Piloto técnico gratuito

**Objetivo:** realizar as primeiras viagens reais com até 2 vans, 35 passageiros e 2 rotas. Validar GPS com celular bloqueado, atualização privada, internet instável e uso real.

```mermaid
flowchart TB
    subgraph USERS["Pessoas usando o produto"]
        DRIVER["App Motorista<br/>Flutter Android"]
        PASSENGER["App Passageiro<br/>Flutter Android"]
        MANAGER["Painel Gestor<br/>navegador"]
    end

    subgraph RAILWAY["Railway — crédito de teste"]
        API["API NestJS<br/>Express adapter"]
        WEB["Build estático do painel React<br/>servido pela API"]
        API --- WEB
    end

    subgraph SUPABASE["Supabase Free"]
        AUTH["Auth<br/>usuários e sessões"]
        DB["PostgreSQL + PostGIS<br/>rotas, viagens e posições"]
        RT["Realtime<br/>Broadcast privado"]
        STORAGE["Storage<br/>arquivos mínimos"]
    end

    FCM["Firebase Cloud Messaging<br/>push"]

    DRIVER -->|"inicia/finaliza viagem<br/>envia GPS"| API
    PASSENGER -->|"consulta viagem"| API
    MANAGER -->|"gestão e acompanhamento"| API
    MANAGER --> WEB

    API --> AUTH
    API --> DB
    API --> RT
    API --> FCM
    RT -->|"posição e estado da viagem"| PASSENGER
    RT -->|"posição e estado da viagem"| MANAGER
    FCM -->|"início, atraso, proximidade"| PASSENGER
```

### Regras do piloto

- A localização só é enviada com uma viagem ativa.
- A API valida motorista, organização e viagem antes de aceitar uma posição.
- Passageiros e gestor só recebem eventos da rota/organização à qual pertencem.
- O painel e a API são projetos separados no monorepo, mas são entregues juntos no Railway para não criar custo extra.
- Enquanto não houver contrato, o Supabase Free e o crédito inicial do Railway são suficientes para teste, mas não devem ser tratados como produção comercial.

## Fase 3/4 — Cliente contratado

**Objetivo:** operar como serviço pago com uma base mínima de confiabilidade, custo conhecido e deploy controlado.

```mermaid
flowchart TB
    subgraph USERS["Cliente"]
        DRIVER["App Motorista<br/>Android"]
        PASSENGER["App Passageiro<br/>Android"]
        MANAGER["Painel Gestor<br/>computador ou tablet"]
    end

    subgraph GITHUB["GitHub"]
        REPO["Monorepo privado"]
        CI["GitHub Actions<br/>lint, testes e build"]
        REPO --> CI
    end

    subgraph RAILWAY["Railway Hobby<br/>~ US$ 5/mês"]
        API["API NestJS<br/>REST + regras de negócio"]
        WEB["Painel React estático"]
        API --- WEB
    end

    subgraph SUPABASE["Supabase Pro<br/>US$ 25/mês"]
        AUTH["Auth + RLS"]
        DB["PostgreSQL + PostGIS"]
        RT["Realtime privado"]
        STORAGE["Storage privado"]
        BACKUP["Backup diário"]
    end

    FCM["FCM<br/>push sem custo"]

    CI -->|"deploy aprovado"| RAILWAY
    DRIVER --> API
    PASSENGER --> API
    MANAGER --> WEB
    API --> AUTH
    API --> DB
    API --> RT
    API --> FCM
    DB --> BACKUP
    RT --> PASSENGER
    RT --> MANAGER
    FCM --> PASSENGER
```

### O que muda após o contrato

- Supabase Pro: projeto não fica sujeito à pausa por inatividade e passa a ter backup diário.
- Railway Hobby: API fica disponível continuamente como ambiente do produto.
- GitHub Actions começa a bloquear Pull Requests com falha e faz deploy somente após aprovação.
- Orçamento de infraestrutura inicial: aproximadamente **US$ 30/mês**, sem incluir domínio, mapas e impostos/câmbio.

## Fase futura — Escala orientada por evidência

**Objetivo:** evoluir apenas os pontos que comprovadamente precisarem de mais capacidade. Esta não é a arquitetura do MVP.

```mermaid
flowchart TB
    subgraph CLIENTS["Clientes"]
        DRIVER["Apps Motorista"]
        PASSENGER["Apps Passageiro"]
        MANAGER["Painéis Gestor"]
    end

    API["API NestJS modular"]
    DB["PostgreSQL + PostGIS"]
    RT["Realtime gerenciado"]
    QUEUE["Fila e worker<br/>notificações/tarefas assíncronas"]
    TRACKING["Serviço de telemetria<br/>somente se o volume justificar"]
    MAPS["Serviço de mapas/ETA<br/>somente se necessário"]
    OBS["Logs, erros, métricas e alertas"]
    DEVICES["Rastreador físico na van<br/>futuro"]

    DRIVER --> API
    PASSENGER --> API
    MANAGER --> API
    API --> DB
    API --> RT
    API --> QUEUE
    API --> OBS
    QUEUE --> OBS
    TRACKING --> DB
    TRACKING --> RT
    DEVICES -. "LocationProvider" .-> TRACKING
    API -. "extrair apenas se necessário" .-> TRACKING
    API -. "extrair apenas se necessário" .-> MAPS
```

### Gatilhos para extrair um serviço

| Sinal observado | Possível evolução |
|---|---|
| Grande volume de posições GPS ou retenção longa de histórico | Extrair processamento de telemetria e introduzir fila. |
| Muitas notificações e tarefas assíncronas | Criar worker separado. |
| Cálculo de ETA/rotas torna-se pesado | Isolar serviço de mapas e roteamento. |
| Muitos clientes, regiões ou exigências corporativas | Rever hospedagem, isolamento por cliente e banco. |

## O que permanece igual em todas as fases

```mermaid
flowchart LR
    DRIVER["Motorista envia GPS somente<br/>durante viagem ativa"] --> API["API valida<br/>permissão e viagem"]
    API --> DB["Salva posição atual<br/>e histórico controlado"]
    API --> RT["Publica evento privado"]
    RT --> PASSENGER["Passageiro acompanha"]
    RT --> MANAGER["Gestor acompanha"]
```

O ponto central não muda: a API controla regra de negócio e acesso; o Supabase guarda dados e entrega eventos em tempo real; aplicações mostram apenas os dados aos quais cada pessoa tem permissão.

