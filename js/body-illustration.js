function mountBodyIllustration() {
  const regions = document.querySelector('#regions');
  if (!regions || document.querySelector('.body-illustration')) return false;
  const illustration = document.createElement('figure');
  illustration.className = 'body-illustration';
  illustration.setAttribute('aria-label', 'Ilustração educativa da coluna para apoiar a escolha de região');
  illustration.innerHTML = `<svg viewBox="0 0 180 210" role="img" aria-hidden="true"><circle cx="90" cy="24" r="16" fill="#dce7e4"/><path d="M90 42c-22 14-31 43-25 72l8 38c4 19 2 35-4 51m21-161c22 14 31 43 25 72l-8 38c-4 19-2 35 4 51" fill="none" stroke="#60716f" stroke-width="9" stroke-linecap="round"/><path d="M90 53v93" stroke="#237a6b" stroke-width="7" stroke-linecap="round" stroke-dasharray="4 6"/><circle cx="90" cy="61" r="6" fill="#39a9b8"/><circle cx="90" cy="88" r="6" fill="#55a85a"/><circle cx="90" cy="116" r="6" fill="#f2993a"/><circle cx="90" cy="143" r="6" fill="#d84a4a"/></svg><figcaption>Escolha abaixo as regiões que mais se aproximam do seu relato.</figcaption>`;
  regions.before(illustration);
  return true;
}

if (!mountBodyIllustration()) new MutationObserver(() => mountBodyIllustration()).observe(document.body, { childList: true, subtree: true });
