import { PROJECT, MODULE_PRODUCTS, trackEvent } from './config.js';

const root = document.querySelector('#storefront-app');
const selectedSlug = new URLSearchParams(location.search).get('produto');
const products = Object.values(MODULE_PRODUCTS);
const selected = products.find(product => product.slug === selectedSlug);
const hasTrialReady = products.some(product => product.trialUrlConfigured);

function trialAction(product) {
  const label = product.trialUrlConfigured
    ? `Assistir à Aula 1 do Módulo ${product.moduleId}`
    : `Acessar o Módulo ${product.moduleId}`;

  return `<a class="btn" href="${product.trialUrl}" target="_blank" rel="noopener" data-trial="${product.slug}">${label}</a>`;
}

trackEvent('storefront_viewed', { product: selectedSlug || null });

root.innerHTML = `
  <a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a>
  <header class="hero">
    <p class="question-meta">VITRINE EDUCATIVA</p>
    <h1>${selected ? 'Recomendado para o seu resultado' : 'Conheça os módulos educativos'}</h1>
    <p class="lead">${hasTrialReady ? 'Assista à primeira aula gratuita e, se decidir continuar, avance para o conteúdo completo do módulo.' : 'Conheça os módulos educativos e escolha o conteúdo mais adequado para o seu momento.'}</p>
  </header>
  <section style="margin-top:24px">
    <h2>${selected ? 'Seu módulo em destaque' : 'Todos os módulos'}</h2>
    <div class="store-grid" style="margin-top:16px">
      ${products.map(product => `
        <article class="card store-card ${product.slug === selectedSlug ? 'recommended' : ''}" style="--product-color:${product.color}" id="${product.slug}">
          ${product.slug === selectedSlug ? '<span class="badge">RECOMENDADO PARA O SEU RESULTADO</span>' : ''}
          <img class="module-cover" src="${product.image}" alt="Capa do ${product.name}" loading="lazy" onerror="this.classList.add('module-cover--missing');this.alt='Capa do módulo indisponível';">
          <h3 style="margin-top:16px">${product.name}</h3>
          <div class="actions">${trialAction(product)}</div>
        </article>`).join('')}
    </div>
  </section>
  <section class="card" style="margin-top:24px">
    <h2>Dúvidas frequentes</h2>
    <h3>Posso conhecer antes de continuar?</h3>
    <p class="small">${hasTrialReady ? 'Sim. Cada módulo com Aula 1 liberada permite conhecer o conteúdo antes de seguir para a continuidade.' : 'Você pode conhecer os módulos e verificar qual conteúdo faz mais sentido para seu momento.'}</p>
    <h3>Isso substitui acompanhamento presencial de um profissional?</h3>
    <p class="small">Não. Todo o conteúdo tem finalidade educativa e deve ser contextualizado à sua situação por um profissional de saúde quando necessário.</p>
    <h3>Posso escolher outro módulo?</h3>
    <p class="small">Sim. Os demais módulos permanecem disponíveis para consulta.</p>
  </section>
  <footer class="footer"><a href="${PROJECT.privacyUrl}">Política de privacidade</a> · <a href="${PROJECT.termsUrl}">Termos de uso</a></footer>`;

document.querySelectorAll('[data-trial]').forEach(link => {
  link.onclick = () => trackEvent('trial_lesson_clicked', { product: link.dataset.trial });
});

if (selected) {
  setTimeout(() => document.querySelector(`#${selected.slug}`)?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  }), 150);
}
