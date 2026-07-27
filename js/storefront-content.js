import { STOREFRONT_CONTENT } from './config.js';

function mountTestimonials() {
  const footer = document.querySelector('.storefront .footer');
  if (!footer || document.querySelector('#testimonials')) return false;
  const section = document.createElement('section');
  section.id = 'testimonials';
  section.className = 'card testimonials';
  section.innerHTML = `<p class="question-meta">RELATOS</p><h2>Experiências compartilhadas</h2><p class="small">Substitua estes exemplos por depoimentos reais, autorizados e verificáveis antes de divulgar.</p><div class="testimonial-grid">${STOREFRONT_CONTENT.testimonials.map(item=>`<blockquote class="testimonial"><p>“${item.quote}”</p><footer>— ${item.author}</footer></blockquote>`).join('')}</div>`;
  footer.before(section);
  return true;
}

if (!mountTestimonials()) new MutationObserver(() => mountTestimonials()).observe(document.body, { childList: true, subtree: true });
