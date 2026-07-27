import { PROJECT, trackEvent } from './config.js';

function addShareButton() {
  const actions = document.querySelector('#report-actions .actions');
  if (!actions || document.querySelector('#share-whatsapp')) return false;

  const button = document.createElement('button');
  button.id = 'share-whatsapp';
  button.className = 'btn ghost';
  button.type = 'button';
  button.textContent = 'Compartilhar no WhatsApp';
  button.setAttribute('aria-label', 'Compartilhar a vitrine no WhatsApp');
  button.addEventListener('click', () => {
    const text = 'Acabei de fazer a avaliação educativa da Mandala da Dor na Coluna e conheci meu perfil predominante.';
    const storefront = new URL(PROJECT.storefrontUrl, location.href).href;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${storefront}`)}`, '_blank', 'noopener');
    trackEvent('result_shared_whatsapp');
  });
  actions.append(button);
  return true;
}

if (!addShareButton()) new MutationObserver(() => addShareButton()).observe(document.body, { childList: true, subtree: true });
