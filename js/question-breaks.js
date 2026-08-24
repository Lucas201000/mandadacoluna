// Relatos públicos usados como pausas no questionário.
// Mantenha apenas trechos curtos, fiéis à avaliação original e sem promessas de resultado.
const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/search/?api=1&query=Cl%C3%ADnica%20Setterlin%20Fisioterapia%20Especializada%20Sorocaba';

export const QUESTION_BREAKS = [
  {
    id: 'review-lombar',
    afterQuestionId: 'q06',
    eyebrow: 'RELATO PÚBLICO NO GOOGLE',
    title: 'Muita gente passa meses tentando entender a dor.',
    quote: '“Acho que a melhor palavra para descrever minha trajetória com o Lucas é gratidão! [...] 8 meses de dor crônica na região da lombar [...] Hoje já não sinto mais dor graças a esse profissional...”',
    author: 'Marina R. — avaliação pública no Google',
    note: 'Relato individual publicado no Google. Resultados podem variar e não substituem avaliação profissional.',
    sourceUrl: GOOGLE_REVIEWS_URL
  },
  {
    id: 'review-quadril',
    afterQuestionId: 'q12',
    eyebrow: 'RELATO PÚBLICO NO GOOGLE',
    title: 'Você não precisa tentar entender tudo sozinho(a).',
    quote: '“Tive uma ótima experiência, cheguei à clínica com muita dor no quadril e saí quase sem sentir nada [...] obrigado pelo ótimo trabalho.”',
    author: 'José E. — avaliação pública no Google',
    note: 'Relato individual publicado no Google. Resultados podem variar e não substituem avaliação profissional.',
    sourceUrl: GOOGLE_REVIEWS_URL
  }
];
