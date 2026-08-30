(() => {
  const form = document.querySelector('#lead-form');
  const status = document.querySelector('#form-status');
  const pain = document.querySelector('#pain');
  const count = document.querySelector('#pain-count');
  const privacyDialog = document.querySelector('#privacy-dialog');
  const whatsappMessage = 'Olá, tenho interesse na validação inicial do Rotas Inteligentes.';
  const themeOptions = ['terra', 'urbano', 'noturno'];
  const themeButtons = document.querySelectorAll('[data-theme-option]');

  document.querySelector('#year').textContent = new Date().getFullYear();

  const setTheme = (theme) => {
    const selected = themeOptions.includes(theme) ? theme : 'terra';
    document.body.dataset.theme = selected;
    themeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeOption === selected)));
    try { window.localStorage.setItem('rotas-theme', selected); } catch (_) { /* Preference remains for this visit. */ }
  };
  try { setTheme(window.localStorage.getItem('rotas-theme')); } catch (_) { setTheme('terra'); }
  themeButtons.forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.themeOption)));

  const track = (event, data = {}) => {
    if (typeof window.gtag === 'function') window.gtag('event', event, data);
    window.dispatchEvent(new CustomEvent('rotas:inteligentes:event', { detail: { event, ...data } }));
  };

  track('view_landing_page');
  document.querySelectorAll('[data-validation-cta]').forEach((cta) => cta.addEventListener('click', () => track('click_validation_cta')));
  document.querySelectorAll('[data-privacy-button]').forEach((button) => button.addEventListener('click', () => privacyDialog.showModal()));
  document.querySelector('[data-close-dialog]').addEventListener('click', () => privacyDialog.close());

  document.querySelectorAll('[data-whatsapp-button]').forEach((button) => {
    button.addEventListener('click', () => {
      // Configure the real number in the data attribute before publishing. Do not place it in source control if privacy policy requires otherwise.
      const number = document.body.dataset.whatsappNumber;
      if (!number) {
        document.querySelector('#formulario').scrollIntoView({ behavior: 'smooth' });
        status.className = 'form-status error';
        status.textContent = 'O contato por WhatsApp será disponibilizado em breve. Você pode solicitar uma conversa pelo formulário.';
        return;
      }
      track('whatsapp_clicked');
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener,noreferrer');
    });
  });

  const setError = (field, message) => {
    const wrapper = field.closest('.form-field') || field.closest('.checkbox-field')?.parentElement;
    const error = document.querySelector(`#${field.name}-error`);
    if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
    if (error) error.textContent = message;
    field.setAttribute('aria-invalid', Boolean(message));
  };

  const cleanPhone = (value) => value.replace(/\D/g, '');
  const formatPhone = (value) => {
    const digits = cleanPhone(value).slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };
  const whatsapp = document.querySelector('#whatsapp');
  whatsapp.addEventListener('input', () => { whatsapp.value = formatPhone(whatsapp.value); });
  pain.addEventListener('input', () => { count.textContent = `${pain.value.length} de 500 caracteres`; });

  let started = false;
  form.addEventListener('focusin', () => { if (!started) { started = true; track('form_started'); } }, { once: true });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    const fields = ['name', 'role', 'city', 'operation_size', 'whatsapp'];
    let valid = true;
    fields.forEach((name) => {
      const field = form.elements[name];
      const message = !field.value.trim() ? 'Preencha este campo para continuar.' : '';
      setError(field, message); if (message) valid = false;
    });
    if (cleanPhone(whatsapp.value).length < 10) { setError(whatsapp, 'Informe um WhatsApp válido com DDD.'); valid = false; }
    const consent = form.elements.consent;
    setError(consent, consent.checked ? '' : 'É necessário autorizar o contato para enviar o formulário.');
    if (!consent.checked) valid = false;
    if (!valid) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    if (form.elements.company.value) return;

    const utm = new URLSearchParams(window.location.search);
    const payload = {
      name: form.elements.name.value.trim(), role: form.elements.role.value, city: form.elements.city.value.trim(),
      operation_size: form.elements.operation_size.value, whatsapp: cleanPhone(whatsapp.value), pain: pain.value.trim(),
      consent_at: new Date().toISOString(), source_url: window.location.href, status: 'novo',
      utm_source: utm.get('utm_source') || '', utm_medium: utm.get('utm_medium') || '', utm_campaign: utm.get('utm_campaign') || ''
    };

    form.classList.add('is-loading');
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('submission failed');
      form.reset(); count.textContent = '0 de 500 caracteres';
      status.className = 'form-status success';
      status.textContent = 'Obrigado pelo interesse. Vamos analisar as informações e, se houver aderência com a validação inicial, entraremos em contato pelo WhatsApp.';
      track('form_submitted');
    } catch (_) {
      status.className = 'form-status error';
      status.textContent = 'Não foi possível enviar agora. Tente novamente em alguns instantes.';
    } finally { form.classList.remove('is-loading'); }
  });
})();
