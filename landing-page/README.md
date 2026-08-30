# Landing page — Rotas Inteligentes

Landing page de validação inicial, construída a partir do briefing aprovado.

## Antes de publicar

1. Configure `LEADS_WEBHOOK_URL` na plataforma de hospedagem. O endpoint em `api/leads.js` encaminha os dados de forma segura e espera uma resposta HTTP bem-sucedida do destino.
2. Defina o número real de WhatsApp no atributo `data-whatsapp-number` da tag `body`, somente com DDI e DDD (por exemplo, `5514999999999`).
3. Publique a pasta em uma plataforma que suporte rotas serverless compatíveis com `api/leads.js`; a página envia o formulário para `/api/leads`.

O formulário registra campos de UTM, URL de origem, data/hora de consentimento e status inicial `novo`. O webhook escolhido deve salvar esses dados e acionar a notificação para Emanuel Santos.
