import { calculateResult } from './scoring.js';
import { loadAssessment } from './storage.js';

const stored = loadAssessment();

if (stored?.answers) {
  const product = calculateResult(stored).recommendedProduct;
  document.querySelectorAll('.product-art').forEach(art => {
    art.classList.add('result-cover');
    art.style.backgroundImage = `url("${product.image}")`;
    art.setAttribute('aria-label', `Capa do ${product.name}`);
    art.textContent = '';
  });
}
