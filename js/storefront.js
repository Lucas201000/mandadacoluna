import { PROJECT, MODULE_PRODUCTS, trackEvent } from './config.js';

const root = document.querySelector('#storefront-app');
const selectedSlug = new URLSearchParams(location.search).get('produto');
const products = Object.values(MODULE_PRODUCTS);
const selected = products.find(product => product.slug === selectedSlug);

function trialAction(product) {
  const label = `Acessar o Módulo ${product.moduleId}`;

  return `<a class="btn" href="${product.trialUrl}" target="_blank" rel="noopener" data-trial="${product.slug}">${label}</a>`;
}

function detailsAction(product) {
  return `<button class="btn ghost" type="button" data-details="${product.slug}" aria-expanded="false">Como este módulo pode ajudar</button>`;
}

trackEvent('storefront_viewed', { product: selectedSlug || null });

root.innerHTML = `
  <a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a>
  <header class="hero">
    <p class="question-meta">VITRINE EDUCATIVA</p>
    <h1>${selected ? 'Recomendado para o seu resultado' : 'Conheça os módulos educativos'}</h1>
    <p class="lead">Assista à aula experimental na plataforma. Os materiais são educativos e não substituem avaliação, diagnóstico ou tratamento profissional.</p>
  </header>
  <section style="margin-top:24px">
    <h2>${selected ? 'Seu módulo em destaque' : 'Todos os módulos'}</h2>
    <div class="store-grid" style="margin-top:16px">
      ${products.map(product => `
        <article class="card store-card ${product.slug === selectedSlug ? 'recommended' : ''}" style="--product-color:${product.color}" id="${product.slug}">
          ${product.slug === selectedSlug ? '<span class="badge">RECOMENDADO PARA O SEU RESULTADO</span>' : ''}
          <img class="module-cover" src="${product.image}" alt="Capa do ${product.name}" loading="lazy" onerror="this.classList.add('module-cover--missing');this.alt='Capa do módulo indisponível';">
          <h3 style="margin-top:16px">${product.name}</h3>
          <p class="small">${product.shortDescription}</p>
          <p class="small"><strong>Aula experimental disponível</strong></p>
          <div class="actions">${trialAction(product)}${detailsAction(product)}</div>
          <div class="module-details hidden" id="detalhes-${product.slug}"><p class="small">${product.shortDescription}</p><p class="small">O conteúdo foi pensado como apoio educativo e não substitui avaliação profissional.</p></div>
        </article>`).join('')}
    </div>
  </section>
  <section class="card" style="margin-top:24px">
    <h2>Dúvidas frequentes</h2>
    <h3>Posso conhecer antes de continuar?</h3>
    <p class="small">Sim. Cada módulo possui uma aula experimental na plataforma. As informações de continuidade aparecem depois dessa aula.</p>
    <h3>Isso substitui acompanhamento profissional?</h3>
    <p class="small">Não. Todo o conteúdo tem finalidade educativa e deve ser contextualizado à sua situação por um profissional de saúde quando necessário.</p>
    <h3>Posso escolher outro módulo?</h3>
    <p class="small">Sim. Os demais módulos permanecem disponíveis para consulta.</p>
  </section>
  <footer class="footer"><a href="${PROJECT.privacyUrl}">Política de privacidade</a> · <a href="${PROJECT.termsUrl}">Termos de uso</a></footer>`;

document.querySelectorAll('[data-trial]').forEach(link => {
  link.onclick = () => trackEvent('trial_lesson_clicked', { product: link.dataset.trial });
});

document.querySelectorAll('[data-details]').forEach(button => {
  button.onclick = () => {
    const details = document.querySelector(`#detalhes-${button.dataset.details}`);
    const isOpen = !details.classList.contains('hidden');
    details.classList.toggle('hidden', isOpen);
    button.setAttribute('aria-expanded', String(!isOpen));
    button.textContent = isOpen ? 'Como este módulo pode ajudar' : 'Fechar detalhes';
  };
});

if (selected) {
  setTimeout(() => document.querySelector(`#${selected.slug}`)?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  }), 150);
}
