// CENTRAL DE CONFIGURAÇÃO — edite aqui textos, links, produtos e dados de contato.
export const STORAGE_KEY = 'mandalaDorAssessmentV1';
// Dados de saúde informados no questionário permanecem somente neste navegador
// durante um período curto, suficiente para retomar uma avaliação interrompida.
export const LOCAL_STORAGE_TTL_MS = 24 * 60 * 60 * 1000;
export const PRIVACY_POLICY_VERSION = '2026-09-14.2';
export const LEAD_RETENTION_DAYS = 90;
export const PROJECT = {
  name: 'Mandala da Dor na Coluna', logo: 'M', professional: 'Lucas Gadoti Servelin', registration: 'CREFITO 275401-F',
  email: 'clinicasetterlin@gmail.com', whatsapp: '5515996592799', storefrontUrl: 'vitrine.html',
  // Entrada da área paga. Depois da compra, a pessoa deve entrar na Flowlink
  // usando o mesmo e-mail usado no checkout da Hotmart.
  flowlinkUrl: 'https://clinica-setterlin.flowlink-app.online/',
  trialLessonUrl: 'aula-experimental.html',
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
// IDs dos produtos criados na Hotmart. Não são links de checkout: mantenha-os aqui
// para conferir a correspondência entre vendas, Flowlink e vitrine.
export const HOTMART_PRODUCT_IDS = {
  inflamatoria: '8200610',
  muscular: '8200634',
  compressao: '8200662',
  rigidez: '8200755',
  encurtamento: '8201776',
  instabilidade: '8201801',
  // Preencha quando o combo de 6 meses for criado e aprovado na Hotmart.
  combo: ''
};

// HOTMART — cole aqui o HotLink/checkout exato copiado em
// Produtos > Links de divulgação. Não monte a URL apenas com o ID interno.
// A Aula 2 usa estes links; o site não exibe preço antes do checkout.
export const HOTMART_CHECKOUT_URLS = {
  inflamatoria: '',
  muscular: '',
  compressao: '',
  rigidez: '',
  encurtamento: '',
  instabilidade: '',
  combo: ''
};

// FLOWLINK — se existir uma entrada específica para cada módulo pago, cole-a
// aqui. Enquanto isso, o botão usa a entrada geral da área do aluno.
export const FLOWLINK_MEMBER_URLS = {
  inflamatoria: '',
  muscular: '',
  compressao: '',
  rigidez: '',
  encurtamento: '',
  instabilidade: ''
};

// AULA EXPERIMENTAL — hospede a primeira aula em um provedor de vídeo e cole
// uma URL direta .mp4, um link incorporável do YouTube ou do Vimeo.
// Não suba vídeos grandes diretamente neste repositório/Vercel.
export const MODULE_TRIAL_LESSONS = {
  inflamatoria: {
    title: 'Como começar quando a dor está mais irritada',
    focus: 'Movimentos iniciais, conforto e sinais para respeitar durante a prática.',
    videoUrl: '',
    outcomes: ['Entender o objetivo educativo do módulo', 'Começar com movimentos confortáveis', 'Saber quando pausar e procurar avaliação profissional']
  },
  muscular: {
    title: 'Primeiros passos para lidar com a tensão muscular',
    focus: 'Como observar a tensão acumulada e organizar movimentos simples no dia a dia.',
    videoUrl: '',
    outcomes: ['Reconhecer sinais comuns de tensão', 'Aprender uma rotina inicial confortável', 'Preparar o corpo para os próximos passos']
  },
  compressao: {
    title: 'Como observar sintomas que se espalham com segurança',
    focus: 'Cuidados educativos para relatos de irradiação ou sensibilidade nervosa.',
    videoUrl: '',
    outcomes: ['Entender o objetivo do módulo', 'Identificar limites de conforto', 'Reconhecer quando é importante buscar avaliação profissional']
  },
  rigidez: {
    title: 'Começando a recuperar confiança para se mover',
    focus: 'Movimentos leves e graduais para quem relata sensação de rigidez ou trava.',
    videoUrl: '',
    outcomes: ['Observar a mobilidade sem forçar', 'Entender a progressão gradual', 'Começar com um movimento educativo simples']
  },
  encurtamento: {
    title: 'Mobilidade e sensação de músculos puxando',
    focus: 'Uma introdução educativa à flexibilidade feita com progressão e conforto.',
    videoUrl: '',
    outcomes: ['Reconhecer o limite confortável', 'Evitar forçar alongamentos', 'Entender como a progressão será construída']
  },
  instabilidade: {
    title: 'Criando uma base de controle e estabilidade',
    focus: 'Princípios iniciais de respiração, controle de movimento e firmeza corporal.',
    videoUrl: '',
    outcomes: ['Entender a base do controle corporal', 'Conhecer o objetivo dos exercícios iniciais', 'Preparar-se para progredir com segurança']
  }
};

export const MODULE_PRODUCTS = Object.fromEntries(Object.values(MODULES).map(m=>[m.key,{
  moduleId:m.id,name:`Módulo ${m.id} — ${['Acalmando a dor irritada','Alívio da tensão muscular','Dor irradiada e nervo sensível','Recuperando a mobilidade','Flexibilidade e músculos encurtados','Força, estabilidade e controle'][m.id-1]}`,
  slug:['dor-inflamatoria','dor-muscular','compressao','rigidez','encurtamento','instabilidade'][m.id-1], productUrl:`vitrine.html?produto=${['dor-inflamatoria','dor-muscular','compressao','rigidez','encurtamento','instabilidade'][m.id-1]}`,
  image:`assets/images/produto-modulo-${m.id}.jpg`,
  hotmartProductId: HOTMART_PRODUCT_IDS[m.key],
  // A degustação passa a ser a entrada pública assim que o vídeo da Aula 1
  // estiver configurado. Até lá, preserva a entrada atual da Flowlink.
  trialPageUrl: `${PROJECT.trialLessonUrl}?modulo=${m.key}`,
  trialUrl: MODULE_TRIAL_LESSONS[m.key].videoUrl
    ? `${PROJECT.trialLessonUrl}?modulo=${m.key}`
    : (FLOWLINK_MEMBER_URLS[m.key] || PROJECT.flowlinkUrl),
  trialUrlConfigured: Boolean(MODULE_TRIAL_LESSONS[m.key].videoUrl),
  checkoutUrl: HOTMART_CHECKOUT_URLS[m.key] || '',
  comboCheckoutUrl: HOTMART_CHECKOUT_URLS.combo || '',
  flowlinkUrl: FLOWLINK_MEMBER_URLS[m.key] || PROJECT.flowlinkUrl,
  lesson: MODULE_TRIAL_LESSONS[m.key],
  shortDescription:m.recommendation, color:m.color
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
  // O progresso temporário mantém o primeiro nome e as respostas autorizadas,
  // mas nunca e-mail, WhatsApp ou preferência de marketing no localStorage.
  // O cadastro só é transmitido depois do consentimento específico e da confirmação do e-mail.
  const consent = assessmentData.consent || {};
  const consentAt = consent.reportSensitiveDataConsentAt || consent.reportPrivacyAcknowledgedAt || new Date().toISOString();
  const payload={
    assessmentId:assessmentData.assessmentId,
    savedAt:new Date().toISOString(),
    consentVersion:PRIVACY_POLICY_VERSION
  };

  // O banco recebe apenas metadados de entrega e consentimento. As respostas,
  // regiões, intensidade, sinais de alerta e pontuações não são enviados ao
  // Supabase como lead. O PDF é gerado no navegador e segue por e-mail apenas
  // quando a pessoa autoriza expressamente esse envio.
  const deliveryMetadata = {
    schema: 'mandala-lead-minimo-v2',
    reportRequestedAt: payload.savedAt,
    consent: {
      privacyAcknowledgedAt: consent.reportPrivacyAcknowledgedAt || null,
      sensitiveDataConsentAt: consent.reportSensitiveDataConsentAt || null,
      localAssessmentConsentAt: consent.localAssessmentConsentAt || null,
      adultConfirmedAt: consent.adultConfirmedAt || null,
      policyVersion: consent.policyVersion || PRIVACY_POLICY_VERSION,
      marketingConsentAt: consent.marketingConsentAt || null
    },
    // O prazo é calculado pelo padrão do banco, não pelo navegador.
    retention: { policyDays: LEAD_RETENTION_DAYS }
  };

  if(!window.supabase) {
    throw new Error('Não foi possível registrar a autorização para o relatório agora.');
  }
  const client=window.supabase.createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.publishableKey);
  const {error}=await client.from(SUPABASE_CONFIG.table).insert({
    assessment_id:assessmentData.assessmentId,
    first_name:leadData.name,
    email:leadData.email,
    whatsapp:leadData.whatsapp || null,
    marketing_consent:Boolean(leadData.marketing),
    privacy_consent:Boolean(consent.reportPrivacyAcknowledgedAt),
    sensitive_data_consent:Boolean(consent.reportSensitiveDataConsentAt),
    consent_version:consent.policyVersion || PRIVACY_POLICY_VERSION,
    consent_at:consentAt,
    assessment:deliveryMetadata
  });
  if(error) {
    console.warn('Não foi possível salvar o cadastro mínimo no Supabase.',error);
    throw new Error('Não foi possível registrar a autorização para o relatório agora.');
  }
  console.info('[Mandala lead salvo no Supabase]',assessmentData.assessmentId);
  return {...payload,remoteSaved:true};
}
