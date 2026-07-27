// CENTRAL DE CONFIGURAÇÃO — edite aqui textos, links, produtos e dados de contato.
export const STORAGE_KEY = 'mandalaDorAssessmentV1';
export const PROJECT = {
  name: 'Mandala da Dor na Coluna', logo: 'M', professional: 'Profissional responsável', registration: '',
  email: 'contato@seudominio.com', whatsapp: '5511999999999', storefrontUrl: 'vitrine.html',
  privacyUrl: 'privacidade.html', termsUrl: 'termos.html', healthNoticeUrl: 'aviso-saude.html',
  healthNotice: 'Esta ferramenta possui finalidade educativa e não substitui avaliação, diagnóstico ou tratamento profissional.'
};
// SUPABASE — a chave publishable pode ficar no frontend quando as políticas RLS estiverem ativas.
// NUNCA coloque aqui a chave service_role.
export const SUPABASE_CONFIG = {
  url: 'https://dsgsksamlcyfrqrthjpa.supabase.co',
  publishableKey: 'sb_publishable_0wXE1wh-DwyeJClziFs9BQ_ZKG5ZxtO',
  table: 'assessment_leads'
};
export const MODULES = {
  inflamatoria:{id:1,key:'inflamatoria',name:'Dor inflamatória ou irritada',short:'Inflamatória',color:'#D84A4A',description:'Seus relatos apresentam características semelhantes a um padrão de dor irritada, forte ou persistente.',recommendation:'Observe mudanças no padrão relatado e procure orientação profissional se os sintomas persistirem ou piorarem.'},
  muscular:{id:2,key:'muscular',name:'Dor muscular por tensão ou contratura',short:'Muscular',color:'#F2993A',description:'Seus relatos apresentam características semelhantes a tensão, sobrecarga e desconforto muscular.',recommendation:'Estratégias educativas de pausas, movimento confortável e organização da rotina podem ser úteis para conversar com um profissional.'},
  compressao:{id:3,key:'compressao',name:'Dor associada a compressão ou sensibilidade nervosa',short:'Compressão',color:'#55A85A',description:'Seus relatos apresentam características semelhantes a irradiação ou sensibilidade nervosa.',recommendation:'Como há sintomas que podem se espalhar, uma avaliação profissional pode ajudar a contextualizar seus relatos.'},
  rigidez:{id:4,key:'rigidez',name:'Dor associada a rigidez ou falta de mobilidade',short:'Rigidez',color:'#39A9B8',description:'Seus relatos apresentam características semelhantes a rigidez e limitação de movimento.',recommendation:'Movimentos leves e graduais, dentro do conforto, podem fazer parte de uma conversa educativa sobre mobilidade.'},
  encurtamento:{id:5,key:'encurtamento',name:'Dor associada a encurtamento muscular',short:'Encurtamento',color:'#7A4FA3',description:'Seus relatos apresentam características semelhantes a sensação de músculos puxando e pouca flexibilidade.',recommendation:'Uma abordagem gradual e individualizada de flexibilidade pode ser discutida com um profissional.'},
  instabilidade:{id:6,key:'instabilidade',name:'Dor associada a instabilidade, falta de força ou controle',short:'Instabilidade',color:'#3569B7',description:'Seus relatos apresentam características semelhantes a pouca firmeza, resistência ou controle.',recommendation:'Fortalecimento e controle de movimento são temas educativos que podem ser individualizados por um profissional.'}
};
// Substitua URLs, imagens e preços provisórios antes de publicar.
export const MODULE_PRODUCTS = Object.fromEntries(Object.values(MODULES).map(m=>[m.key,{
  moduleId:m.id,name:`Módulo ${m.id} — ${['Acalmando a dor irritada','Alívio da tensão muscular','Dor irradiada e nervo sensível','Recuperando a mobilidade','Flexibilidade e músculos encurtados','Força, estabilidade e controle'][m.id-1]}`,
  slug:['dor-inflamatoria','dor-muscular','compressao','rigidez','encurtamento','instabilidade'][m.id-1], productUrl:`vitrine.html?produto=${['dor-inflamatoria','dor-muscular','compressao','rigidez','encurtamento','instabilidade'][m.id-1]}`,
  image:`assets/images/produto-modulo-${m.id}.webp`, price:'Preço a configurar', shortDescription:m.recommendation, color:m.color
}]));
// Depoimentos provisórios — substitua somente por relatos reais autorizados.
export const STOREFRONT_CONTENT = {
  testimonials: [
    { quote: 'Exemplo de depoimento: a avaliação ajudou a organizar os próximos passos.', author: 'Relato ilustrativo' },
    { quote: 'Exemplo de depoimento: consegui compreender melhor meus relatos e conversar com mais clareza com um profissional.', author: 'Relato ilustrativo' }
  ]
};
export function trackEvent(eventName,eventData={}) { console.info('[Mandala analytics]',eventName,eventData); /* GA4 / Meta / TikTok / API futura aqui */ }
export async function saveLead(leadData,assessmentData) {
  const payload={leadData,assessmentId:assessmentData.assessmentId,savedAt:new Date().toISOString()};
  localStorage.setItem('mandalaDorLeadV1',JSON.stringify(payload));
  if(!window.supabase) throw new Error('Biblioteca do Supabase não foi carregada.');
  const client=window.supabase.createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.publishableKey);
  const {error}=await client.from(SUPABASE_CONFIG.table).insert({
    assessment_id:assessmentData.assessmentId, first_name:leadData.name, email:leadData.email,
    whatsapp:leadData.whatsapp, marketing_consent:leadData.marketing, assessment:assessmentData
  });
  if(error) throw error;
  console.info('[Mandala lead salvo no Supabase]',assessmentData.assessmentId);
  return payload;
}
