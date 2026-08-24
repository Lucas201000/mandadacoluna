// Relatos públicos usados como pausas no questionário.
// Mantenha apenas trechos curtos, fiéis à avaliação original e sem promessas de resultado.
const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/search/?api=1&query=Cl%C3%ADnica%20Setterlin%20Fisioterapia%20Especializada%20Sorocaba';

export const QUESTION_BREAKS = [
  {
    id: 'review-lombar',
    afterQuestionId: 'q06',
    eyebrow: 'RELATO PÚBLICO NO GOOGLE',
    title: 'Muita gente passa meses tentando entender a dor.',
    quote: '“8 meses de dor crônica na região da lombar...”',
    author: 'Marina R. — avaliação pública no Google',
    note: 'Este é um relato individual. Cada pessoa tem uma história e precisa ser considerada de forma individual.',
    sourceUrl: GOOGLE_REVIEWS_URL
  },
  {
    id: 'review-quadril',
    afterQuestionId: 'q12',
    eyebrow: 'RELATO PÚBLICO NO GOOGLE',
    title: 'Você não precisa tentar entender tudo sozinho(a).',
    quote: '“Cheguei à clínica com muita dor no quadril...”',
    author: 'José E. — avaliação pública no Google',
    note: 'Este é um relato individual. Ele não representa diagnóstico nem garantia de resultado.',
    sourceUrl: GOOGLE_REVIEWS_URL
  }
];
