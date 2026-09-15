import { MODULE_PRODUCTS, PROJECT, trackEvent } from './config.js';

const root = document.querySelector('#access-release-app');
const queryModuleKey = new URLSearchParams(location.search).get('modulo');
const pathProduct = Object.entries(MODULE_PRODUCTS).find(([, item]) => location.pathname.replace(/\/$/, '') === `/acesso-modulo${item.moduleId}`);
const moduleKey = queryModuleKey || pathProduct?.[0];
const product = MODULE_PRODUCTS[moduleKey];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

if (!product) {
  root.innerHTML = `<a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a><section class="card"><h1>Acesso não localizado</h1><p class="lead">Abra o módulo indicado em sua compra ou fale com a Clínica Setterlin.</p><a class="btn" href="vitrine.html">Ver módulos</a></section>`;
} else {
  document.title = `Liberando acesso — ${product.name} | Mandala da Dor`;
  root.innerHTML = `
    <a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a>
    <section class="hero lesson-hero" style="--module-color:${esc(product.color)}">
      <div>
        <p class="lesson-eyebrow"><span class="lesson-count">${product.moduleId}</span> COMPRA CONFIRMADA</p>
        <h1>Estamos liberando seu acesso</h1>
        <p class="lead">Seu conteúdo do ${esc(product.name)} será disponibilizado na Flowlink.</p>
        <p class="small">Use o mesmo e-mail informado na Hotmart para acessar sua área de aluno.</p>
      </div>
      <img class="lesson-cover" src="${esc(product.image)}" alt="Capa do ${esc(product.name)}" onerror="this.style.display='none'">
    </section>
    <section class="card" style="--module-color:${esc(product.color)};margin-top:20px">
      <p class="question-meta">PRÓXIMOS PASSOS</p>
      <h2>Seu acesso em três etapas</h2>
      <div class="lesson-steps">
        <div class="lesson-step"><span class="lesson-step-number">1</span><div><strong>Verifique seu e-mail</strong><br><span class="small">A Clínica Setterlin libera o módulo comprado e a Flowlink envia o e-mail de boas-vindas.</span></div></div>
        <div class="lesson-step"><span class="lesson-step-number">2</span><div><strong>Entre na Flowlink</strong><br><span class="small">Use o mesmo e-mail que você informou durante a compra.</span></div></div>
        <div class="lesson-step"><span class="lesson-step-number">3</span><div><strong>Continue seu módulo</strong><br><span class="small">Abra o Módulo ${product.moduleId} e siga a sequência após a aula experimental.</span></div></div>
      </div>
      <a class="btn" href="${esc(product.flowlinkUrl)}" target="_blank" rel="noopener" id="flowlink-access">Entrar na Flowlink</a>
      <p class="lesson-checkout-note">Se o e-mail de boas-vindas ainda não chegou, aguarde a liberação do acesso pela Clínica Setterlin antes de tentar novamente.</p>
    </section>
    <section class="card lesson-back">
      <h2>Precisa de ajuda?</h2>
      <p class="small">Fale com a Clínica Setterlin informando o e-mail usado na compra e o módulo adquirido.</p>
      <a class="btn ghost" href="https://wa.me/${PROJECT.whatsapp}" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </section>
    <footer class="footer"><a href="${PROJECT.privacyUrl}">Privacidade</a> · <a href="${PROJECT.termsUrl}">Termos</a> · <a href="${PROJECT.healthNoticeUrl}">Aviso de saúde</a></footer>`;

  trackEvent('purchase_access_page_viewed', { module: moduleKey });
  document.querySelector('#flowlink-access')?.addEventListener('click', () => trackEvent('flowlink_member_access_clicked', { module: moduleKey, source: 'purchase_access_page' }));
}
