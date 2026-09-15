import { PRIVACY_POLICY_VERSION, saveLead, trackEvent } from './config.js';
import { saveAssessment } from './storage.js';

// Mantém o corpo enviado à função da Vercel abaixo do limite seguro, mesmo após o Base64.
const MAX_EMAIL_PDF_BYTES = Math.floor(2.5 * 1024 * 1024);

async function requestReportCode(result) {
  const response = await fetch('/api/send-assessment-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'request-report-code',
      firstName: result.user.firstName,
      email: result.user.email,
      marketingConsent: Boolean(result.user.marketingConsent),
      privacyConsent: Boolean(result.consent?.reportPrivacyAcknowledgedAt),
      sensitiveDataConsent: Boolean(result.consent?.reportSensitiveDataConsentAt)
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.verificationToken) throw new Error(payload.error || 'Código de confirmação não enviado.');
  return payload;
}

async function sendVerifiedReport(verificationToken, verificationCode, attachment = null) {
  const response = await fetch('/api/send-assessment-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send-verified-report',
      verificationToken,
      verificationCode,
      attachment: attachment ? { name: attachment.name, content: attachment.content } : undefined
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'E-mail transacional não enviado.');
  return payload;
}

function addEmailStatus(reportActions) {
  const emailStatus = document.createElement('p');
  emailStatus.className = 'small';
  emailStatus.setAttribute('role', 'status');
  emailStatus.setAttribute('aria-live', 'polite');
  reportActions.querySelector('p')?.insertAdjacentElement('afterend', emailStatus);
  return emailStatus;
}

function addEmailVerification(reportActions, onVerify, onResend) {
  let form = reportActions.querySelector('#email-verification');
  if (!form) {
    form = document.createElement('form');
    form.id = 'email-verification';
    form.className = 'form-grid';
    form.innerHTML = `
      <label class="field full">Código de confirmação
        <input required name="verification-code" inputmode="numeric" autocomplete="one-time-code" pattern="\\d{8}" maxlength="8" placeholder="Digite o código de 8 números">
      </label>
      <p class="small full">O código expira em 15 minutos e confirma que este e-mail pode receber seu relatório.</p>
      <div class="actions full">
        <button class="btn" type="submit">Confirmar e enviar relatório</button>
        <button class="btn ghost" type="button" id="email-code-resend">Reenviar código</button>
      </div>`;
    reportActions.append(form);
  }

  form.onsubmit = async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await onVerify(form.elements['verification-code'].value.trim());
    } finally {
      submit.disabled = false;
    }
  };
  form.querySelector('#email-code-resend').onclick = onResend;
  return form;
}

function addCodeRequestRetry(reportActions, onRetry) {
  const actions = reportActions.querySelector('.actions');
  if (!actions) return null;

  let retry = actions.querySelector('#email-code-request-retry');
  if (!retry) {
    retry = document.createElement('button');
    retry.id = 'email-code-request-retry';
    retry.type = 'button';
    retry.className = 'btn ghost';
    retry.textContent = 'Tentar enviar código novamente';
    actions.append(retry);
  }
  retry.onclick = onRetry;
  return retry;
}

export function mountLeadForm(result, onSuccess, createAttachment) {
  const form = document.querySelector('#lead-form');
  if (!form) return;

  form.onsubmit = async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submit = form.querySelector('[type="submit"]');
    const fields = form.elements;
    const data = {
      name: fields.name.value.trim(), email: fields.email.value.trim(), whatsapp: fields.whatsapp.value.trim(),
      marketing: fields.marketing.checked,
      privacy: fields.privacy.checked,
      sensitiveData: fields['sensitive-data'].checked
    };
    const confirmedEmail = fields['email-confirm'].value.trim();
    if (data.email.toLowerCase() !== confirmedEmail.toLowerCase()) {
      let message = form.querySelector('.submit-error');
      if (!message) {
        message = document.createElement('p');
        message.className = 'error submit-error';
        message.setAttribute('role', 'alert');
        form.append(message);
      }
      message.textContent = 'Os dois e-mails precisam ser iguais para proteger o envio do relatório.';
      fields['email-confirm'].focus();
      return;
    }
    const consentAt = new Date().toISOString();
    result.user = { ...result.user, firstName: data.name, email: data.email, whatsapp: data.whatsapp, marketingConsent: data.marketing };
    result.consent = {
      ...result.consent,
      policyVersion: PRIVACY_POLICY_VERSION,
      reportPrivacyAcknowledgedAt: data.privacy ? consentAt : null,
      reportSensitiveDataConsentAt: data.sensitiveData ? consentAt : null,
      marketingConsentAt: data.marketing ? consentAt : null
    };
    saveAssessment(result);
    submit.disabled = true;
    submit.textContent = 'Salvando com segurança...';

    try {
      document.querySelector('#lead-gate').classList.add('hidden');
      onSuccess();

      const reportActions = document.querySelector('#report-actions');
      const emailStatus = addEmailStatus(reportActions);
      reportActions.setAttribute('aria-busy', 'true');
      emailStatus.textContent = 'Enviando um código de confirmação para o seu e-mail...';

      // O PDF é preparado em segundo plano: o resultado e o download continuam liberados.
      const attachmentPromise = (async () => {
        let attachment = null;
        let issue = '';
        try {
          if (typeof createAttachment !== 'function') throw new Error('Função de PDF não disponível.');
          trackEvent('assessment_pdf_email_requested');
          attachment = await createAttachment();
          if (!attachment?.name || !attachment?.content) throw new Error('O PDF não foi preparado.');
          if (attachment.size > MAX_EMAIL_PDF_BYTES) {
            attachment = null;
            issue = 'size';
          }
        } catch (error) {
          attachment = null;
          issue = 'generation';
          console.warn('Não foi possível preparar a cópia em PDF para o e-mail.', error);
        }
        return { attachment, issue };
      })();

      let verificationToken = '';
      let verificationForm = null;
      let leadRecorded = false;

      const requestCode = async (isResend = false) => {
        if (isResend) emailStatus.textContent = 'Enviando um novo código de confirmação...';
        const verification = await requestReportCode(result);
        verificationToken = verification.verificationToken;
        emailStatus.textContent = `Enviamos um código de 8 números para ${data.email}. Ele não inclui seus relatos de saúde.`;
        const retry = reportActions.querySelector('#email-code-request-retry');
        retry?.remove();

        verificationForm = addEmailVerification(
          reportActions,
          async code => {
            emailStatus.textContent = 'Confirmando o código e encaminhando seu relatório...';
            try {
              const { attachment, issue } = await attachmentPromise;
              const delivery = await sendVerifiedReport(verificationToken, code, attachment);
              // O cadastro mínimo só é salvo depois que o servidor confirma o
              // código e encaminha a cópia ao endereço informado. Nenhuma
              // resposta de saúde vai ao banco.
              if (!leadRecorded) {
                try {
                  await saveLead(data, result);
                  leadRecorded = true;
                  trackEvent('lead_submitted');
                } catch (leadError) {
                  // A cópia já foi encaminhada ao e-mail confirmado. Não
                  // bloqueamos o usuário nem tentamos registrar o mesmo
                  // cadastro novamente sem um novo consentimento.
                  console.warn('A cópia foi enviada, mas o cadastro mínimo não pôde ser registrado.', leadError);
                  trackEvent('assessment_lead_save_failed');
                }
              }
              verificationForm.hidden = true;
              if (delivery.pdfAttached) {
                emailStatus.textContent = `O relatório em PDF foi encaminhado para ${data.email}. Pode levar alguns minutos; confira também a caixa de spam.`;
                trackEvent('assessment_pdf_emailed', { messageId: delivery.messageId || null });
              } else if (issue === 'size') {
                emailStatus.textContent = 'Seu e-mail foi confirmado. O PDF ficou disponível para baixar abaixo porque ficou grande demais para anexar.';
                trackEvent('assessment_email_sent', { attachment: 'too_large' });
              } else {
                emailStatus.textContent = delivery.contactSaved
                  ? 'Seu e-mail foi confirmado e seu contato foi registrado. O PDF continua disponível para baixar abaixo.'
                  : 'Seu e-mail foi confirmado. O PDF continua disponível para baixar abaixo.';
                trackEvent('assessment_email_sent', { attachment: issue || 'not_available' });
              }
            } catch (error) {
              const reason = String(error?.message || '');
              emailStatus.textContent = reason.includes('Código') || reason.includes('tentativas')
                ? reason
                : 'Não foi possível confirmar e encaminhar o relatório agora. Confira o código ou solicite outro.';
              console.warn('O relatório foi liberado, mas o e-mail não pôde ser confirmado.', error);
              trackEvent('assessment_email_failed', { stage: 'verification' });
            }
          },
          async event => {
            const resend = event.currentTarget;
            resend.disabled = true;
            try {
              await requestCode(true);
              verificationForm.elements['verification-code'].value = '';
              verificationForm.elements['verification-code'].focus();
            } catch (error) {
              emailStatus.textContent = 'Não foi possível enviar outro código agora. Seu relatório continua disponível para baixar aqui.';
              console.warn('Não foi possível reenviar o código de confirmação.', error);
            } finally {
              resend.disabled = false;
            }
          }
        );
      };

      // O relatório continua disponível mesmo se o e-mail estiver temporariamente indisponível.
      try {
        await requestCode();
      } catch (error) {
        emailStatus.textContent = 'Seu relatório está liberado para download. Não foi possível enviar o código de confirmação agora.';
        console.warn('Não foi possível solicitar o código de confirmação.', error);
        trackEvent('assessment_email_failed', { stage: 'request_code' });
        addCodeRequestRetry(reportActions, async event => {
          const retry = event.currentTarget;
          retry.disabled = true;
          try {
            await requestCode();
          } catch (retryError) {
            emailStatus.textContent = 'Não foi possível enviar o código agora. Tente novamente mais tarde; o download continua liberado.';
            console.warn('Não foi possível solicitar novamente o código de confirmação.', retryError);
          } finally {
            retry.disabled = false;
          }
        });
      } finally {
        reportActions.removeAttribute('aria-busy');
      }
    } catch (error) {
      console.error(error);
      let message = form.querySelector('.submit-error');
      if (!message) {
        message = document.createElement('p');
        message.className = 'error submit-error';
        message.setAttribute('role', 'alert');
        form.append(message);
      }
      message.textContent = 'Não foi possível registrar sua autorização para o relatório agora. Verifique a conexão e tente novamente.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Liberar relatório completo';
    }
  };
}
