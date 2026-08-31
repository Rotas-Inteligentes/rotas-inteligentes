import { createServer } from 'node:http';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 3000);
const root = process.cwd();
const types = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

const send = (response, status, body, headers = {}) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(body));
};

const readBody = (request) => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
    if (body.length > 20_000) request.destroy();
  });
  request.on('end', () => resolve(body));
  request.on('error', reject);
});

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/barra-dev') {
    response.writeHead(308, { Location: '/barra-dev/' });
    return response.end();
  }

  if (request.method === 'POST' && request.url === '/api/leads') {
    try {
      const lead = JSON.parse(await readBody(request));
      const required = ['name', 'role', 'city', 'operation_size', 'whatsapp', 'consent_at'];
      if (lead.website || required.some((field) => !lead[field])) return send(response, 400, { error: 'Dados inválidos.' });

      const record = { ...lead, status: 'novo', received_at: new Date().toISOString() };
      await mkdir(join(root, 'data'), { recursive: true });
      await appendFile(join(root, 'data', 'leads.ndjson'), `${JSON.stringify(record)}\n`);

      if (process.env.LEADS_WEBHOOK_URL) {
        const webhook = await fetch(process.env.LEADS_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record)
        });
        if (!webhook.ok) console.error('O webhook de leads respondeu com erro:', webhook.status);
      }
      return send(response, 201, { ok: true });
    } catch (error) {
      console.error(error);
      return send(response, 500, { error: 'Não foi possível registrar seu interesse agora.' });
    }
  }

  const rawPath = request.url.split('?')[0];
  const isDevVersion = rawPath === '/barra-dev/' || rawPath.startsWith('/barra-dev/');
  const relativePath = isDevVersion ? (rawPath.replace(/^\/barra-dev\/?/, '/') === '/' ? '/index.html' : rawPath.replace(/^\/barra-dev\/?/, '/')) : (rawPath === '/' ? '/index.html' : rawPath);
  const fileRoot = isDevVersion ? root : join(root, 'original', 'landing-page');
  const file = normalize(join(fileRoot, relativePath));
  if (!file.startsWith(root)) return send(response, 403, { error: 'Acesso negado.' });
  try {
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    send(response, 404, { error: 'Página não encontrada.' });
  }
});

server.listen(port, () => console.log(`Rotas Inteligentes em http://localhost:${port}`));
