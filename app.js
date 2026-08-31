const form = document.querySelector('#lead-form');
const status = document.querySelector('.form-status');
const track = (event) => {
  window.dataLayer?.push({ event });
  window.gtag?.('event', event);
};

track('view_landing_page');
document.querySelectorAll('.track-cta').forEach((link) => link.addEventListener('click', () => track('click_validation_cta')));
document.querySelector('#whatsapp-link').addEventListener('click', () => track('whatsapp_clicked'));
document.querySelector('#year').textContent = new Date().getFullYear();

const whatsapp = form.elements.whatsapp;
whatsapp.addEventListener('input', (event) => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
  event.target.value = digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
});

const pain = form.elements.pain;
pain.addEventListener('input', () => document.querySelector('.character-count').textContent = `${pain.value.length}/500`);
form.addEventListener('focusin', () => track('form_started'), { once: true });

function fieldError(field, message) {
  const messageElement = field.closest('label').querySelector('small');
  field.setAttribute('aria-invalid', Boolean(message));
  messageElement.textContent = message || (field.name === 'pain' ? `${pain.value.length}/500` : '');
}

function validate() {
  let valid = true;
  ['name', 'role', 'city', 'operation_size'].forEach((name) => {
    const field = form.elements[name];
    const message = field.value.trim() ? '' : 'Este campo é obrigatório.';
    fieldError(field, message); valid &&= !message;
  });
  const digits = whatsapp.value.replace(/\D/g, '');
  const whatsappMessage = /^\d{10,11}$/.test(digits) ? '' : 'Informe um WhatsApp válido com DDD.';
  fieldError(whatsapp, whatsappMessage); valid &&= !whatsappMessage;
  const consentError = document.querySelector('.consent-error');
  consentError.textContent = form.elements.consent.checked ? '' : 'Você precisa autorizar o contato para continuar.';
  return valid && !consentError.textContent;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.className = 'form-status';
  if (!validate()) { status.textContent = 'Revise os campos indicados para enviar.'; status.classList.add('error'); return; }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = 'Enviando…'; status.textContent = 'Enviando suas informações…';
  const params = new URLSearchParams(window.location.search);
  const payload = Object.fromEntries(new FormData(form));
  Object.assign(payload, {
    consent_at: new Date().toISOString(),
    source_url: window.location.href,
    utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || ''
  });
  try {
    const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error();
    form.reset(); document.querySelector('.character-count').textContent = '0/500'; track('form_submitted');
    status.textContent = 'Obrigado pelo interesse. Vamos analisar as informações e, se houver aderência com a validação inicial, entraremos em contato pelo WhatsApp.';
    status.classList.add('success');
  } catch {
    status.textContent = 'Não foi possível enviar agora. Tente novamente em alguns instantes ou fale conosco pelo WhatsApp.';
    status.classList.add('error');
  } finally { button.disabled = false; button.innerHTML = 'Solicitar conversa inicial <span aria-hidden="true">→</span>'; }
});

const dialog = document.querySelector('#privacy-dialog');
document.querySelector('#privacy-link').addEventListener('click', (event) => { event.preventDefault(); dialog.showModal(); });
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
