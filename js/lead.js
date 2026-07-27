import { MODULES, saveLead, trackEvent } from './config.js';

async function sendAssessmentEmail(result) {
  const response = await fetch('/api/send-assessment-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessmentId: result.assessmentId,
      firstName: result.user.firstName,
      email: result.user.email,
      primaryModule: MODULES[result.primaryModule]?.name || '',
      redFlagDetected: result.safety.redFlagDetected
    })
  });
  if (!response.ok) throw new Error('E-mail transacional não enviado.');
}

export function mountLeadForm(result, onSuccess) {
  const form = document.querySelector('#lead-form');
  if (!form) return;

  form.onsubmit = async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submit = form.querySelector('[type="submit"]');
    const data = {
      name: form.name.value.trim(), email: form.email.value.trim(), whatsapp: form.whatsapp.value.trim(),
      marketing: form.marketing.checked, privacy: form.privacy.checked
    };
    result.user = { ...result.user, firstName: data.name, email: data.email, whatsapp: data.whatsapp };
    submit.disabled = true;
    submit.textContent = 'Salvando com segurança...';

    try {
      await saveLead(data, result);
      trackEvent('lead_submitted');
      document.querySelector('#lead-gate').classList.add('hidden');
      onSuccess();

      const reportActions = document.querySelector('#report-actions');
      const emailStatus = document.createElement('p');
      emailStatus.className = 'small';
      emailStatus.setAttribute('role', 'status');
      emailStatus.textContent = 'Enviando a confirmação para o seu e-mail...';
      reportActions.querySelector('p')?.insertAdjacentElement('afterend', emailStatus);

      // O relatório continua disponível mesmo se a Brevo estiver temporariamente indisponível.
      sendAssessmentEmail(result)
        .then(() => {
          emailStatus.textContent = 'Enviamos uma confirmação para o seu e-mail.';
          trackEvent('assessment_email_sent');
        })
        .catch(error => {
          emailStatus.textContent = 'Seu relatório está liberado. Não foi possível enviar o e-mail agora.';
          console.warn('O resultado foi liberado, mas o e-mail não pôde ser enviado.', error);
          trackEvent('assessment_email_failed');
        });
    } catch (error) {
      console.error(error);
      const message = document.createElement('p');
      message.className = 'error';
      message.textContent = 'Não foi possível liberar o relatório agora. Verifique sua conexão e tente novamente.';
      form.append(message);
    } finally {
      submit.disabled = false;
      submit.textContent = 'Liberar relatório completo';
    }
  };
}
