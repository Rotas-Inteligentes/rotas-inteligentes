# Rotas Inteligentes

Landing page de validação inicial para operações de vans universitárias.

## Rodar localmente

Requer Node.js 20 ou mais recente. Não há dependências para instalar.

```powershell
node server.mjs
```

Abra `http://localhost:3000`.

## Comparação das versões

O projeto original fica na rota `/` e o desenvolvimento desta sessão fica isolado em `/barra-dev/`. O link no cabeçalho alterna entre as duas versões; nenhum arquivo de uma versão é importado pela outra.

O diretório `original/` é um worktree local gerado a partir de `origin/master` e ignorado pelo Git principal. Se ele não existir em outra máquina, recrie-o com `git worktree add --detach original origin/master`.

## Leads e notificações

O formulário envia dados para `POST /api/leads`. O servidor grava os registros em `data/leads.ndjson` (diretório ignorado pelo Git) e define o status inicial como `novo`.

Para encaminhar cada lead a uma automação que notifique Emanuel, configure `LEADS_WEBHOOK_URL` antes de iniciar o servidor. A URL fica somente no ambiente do servidor, nunca no navegador.

```powershell
$env:LEADS_WEBHOOK_URL = "https://seu-servico-de-automacao.example/webhook"
node server.mjs
```

Em produção, use HTTPS, restrinja o acesso ao arquivo de dados e troque o armazenamento local por banco de dados/CRM antes de escalar a captação.
