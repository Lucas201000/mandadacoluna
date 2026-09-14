import { MODULES, saveLead, trackEvent } from './config.js';

// Mantém o corpo enviado à função da Vercel abaixo do limite seguro, mesmo após o Base64.
const MAX_EMAIL_PDF_BYTES = Math.floor(2.5 * 1024 * 1024);

async function sendAssessmentEmail(result, attachment = null) {
  const response = await fetch('/api/send-assessment-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessmentId: result.assessmentId,
      firstName: result.user.firstName,
      email: result.user.email,
      primaryModule: MODULES[result.primaryModule]?.name || '',
      redFlagDetected: result.safety.redFlagDetected,
      marketingConsent: Boolean(result.user.marketingConsent),
      attachment: attachment ? { name: attachment.name, content: attachment.content } : undefined
    })
  });
  const delivery = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(delivery.error || 'E-mail transacional não enviado.');
  return delivery;
}

function addEmailStatus(reportActions) {
  const emailStatus = document.createElement('p');
  emailStatus.className = 'small';
  emailStatus.setAttribute('role', 'status');
  emailStatus.setAttribute('aria-live', 'polite');
  reportActions.querySelector('p')?.insertAdjacentElement('afterend', emailStatus);
  return emailStatus;
}

function addEmailRetry(reportActions, retryDelivery) {
  const actions = reportActions.querySelector('.actions');
  if (!actions) return;

  let retry = actions.querySelector('#email-retry');
  if (!retry) {
    retry = document.createElement('button');
    retry.id = 'email-retry';
    retry.type = 'button';
    retry.className = 'btn ghost';
    retry.textContent = 'Não recebeu? Reenviar por e-mail';
    actions.append(retry);
  }

  retry.onclick = retryDelivery;
}

export function mountLeadForm(result, onSuccess, createAttachment) {
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
    result.user = { ...result.user, firstName: data.name, email: data.email, whatsapp: data.whatsapp, marketingConsent: data.marketing };
    submit.disabled = true;
    submit.textContent = 'Salvando com segurança...';

    try {
      await saveLead(data, result);
      trackEvent('lead_submitted');
      document.querySelector('#lead-gate').classList.add('hidden');
      onSuccess();

      const reportActions = document.querySelector('#report-actions');
      const emailStatus = addEmailStatus(reportActions);
      reportActions.setAttribute('aria-busy', 'true');
      emailStatus.textContent = 'Preparando uma cópia do seu relatório em PDF para enviar ao e-mail...';

      let attachment = null;
      let attachmentIssue = '';

      try {
        if (typeof createAttachment !== 'function') throw new Error('Função de PDF não disponível.');
        trackEvent('assessment_pdf_email_requested');
        attachment = await createAttachment();
        if (!attachment?.name || !attachment?.content) throw new Error('O PDF não foi preparado.');
        if (attachment.size > MAX_EMAIL_PDF_BYTES) {
          attachment = null;
          attachmentIssue = 'size';
        }
      } catch (error) {
        attachment = null;
        attachmentIssue = 'generation';
        console.warn('Não foi possível preparar a cópia em PDF para o e-mail.', error);
      }

      const deliverCopy = async (isRetry = false) => {
        try {
          if (isRetry) emailStatus.textContent = 'Enviando outra cópia do relatório para o seu e-mail...';
          const delivery = await sendAssessmentEmail(result, attachment);
          if (delivery.pdfAttached) {
            emailStatus.textContent = `O relatório em PDF foi encaminhado para ${data.email}. Pode levar alguns minutos; confira também a caixa de spam.`;
            trackEvent('assessment_pdf_emailed', { messageId: delivery.messageId || null, retry: isRetry });
          } else if (attachmentIssue === 'size') {
            emailStatus.textContent = 'A confirmação foi encaminhada para o seu e-mail. O PDF ficou disponível para baixar abaixo porque ficou grande demais para anexar.';
            trackEvent('assessment_email_sent', { attachment: 'too_large', retry: isRetry });
          } else {
            emailStatus.textContent = delivery.contactSaved
              ? 'A confirmação foi encaminhada para o seu e-mail e seu contato foi registrado. O PDF segue disponível para baixar abaixo.'
              : 'A confirmação foi encaminhada para o seu e-mail. O PDF segue disponível para baixar abaixo.';
            trackEvent('assessment_email_sent', { attachment: attachmentIssue || 'not_available', retry: isRetry });
          }
        } catch (error) {
          emailStatus.textContent = 'Seu relatório está liberado, mas não conseguimos encaminhar a cópia por e-mail agora. Use o botão abaixo para tentar novamente ou baixe o PDF.';
          console.warn('O resultado foi liberado, mas o e-mail não pôde ser enviado.', error);
          trackEvent('assessment_email_failed', { retry: isRetry });
        }
      };

      // O relatório continua disponível mesmo se a Brevo estiver temporariamente indisponível.
      try {
        await deliverCopy();
        addEmailRetry(reportActions, async event => {
          const retry = event.currentTarget;
          retry.disabled = true;
          try {
            await deliverCopy(true);
          } finally {
            retry.disabled = false;
          }
        });
      } finally {
        reportActions.removeAttribute('aria-busy');
      }
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
