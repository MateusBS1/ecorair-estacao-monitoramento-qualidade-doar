// Configuração centralizada para facilitar troca de cidade, geolocalização e novas APIs.
const ecoAirConfig = {
  localizacao: {
    nome: 'João Pessoa - PB',
    pais: 'Brasil',
    latitude: -7.115,
    longitude: -34.863,
    timezone: 'America/Fortaleza'
  },
  apiUrl: 'https://api.open-meteo.com/v1/forecast',
  storageKey: 'ecoair-monitor-ultimos-dados'
};

// Valores seguros usados quando a API ainda não respondeu ou está indisponível.
const dadosPadrao = {
  temperatura: 28,
  umidade: 64,
  vento: 14,
  atualizadoEm: new Date().toISOString(),
  origem: 'Valores padrão'
};

const estadosQualidade = {
  boa: {
    titulo: 'Boa',
    classe: 'status-boa',
    risco: 'Baixo',
    mensagem: 'Condições atmosféricas favoráveis para atividades cotidianas.'
  },
  moderada: {
    titulo: 'Moderada',
    classe: 'status-moderada',
    risco: 'Moderado',
    mensagem: 'Atenção para possíveis concentrações de poluentes, especialmente em áreas de tráfego intenso.'
  },
  ruim: {
    titulo: 'Ruim',
    classe: 'status-ruim',
    risco: 'Alto',
    mensagem: 'Condições climáticas podem dificultar a dispersão de poluentes. Reduza exposição prolongada.'
  }
};

const icones = {
  temperatura: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 14.76V5a4 4 0 0 0-8 0v9.76a6 6 0 1 0 8 0Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 9v7" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  umidade: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3S6 10 6 14.5a6 6 0 0 0 12 0C18 10 12 3 12 3Z" stroke-width="2" stroke-linejoin="round"/>
      <path d="M9.5 15.5A3.2 3.2 0 0 0 13 18" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  vento: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h10a3 3 0 1 0-3-3" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 12h15" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 16h11a3 3 0 1 1-3 3" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  ar: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 17h9a4 4 0 1 0-3.6-5.7A5 5 0 0 0 5 17Z" stroke-width="2" stroke-linejoin="round"/>
      <path d="M15 17h4" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  risco: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 4 6v6c0 5 3.4 7.8 8 9 4.6-1.2 8-4 8-9V6l-8-3Z" stroke-width="2" stroke-linejoin="round"/>
      <path d="M12 8v5" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 16h.01" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `
};

function normalizarTexto(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function formatarNumero(valor, casas = 0) {
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function formatarDataHora(valor) {
  const data = valor ? new Date(valor) : new Date();

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function obterClasseRisco(risco) {
  return `risk-${normalizarTexto(risco)}`;
}

function obterClasseStatusDoRisco(risco) {
  const classes = {
    baixo: 'status-boa',
    moderado: 'status-moderada',
    alto: 'status-ruim',
    critico: 'status-muito-ruim'
  };

  return classes[normalizarTexto(risco)] || 'status-moderada';
}

function carregarDadosSalvos() {
  try {
    const dados = localStorage.getItem(ecoAirConfig.storageKey);
    return dados ? JSON.parse(dados) : null;
  } catch (erro) {
    return null;
  }
}

function salvarDados(dados) {
  try {
    localStorage.setItem(ecoAirConfig.storageKey, JSON.stringify(dados));
  } catch (erro) {
    // A aplicação continua funcionando mesmo se o navegador bloquear localStorage.
  }
}

// Chamada da API Open-Meteo: funciona no navegador, sem chave e sem backend.
async function buscarDadosMeteorologicos() {
  const parametros = new URLSearchParams({
    latitude: ecoAirConfig.localizacao.latitude,
    longitude: ecoAirConfig.localizacao.longitude,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timezone: ecoAirConfig.localizacao.timezone
  });

  const resposta = await fetch(`${ecoAirConfig.apiUrl}?${parametros.toString()}`);

  if (!resposta.ok) {
    throw new Error('Resposta inválida da API meteorológica.');
  }

  const dados = await resposta.json();
  const atual = dados.current;

  if (!atual) {
    throw new Error('Dados atuais não encontrados na resposta da API.');
  }

  return {
    temperatura: Number(atual.temperature_2m),
    umidade: Number(atual.relative_humidity_2m),
    vento: Number(atual.wind_speed_10m),
    atualizadoEm: atual.time || new Date().toISOString(),
    origem: 'Open-Meteo'
  };
}

// Processamento local: estima qualidade do ar até existir uma API específica de poluentes.
function calcularQualidadeDoAr(dados) {
  const condicoesDeRisco = [
    dados.temperatura > 32,
    dados.umidade < 40,
    dados.vento < 10
  ].filter(Boolean).length;

  if (condicoesDeRisco === 3) {
    return estadosQualidade.ruim;
  }

  if (condicoesDeRisco === 2) {
    return estadosQualidade.moderada;
  }

  return estadosQualidade.boa;
}

// Gera alertas automaticamente com base na qualidade calculada.
function gerarAlerta(qualidade) {
  const alertas = {
    boa: {
      grau: 'Grau do alerta: informativo',
      titulo: 'Condições atmosféricas favoráveis.',
      descricao: 'Os indicadores meteorológicos atuais favorecem a dispersão de poluentes e não sugerem risco elevado.',
      prioridade: 'Monitoramento regular',
      classe: 'alert-level-good',
      icone: 'i',
      recomendacoes: [
        'Mantenha hábitos de mobilidade sustentável sempre que possível.',
        'Acompanhe o painel para observar mudanças ao longo do dia.',
        'Priorize áreas arborizadas para deslocamentos e atividades externas.'
      ]
    },
    moderada: {
      grau: 'Grau do alerta: moderado',
      titulo: 'Atenção para possíveis concentrações de poluentes.',
      descricao: 'Duas condições climáticas indicam menor conforto ambiental. Grupos sensíveis devem observar sintomas respiratórios.',
      prioridade: 'Atenção pública',
      classe: 'alert-level-moderate',
      icone: '!',
      recomendacoes: [
        'Reduza exercícios intensos próximos a vias movimentadas.',
        'Mantenha hidratação frequente, principalmente em períodos de ar seco.',
        'Crianças, idosos e pessoas com doenças respiratórias devem evitar exposição prolongada.'
      ]
    },
    ruim: {
      grau: 'Grau do alerta: alto',
      titulo: 'Evite atividades físicas intensas ao ar livre.',
      descricao: 'Temperatura elevada, baixa umidade e pouco vento podem dificultar a dispersão de poluentes atmosféricos.',
      prioridade: 'Ação preventiva',
      classe: 'alert-level-high',
      icone: '!',
      recomendacoes: [
        'Evite atividades físicas intensas ao ar livre enquanto a condição persistir.',
        'Mantenha ambientes internos protegidos de fumaça, poeira e tráfego intenso.',
        'Procure atendimento se houver falta de ar, tosse persistente ou chiado no peito.'
      ]
    }
  };

  return alertas[normalizarTexto(qualidade.titulo)] || alertas.boa;
}

function montarIndicadores(dados, qualidade) {
  return [
    {
      titulo: 'Temperatura',
      valor: `${formatarNumero(dados.temperatura, 1)}°C`,
      descricao: 'Temperatura atual obtida pela Open-Meteo para João Pessoa.',
      icone: icones.temperatura,
      etiqueta: 'Clima'
    },
    {
      titulo: 'Umidade',
      valor: `${formatarNumero(dados.umidade)}%`,
      descricao: 'Umidade relativa atual do ar na localização monitorada.',
      icone: icones.umidade,
      etiqueta: 'Atmosfera'
    },
    {
      titulo: 'Velocidade do vento',
      valor: `${formatarNumero(dados.vento, 1)} km/h`,
      descricao: 'Vento atual usado para estimar dispersão de poluentes.',
      icone: icones.vento,
      etiqueta: 'Vento'
    },
    {
      titulo: 'Qualidade do ar',
      valor: qualidade.titulo,
      descricao: 'Estimativa local baseada em temperatura, umidade e vento.',
      icone: icones.ar,
      etiqueta: 'Ar',
      status: qualidade.classe
    },
    {
      titulo: 'Nível de risco',
      valor: qualidade.risco,
      descricao: 'Síntese operacional para orientar cuidados preventivos.',
      icone: icones.risco,
      etiqueta: 'Risco',
      status: obterClasseStatusDoRisco(qualidade.risco)
    }
  ];
}

// Atualização da interface do dashboard principal.
function atualizarDashboard(dados, qualidade) {
  const areaIndicadores = document.getElementById('indicadores');

  if (!areaIndicadores) {
    return;
  }

  areaIndicadores.innerHTML = montarIndicadores(dados, qualidade)
    .map((indicador) => `
      <article class="metric-card ${indicador.status || ''}">
        <div class="metric-top">
          <span class="metric-icon">${indicador.icone}</span>
          <span class="metric-tag">${indicador.etiqueta}</span>
        </div>
        <h3>${indicador.titulo}</h3>
        <p class="metric-value">${indicador.valor}</p>
        <p class="metric-note">${indicador.descricao}</p>
      </article>
    `)
    .join('');
}

function atualizarQualidadeDoAr(qualidade) {
  const painel = document.getElementById('painel-qualidade');
  const badge = document.getElementById('qualidade-badge');
  const mensagem = document.getElementById('qualidade-mensagem');

  if (!painel || !badge || !mensagem) {
    return;
  }

  badge.textContent = qualidade.titulo;
  badge.className = `quality-badge ${qualidade.classe}`;
  mensagem.textContent = qualidade.mensagem;

  document.querySelectorAll('.quality-dot').forEach((item) => {
    item.classList.toggle('active', item.classList.contains(qualidade.classe));
  });

  painel.classList.toggle('is-risk', qualidade.titulo !== 'Boa');
  painel.classList.toggle('is-critical', qualidade.titulo === 'Ruim');
}

function atualizarBarraDeRisco(qualidade) {
  const riscoAtual = document.getElementById('risco-atual');
  const mensagem = document.getElementById('risco-mensagem');
  const riscoNormalizado = normalizarTexto(qualidade.risco);
  const classeAtual = obterClasseRisco(qualidade.risco);

  if (riscoAtual) {
    riscoAtual.textContent = qualidade.risco;
    riscoAtual.className = `risk-current ${classeAtual}`;
  }

  if (mensagem) {
    mensagem.textContent = qualidade.mensagem;
  }

  document.querySelectorAll('.risk-step').forEach((etapa) => {
    const classeEtapa = obterClasseRisco(etapa.dataset.risk);
    const etapaAtiva = normalizarTexto(etapa.dataset.risk) === riscoNormalizado;

    etapa.classList.add(classeEtapa);
    etapa.classList.toggle('active', etapaAtiva);
  });
}

function atualizarAlertas(qualidade) {
  const alerta = gerarAlerta(qualidade);
  const painel = document.getElementById('painel-alerta');
  const grau = document.getElementById('alerta-grau');
  const titulo = document.getElementById('alerta-title');
  const descricao = document.getElementById('alerta-descricao');
  const icone = document.getElementById('alerta-icone');
  const qualidadeTexto = document.getElementById('alerta-qualidade');
  const riscoTexto = document.getElementById('alerta-risco');
  const prioridadeTexto = document.getElementById('alerta-prioridade');
  const lista = document.getElementById('recomendacoes-alerta');

  if (!painel) {
    return;
  }

  painel.className = `alert-panel ${alerta.classe}`;
  if (grau) grau.textContent = alerta.grau;
  if (titulo) titulo.textContent = alerta.titulo;
  if (descricao) descricao.textContent = alerta.descricao;
  if (icone) icone.textContent = alerta.icone;
  if (qualidadeTexto) qualidadeTexto.textContent = qualidade.titulo;
  if (riscoTexto) riscoTexto.textContent = qualidade.risco;
  if (prioridadeTexto) prioridadeTexto.textContent = alerta.prioridade;

  if (lista) {
    lista.innerHTML = alerta.recomendacoes.map((item) => `<li>${item}</li>`).join('');
  }
}

// Atualiza horário, status da API e mensagem amigável de erro.
function atualizarHorario(dados, houveErro = false) {
  const ultimaAtualizacao = document.getElementById('ultima-atualizacao');
  const statusApi = document.getElementById('status-api');
  const mensagemErro = document.getElementById('mensagem-erro');
  const statusMonitoramento = document.getElementById('monitoramento-status');
  const fonteDados = document.getElementById('fonte-dados');

  if (ultimaAtualizacao) {
    ultimaAtualizacao.textContent = `Última atualização: ${formatarDataHora(dados.atualizadoEm)}`;
  }

  if (statusApi) {
    statusApi.textContent = houveErro ? 'Usando dados salvos' : 'Dados atualizados';
    statusApi.className = `api-status ${houveErro ? 'is-error' : 'is-live'}`;
  }

  if (mensagemErro) {
    mensagemErro.classList.toggle('is-hidden', !houveErro);
  }

  if (statusMonitoramento) {
    statusMonitoramento.textContent = houveErro ? 'Modo contingência' : 'Monitoramento ativo';
  }

  if (fonteDados) {
    fonteDados.textContent = houveErro
      ? 'Não foi possível atualizar os dados meteorológicos. Exibindo últimos valores disponíveis.'
      : `Dados meteorológicos reais via ${dados.origem}.`;
  }
}

function atualizarInterface(dados, houveErro = false) {
  const qualidade = calcularQualidadeDoAr(dados);

  atualizarDashboard(dados, qualidade);
  atualizarQualidadeDoAr(qualidade);
  atualizarBarraDeRisco(qualidade);
  atualizarAlertas(qualidade);
  atualizarHorario(dados, houveErro);
}

async function iniciarEcoAirMonitor() {
  const dadosIniciais = carregarDadosSalvos() || dadosPadrao;

  atualizarInterface(dadosIniciais);

  try {
    const dadosApi = await buscarDadosMeteorologicos();
    salvarDados(dadosApi);
    atualizarInterface(dadosApi);
  } catch (erro) {
    const dadosFallback = carregarDadosSalvos() || dadosPadrao;
    atualizarInterface(dadosFallback, true);
  }
}

// Ponto de entrada preparado para futuras expansões: geolocalização, histórico e gráficos.
document.addEventListener('DOMContentLoaded', iniciarEcoAirMonitor);
