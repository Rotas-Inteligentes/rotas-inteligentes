/**
 * Serverless endpoint for the landing page. Configure LEADS_WEBHOOK_URL in the
 * hosting provider with a secure lead destination (CRM, automation, or database).
 * This keeps lead data and integration credentials out of the browser.
 */
export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  const body = request.body || {};
  const required = ['name', 'role', 'city', 'operation_size', 'whatsapp', 'consent_at'];
  if (required.some((key) => !String(body[key] || '').trim())) return response.status(400).json({ error: 'Invalid lead' });
  if (!/^\d{10,11}$/.test(String(body.whatsapp))) return response.status(400).json({ error: 'Invalid WhatsApp' });
  if (!process.env.LEADS_WEBHOOK_URL) return response.status(503).json({ error: 'Lead service unavailable' });

  try {
    const upstream = await fetch(process.env.LEADS_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, received_at: new Date().toISOString() })
    });
    if (!upstream.ok) throw new Error('Upstream rejected lead');
    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error('Lead submission failed', error);
    return response.status(502).json({ error: 'Lead submission failed' });
  }
}
