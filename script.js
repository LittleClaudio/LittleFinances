// ==========================================================================
// 1. CONFIGURAÇÕES INICIAIS E MAPEAMENTO DE ELEMENTOS DO DOM
// ==========================================================================

const boxLogin = document.getElementById("box-login");
const boxRegistro = document.getElementById("box-registro");
const btnIrParaRegistro = document.getElementById("btnIrParaRegistro");
const btnIrParaLogin = document.getElementById("btnIrParaLogin");

const telaLogin = document.getElementById("tela-login");
const formLogin = document.getElementById("formLogin");
const campoEmail = document.getElementById("loginEmail");
const campoSenha = document.getElementById("loginSenha");

const formRegistro = document.getElementById("formRegistro");
const registroEmail = document.getElementById("registroEmail");
const registroSenha = document.getElementById("registroSenha");
const registroConfirmarSenha = document.getElementById(
  "registroConfirmarSenha",
);

const formulario = document.getElementById("formTransacao");
const campoDescricao = document.getElementById("descricao");
const campoValor = document.getElementById("valor");
const campoTipo = document.getElementById("tipo");
const campoData = document.getElementById("data");
const btnSair = document.getElementById("btnSair");

const listaTransacoes = document.getElementById("transacoes");
const elementoEntradas = document.getElementById("totalEntradas");
const elementoSaidas = document.getElementById("totalSaidas");
const elementoGeral = document.getElementById("totalGeral");

// Elementos de Filtro (Se um deles não existir no HTML, o código não vai mais quebrar)
const filtroMes = document.getElementById("filtroMes");
const filtroAno = document.getElementById("filtroAno");

// ==========================================================================
// 2. ESTADO DA APLICAÇÃO (MEMÓRIA LOCAL)
// ==========================================================================

let transacoes = [];
let usuariosCadastrados =
  JSON.parse(localStorage.getItem("usuarios_rastreador")) || [];

let paginaAtual = 1;
const itensPorPagina = 5;

// ==========================================================================
// 3. CONTROLE DE SESSÃO E SEGURANÇA
// ==========================================================================

const emailUsuarioLogado = sessionStorage.getItem("usuarioLogado");
if (emailUsuarioLogado) {
  if (telaLogin) telaLogin.classList.add("escondido");
  iniciarAplicativo(emailUsuarioLogado);
} else {
  if (telaLogin) telaLogin.classList.remove("escondido");
}

// Alternâncias de tela protegidas contra nulos
if (btnIrParaRegistro && boxLogin && boxRegistro) {
  btnIrParaRegistro.addEventListener("click", function (evento) {
    evento.preventDefault();
    boxLogin.classList.add("escondido-form");
    boxRegistro.classList.remove("escondido-form");
  });
}

if (btnIrParaLogin && boxLogin && boxRegistro) {
  btnIrParaLogin.addEventListener("click", function (evento) {
    evento.preventDefault();
    boxRegistro.classList.add("escondido-form");
    boxLogin.classList.remove("escondido-form");
  });
}

// Processamento de Login
if (formLogin) {
  formLogin.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const emailDigitado = campoEmail.value.trim();
    const senhaDigitada = campoSenha.value;

    const usuarioEncontrado = usuariosCadastrados.find(
      (u) => u.email === emailDigitado && u.senha === senhaDigitada,
    );

    if (usuarioEncontrado) {
      sessionStorage.setItem("usuarioLogado", emailDigitado);
      if (telaLogin) telaLogin.classList.add("escondido");
      paginaAtual = 1;
      iniciarAplicativo(emailDigitado);
    } else {
      alert("E-mail ou senha incorretos!");
    }
  });
}

// Processamento de Cadastro
if (formRegistro) {
  formRegistro.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const emailDigitado = registroEmail.value.trim();
    const senhaDigitada = registroSenha.value;
    const confirmacaoSenha = registroConfirmarSenha.value;

    if (senhaDigitada !== confirmacaoSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    if (senhaDigitada.length < 4) {
      alert("A senha precisa ter pelo menos 4 caracteres.");
      return;
    }

    const usuarioExiste = usuariosCadastrados.some(
      (u) => u.email === emailDigitado,
    );
    if (usuarioExiste) {
      alert("Este e-mail já está cadastrado!");
      return;
    }

    usuariosCadastrados.push({ email: emailDigitado, senha: senhaDigitada });
    localStorage.setItem(
      "usuarios_rastreador",
      JSON.stringify(usuariosCadastrados),
    );

    alert("Conta criada com sucesso!");
    formRegistro.reset();

    if (boxRegistro) boxRegistro.classList.add("escondido-form");
    if (boxLogin) boxLogin.classList.remove("escondido-form");
    if (campoEmail) campoEmail.value = emailDigitado;
  });
}

// Encerramento de Sessão (Logout)
if (btnSair) {
  btnSair.addEventListener("click", function () {
    sessionStorage.removeItem("usuarioLogado");
    if (telaLogin) telaLogin.classList.remove("escondido");

    transacoes = [];
    if (listaTransacoes) listaTransacoes.innerHTML = "";
    if (elementoEntradas) elementoEntradas.innerHTML = "R$ 0,00";
    if (elementoSaidas) elementoSaidas.innerHTML = "R$ 0,00";
    if (elementoGeral) elementoGeral.innerHTML = "R$ 0,00";
    destruirPaginacaoVisual();

    if (campoEmail) campoEmail.value = "";
    if (campoSenha) campoSenha.value = "";
  });
}

// ==========================================================================
// 4. PROCESSAMENTO DE TEXTOS, CÁLCULOS E SALDOS
// ==========================================================================

function atualizarSaldos() {
  let somaEntradas = 0;
  let somaSaidas = 0;

  // Lê os valores se os filtros existirem, senão adota "todos" ou vazio
  const mesSelecionado = filtroMes ? filtroMes.value : "todos";
  const anoSelecionado = filtroAno ? filtroAno.value : "";

  const transacoesFiltradas = transacoes.filter(function (transacao) {
    const dataDefinida = transacao.data || "";
    if (!dataDefinida) return true; // Se não tiver data, exibe sempre

    const partesData = dataDefinida.split("-");
    const anoTransacao = partesData[0];
    const mesTransacao = partesData[1];

    const bateMes =
      mesSelecionado === "todos" || mesTransacao === mesSelecionado;
    const bateAno = !anoSelecionado || anoTransacao === anoSelecionado;

    if (bateMes && bateAno) {
      if (transacao.tipo === "entrada") somaEntradas += transacao.valor;
      else somaSaidas += transacao.valor;
      return true;
    }
    return false;
  });

  const totalGeral = somaEntradas - somaSaidas;
  if (elementoEntradas)
    elementoEntradas.innerHTML = `R$ ${somaEntradas.toFixed(2)}`;
  if (elementoSaidas) elementoSaidas.innerHTML = `R$ ${somaSaidas.toFixed(2)}`;
  if (elementoGeral) elementoGeral.innerHTML = `R$ ${totalGeral.toFixed(2)}`;

  renderizarHistoricoPaginado(transacoesFiltradas);

  const emailAtual = sessionStorage.getItem("usuarioLogado");
  if (emailAtual) {
    localStorage.setItem(
      "transacoes_" + emailAtual,
      JSON.stringify(transacoes),
    );
  }
}

// ==========================================================================
// 5. MOTOR DE RENDERIZAÇÃO DO HISTÓRICO E PAGINAÇÃO DINÂMICA
// ==========================================================================

function renderizarHistoricoPaginado(listaParaExibir) {
  if (!listaTransacoes) return;
  listaTransacoes.innerHTML = "";

  const totalItens = listaParaExibir.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }

  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const itensFatiados = listaParaExibir.slice(indiceInicial, indiceFinal);

  itensFatiados.forEach(function (transacao) {
    const li = document.createElement("li");
    li.classList.add("transacao", transacao.tipo);

    let dataExibicao = "--/--/----";
    if (transacao.data) {
      const [ano, mes, dia] = transacao.data.split("-");
      dataExibicao = `${dia}/${mes}/${ano}`;
    }

    li.innerHTML = `
      <span>${transacao.descricao} <small>(${dataExibicao})</small></span>
      <span class="valor-transacao">${transacao.tipo === "entrada" ? "+ " : "- "}R$ ${transacao.valor.toFixed(2)}</span>
      <button class="botao-deletar">X</button>
    `;

    li.querySelector(".botao-deletar").addEventListener("click", function () {
      const indiceOriginal = transacoes.indexOf(transacao);
      transacoes.splice(indiceOriginal, 1);
      atualizarSaldos();
    });

    listaTransacoes.appendChild(li);
  });

  construirPaginacaoVisual(totalPaginas);
}

function construirPaginacaoVisual(totalPaginas) {
  destruirPaginacaoVisual(); // VARREDA CRÍTICA: Limpa qualquer resquício ou duplicata da tela

  // Se não houver transações suficientes para gerar mais de 1 página, não cria os botões
  if (totalPaginas <= 1 && transacoes.length <= itensPorPagina) return;

  const containerPaginacao = document.createElement("div");
  containerPaginacao.classList.add("paginacao");
  containerPaginacao.id = "controle-paginacao";

  // Botão "Anterior"
  const btnAnterior = document.createElement("button");
  btnAnterior.classList.add("btn-pagina");
  btnAnterior.innerText = "Anterior";
  btnAnterior.disabled = paginaAtual === 1;
  btnAnterior.addEventListener("click", function () {
    paginaAtual--;
    atualizarSaldos();
  });
  containerPaginacao.appendChild(btnAnterior);

  // Botões numéricos individuais das páginas
  for (let i = 1; i <= totalPaginas; i++) {
    const btnNumero = document.createElement("button");
    btnNumero.classList.add("btn-pagina");
    btnNumero.innerText = i;

    if (i === paginaAtual) btnNumero.classList.add("ativo");

    btnNumero.addEventListener("click", function () {
      paginaAtual = i;
      atualizarSaldos();
    });
    containerPaginacao.appendChild(btnNumero);
  }

  // Botão "Próximo"
  const btnProximo = document.createElement("button");
  btnProximo.classList.add("btn-pagina");
  btnProximo.innerText = "Próximo";
  btnProximo.disabled = paginaAtual === totalPaginas;
  btnProximo.addEventListener("click", function () {
    paginaAtual++;
    atualizarSaldos();
  });
  containerPaginacao.appendChild(btnProximo);

  // Insere de forma segura na base do histórico
  const boxHistorico = document.querySelector(".historico");
  if (boxHistorico) {
    boxHistorico.appendChild(containerPaginacao);
  }
}

function destruirPaginacaoVisual() {
  // SOLUÇÃO DO BUG: Em vez de apagar só o primeiro por ID, pegamos TODOS
  // os elementos com a classe '.paginacao' e eliminamos do HTML sem deixar sobreviventes.
  const paginacoesExistentes = document.querySelectorAll(".paginacao");
  paginacoesExistentes.forEach(function (elemento) {
    elemento.remove();
  });
}

// ==========================================================================
// 6. LISTENERS DE EVENTOS DE ENTRADA (MANDATÁRIOS E PROTEGIDOS)
// ==========================================================================

// Salvamento de transações protegido: Volta a funcionar imediatamente!
if (formulario) {
  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const novaTransacao = {
      descricao: campoDescricao.value,
      valor: Number(campoValor.value),
      tipo: campoTipo.value,
      data: campoData.value,
    };

    transacoes.push(novaTransacao);
    atualizarSaldos();
    formulario.reset();
  });
}

function iniciarAplicativo(email) {
  transacoes = JSON.parse(localStorage.getItem("transacoes_" + email)) || [];
  atualizarSaldos();
}

// Escutadores dos filtros protegidos contra ausência de ID
if (filtroMes) {
  filtroMes.addEventListener("change", function () {
    paginaAtual = 1;
    atualizarSaldos();
  });
}

if (filtroAno) {
  filtroAno.addEventListener("input", function () {
    paginaAtual = 1;
    atualizarSaldos();
  });
}
