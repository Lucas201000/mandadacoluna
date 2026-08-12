import { PROJECT, MODULES, trackEvent } from './config.js';

function dateLabel(iso) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function safeName(name) {
  return (name || 'usuario').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
}

export async function generatePdf(result, charts) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 16;
  const primary = MODULES[result.primaryModule];
  const product = result.recommendedProduct;
  const productUrl = new URL(product.trialUrl, location.href).href;
  const foot = () => {
    pdf.setFontSize(8);
    pdf.setTextColor(90);
    pdf.text('Este relatório possui finalidade educativa e não substitui avaliação, diagnóstico ou tratamento profissional.', margin, 290, { maxWidth: 178 });
    pdf.text(`Página ${pdf.getNumberOfPages()}`, 185, 290);
  };
  const title = (heading, subheading) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(24, 50, 47);
    pdf.setFontSize(24);
    pdf.text(heading, margin, 28);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(90);
    pdf.text(subheading, margin, 37, { maxWidth: 178 });
  };

  title(PROJECT.name, 'Relatório educativo personalizado');
  pdf.setFillColor(primary.color);
  pdf.roundedRect(margin, 52, 178, 42, 5, 5, 'F');
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(21);
  pdf.text(result.user.firstName || 'Sua avaliação', 24, 70);
  pdf.setFontSize(11);
  pdf.text(dateLabel(result.createdAt), 24, 80);
  pdf.text('Resultado educativo personalizado', 24, 88);
  foot();

  pdf.addPage();
  title('Resumo da sua avaliação', 'Informações relatadas durante o questionário.');
  pdf.setTextColor(30);
  pdf.setFontSize(13);
  pdf.text(`Intensidade informada: ${result.pain.intensity}/10`, margin, 56);
  pdf.text(`Região: ${result.pain.additionalRegions.join(', ')}`, margin, 66, { maxWidth: 170 });
  pdf.text(`Duração: ${result.pain.duration}`, margin, 78);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Perfil predominante: Módulo ${primary.id} — ${primary.name}`, margin, 96, { maxWidth: 175 });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(primary.description, margin, 107, { maxWidth: 175, lineHeightFactor: 1.5 });
  pdf.text(`Perfis secundários: ${result.secondaryModules.map(key => `Módulo ${MODULES[key].id} — ${MODULES[key].short}`).join(' · ')}`, margin, 132, { maxWidth: 175 });
  if (result.safety.redFlagDetected) {
    pdf.setTextColor(160, 40, 40);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Atenção: suas respostas incluem sinais que merecem avaliação profissional.', margin, 153, { maxWidth: 175 });
    pdf.setFont('helvetica', 'normal');
  }
  foot();

  pdf.addPage();
  title('Gráficos educativos', 'As porcentagens mostram compatibilidade relatada, não probabilidade de doença ou diagnóstico.');
  pdf.addImage(charts.bars.toBase64Image(), 'PNG', margin, 48, 178, 92);
  pdf.addImage(charts.donut.toBase64Image(), 'PNG', 55, 146, 100, 90);
  foot();

  pdf.addPage();
  title('Interpretação educativa', 'Este conteúdo organiza os padrões relatados, sem substituir uma avaliação profissional.');
  pdf.setTextColor(30);
  pdf.setFontSize(12);
  pdf.text('Padrão predominante', margin, 57);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(primary.description, margin, 67, { maxWidth: 175, lineHeightFactor: 1.55 });
  pdf.setFont('helvetica', 'bold');
  pdf.text('Orientação inicial', margin, 100);
  pdf.setFont('helvetica', 'normal');
  pdf.text(primary.recommendation, margin, 110, { maxWidth: 175, lineHeightFactor: 1.55 });
  pdf.setFont('helvetica', 'bold');
  pdf.text('Respostas de segurança', margin, 148);
  pdf.setFont('helvetica', 'normal');
  pdf.text(result.safety.redFlagDetected ? 'Há sinais selecionados. Procure avaliação profissional conforme a urgência percebida.' : 'Nenhum sinal de alerta foi selecionado nesta triagem. Isso não substitui uma avaliação profissional.', margin, 158, { maxWidth: 175, lineHeightFactor: 1.55 });
  foot();

  pdf.addPage();
  title(result.safety.redFlagDetected ? 'Próximo passo com prioridade' : `Conheça o Módulo ${primary.id}`, result.safety.redFlagDetected ? 'Priorize atendimento profissional antes de considerar uma recomendação comercial.' : 'Acesse o conteúdo correspondente ao perfil predominante.');
  pdf.setFillColor(primary.color);
  pdf.roundedRect(margin, 55, 178, 48, 5, 5, 'F');
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(product.name, 24, 73, { maxWidth: 160 });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(product.shortDescription, 24, 84, { maxWidth: 160 });
  if (!result.safety.redFlagDetected) {
    pdf.setTextColor(24, 50, 47);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`Acessar o Módulo ${primary.id}`, margin, 130);
    pdf.link(margin, 118, 178, 20, { url: productUrl });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Caso o botão não abra, acesse: ${productUrl}`, margin, 145, { maxWidth: 175 });
  }
  foot();

  const date = new Date(result.createdAt);
  const name = `avaliacao-mandala-da-dor-${safeName(result.user.firstName)}-${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}.pdf`;
  pdf.save(name);
  trackEvent('pdf_generated');
  trackEvent('pdf_downloaded');
}
