// ==========================================
// 🔐 SISTEMA DE AUTENTICAÇÃO LOCAL (SEM FIREBASE)
// ==========================================

// Elementos da Tela de Login
const telaLogin = document.getElementById("tela-login");
const formLogin = document.getElementById("formLogin");
const campoEmail = document.getElementById("loginEmail");
const campoSenha = document.getElementById("loginSenha");
const btnRegistrar = document.getElementById("btnRegistrar");

// Elementos do Rastreador
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

const filtroMes = document.getElementById("filtroMes");
const filtroAno = document.getElementById("filtroAno");

// Banco de dados local do navegador
let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
let usuariosCadastrados =
  JSON.parse(localStorage.getItem("usuarios_rastreador")) || [];

// 👮‍♂️ VERIFICADOR DE SESSÃO LOCAL
// Se o usuário já logou antes nesta sessão, libera direto
if (sessionStorage.getItem("usuarioLogado") === "true") {
  telaLogin.classList.add("escondido");
  iniciarAplicativo();
} else {
  telaLogin.classList.remove("escondido");
}

// Ação do Botão: Entrar no Sistema
formLogin.addEventListener("submit", function (evento) {
  evento.preventDefault();
  const emailDigitado = campoEmail.value.trim();
  const senhaDigitada = campoSenha.value;

  // Procura o usuário na nossa lista local
  const usuarioEncontrado = usuariosCadastrados.find(
    (u) => u.email === emailDigitado && u.senha === senhaDigitada,
  );

  if (usuarioEncontrado) {
    sessionStorage.setItem("usuarioLogado", "true");
    telaLogin.classList.add("escondido");
    iniciarAplicativo();
  } else {
    alert(
      "E-mail ou senha incorretos! Se ainda não tem conta, clique em 'Criar conta agora'.",
    );
  }
});

// Ação do Botão: Criar Conta Localmente
btnRegistrar.addEventListener("click", function (evento) {
  evento.preventDefault();
  const emailDigitado = campoEmail.value.trim();
  const senhaDigitada = campoSenha.value;

  if (!emailDigitado || !senhaDigitada) {
    alert("Por favor, preencha o e-mail e a senha para cadastrar.");
    return;
  }

  if (senhaDigitada.length < 4) {
    alert("A senha precisa ter pelo menos 4 caracteres.");
    return;
  }

  // Verifica se o e-mail já existe na nossa lista local
  const usuarioExiste = usuariosCadastrados.some(
    (u) => u.email === emailDigitado,
  );
  if (usuarioExiste) {
    alert("Este e-mail já está cadastrado!");
    return;
  }

  // Salva o novo usuário na lista do localStorage
  usuariosCadastrados.push({ email: emailDigitado, senha: senhaDigitada });
  localStorage.setItem(
    "usuarios_rastreador",
    JSON.stringify(usuariosCadastrados),
  );

  alert(
    "Conta criada localmente com sucesso! Agora clique em 'Entrar no Sistema'.",
  );
  formulario.reset();
});

// 🚪 AÇÃO DO BOTÃO: SAIR DO SISTEMA (LOGOUT)
btnSair.addEventListener("click", function () {
  // 1. Remove a permissão de acesso da sessão atual
  sessionStorage.removeItem("usuarioLogado");

  // 2. Tira a classe 'escondido' para a tela de login cobrir tudo de novo
  telaLogin.classList.remove("escondido");

  // 3. Limpa os dados da tela por privacidade
  listaTransacoes.innerHTML = "";
  elementoEntradas.innerHTML = "R$ 0.00";
  elementoSaidas.innerHTML = "R$ 0.00";
  elementoGeral.innerHTML = "R$ 0.00";

  // Opcional: Limpa os campos digitados no formulário de login anterior
  campoEmail.value = "";
  campoSenha.value = "";
});

// ==========================================
// 📊 FUNÇÕES DE CÁLCULO E FILTROS DO RASTREADOR
// ==========================================

function atualizarSaldos() {
  listaTransacoes.innerHTML = "";
  let somaEntradas = 0;
  let somaSaidas = 0;

  const mesSelecionado = filtroMes.value;
  const anoSelecionado = filtroAno.value;

  transacoes.forEach(function (transacao) {
    const dataDefinida = transacao.data || "2026-05-30";
    const partesData = dataDefinida.split("-");
    const anoTransacao = partesData[0];
    const mesTransacao = partesData[1];

    const bateMes =
      mesSelecionado === "todos" || mesTransacao === mesSelecionado;
    const bateAno = !anoSelecionado || anoTransacao === anoSelecionado;

    if (bateMes && bateAno) {
      addTransTela(transacao);
      if (transacao.tipo === "entrada") {
        somaEntradas += transacao.valor;
      } else {
        somaSaidas += transacao.valor;
      }
    }
  });

  const totalGeral = somaEntradas - somaSaidas;
  elementoEntradas.innerHTML = `R$ ${somaEntradas.toFixed(2)}`;
  elementoSaidas.innerHTML = `R$ ${somaSaidas.toFixed(2)}`;
  elementoGeral.innerHTML = `R$ ${totalGeral.toFixed(2)}`;

  localStorage.setItem("transacoes", JSON.stringify(transacoes));
}

function addTransTela(transacao) {
  const li = document.createElement("li");
  li.classList.add("transacao", transacao.tipo);

  let dataExibicao = "--/--/----";
  if (transacao.data) {
    const [ano, mes, dia] = transacao.data.split("-");
    dataExibicao = `${dia}/${mes}/${ano}`;
  }

  li.innerHTML = `
        <span>${transacao.descricao} <small style="opacity: 0.6; font-size: 0.85rem;">(${dataExibicao})</small></span>
        <span class="valor-transacao">${transacao.tipo === "entrada" ? "+ " : "- "}R$ ${transacao.valor.toFixed(2)}</span>
        <button class="botao-deletar">X</button>
    `;

  li.querySelector(".botao-deletar").addEventListener("click", function () {
    const indice = transacoes.indexOf(transacao);
    transacoes.splice(indice, 1);
    atualizarSaldos();
  });
  listaTransacoes.appendChild(li);
}

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

function iniciarAplicativo() {
  atualizarSaldos();
}

filtroMes.addEventListener("change", atualizarSaldos);
filtroAno.addEventListener("input", atualizarSaldos);
