function mountBodyIllustration() {
  const regions = document.querySelector('#regions');
  if (!regions || document.querySelector('.body-illustration')) return false;
  const illustration = document.createElement('figure');
  illustration.className = 'body-illustration';
  illustration.innerHTML = `<img src="assets/images/quiz-coluna-mandala-v1.webp" alt="Ilustração educativa das regiões da coluna">`;
  regions.before(illustration);
  return true;
}

if (!mountBodyIllustration()) new MutationObserver(() => mountBodyIllustration()).observe(document.body, { childList: true, subtree: true });
