import { STORAGE_KEY } from './config.js';
import { calculateResult } from './scoring.js';

const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

if (stored?.answers) {
  const product = calculateResult(stored).recommendedProduct;
  document.querySelectorAll('.product-art').forEach(art => {
    art.classList.add('result-cover');
    art.style.backgroundImage = `url("${product.image}")`;
    art.setAttribute('aria-label', `Capa do ${product.name}`);
    art.textContent = '';
  });
}
