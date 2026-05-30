// ELEMENTOS DA TELA DE LOGIN
const telaLogin = document.getElementById("tela-login");
const formLogin = document.getElementById("formLogin");
const campoEmail = document.getElementById("loginEmail");
const campoSenha = document.getElementById("loginSenha");
const btnRegistrar = document.getElementById("btnRegistrar");

// ELEMENTOS DO RASTREADOR
const formulario = document.getElementById("formTransacao");
const campoDescricao = document.getElementById("descricao");
const campoValor = document.getElementById("valor");
const campoTipo = document.getElementById("tipo");
const campoData = document.getElementById("data"); // NOVO: Conectado ao campo de data

const listaTransacoes = document.getElementById("transacoes");
const elementoEntradas = document.getElementById("totalEntradas");
const elementoSaidas = document.getElementById("totalSaidas");
const elementoGeral = document.getElementById("totalGeral");

// NOVOS: Conectados aos elementos de filtro do HTML
const filtroMes = document.getElementById("filtroMes");
const filtroAno = document.getElementById("filtroAno");

let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

// 👮‍♂️ MONITOR DE ACESSO
auth.onAuthStateChanged(function (usuario) {
  if (usuario) {
    telaLogin.classList.add("escondido"); // Libera o app
    iniciarAplicativo();
  } else {
    telaLogin.classList.remove("escondido"); // Bloqueia o app
    listaTransacoes.innerHTML = "";
  }
});

// Ação do Botão Entrar
formLogin.addEventListener("submit", function (evento) {
  evento.preventDefault();
  auth
    .signInWithEmailAndPassword(campoEmail.value, campoSenha.value)
    .catch(function (erro) {
      alert("Erro ao acessar: " + erro.message);
    });
});

// Ação do Botão Criar Conta
btnRegistrar.addEventListener("click", function (evento) {
  evento.preventDefault();
  const email = campoEmail.value;
  const senha = campoSenha.value;

  if (!email || !senha) {
    alert("Digite e-mail e senha para cadastrar.");
    return;
  }

  auth
    .createUserWithEmailAndPassword(email, senha)
    .then(function () {
      alert("Conta criada com sucesso!");
    })
    .catch(function (erro) {
      alert("Erro ao cadastrar: " + erro.message);
    });
});

function atualizarSaldos() {
  // Limpamos a lista antes de redesenhar para mostrar apenas o mês/ano filtrado
  listaTransacoes.innerHTML = "";

  let somaEntradas = 0;
  let somaSaidas = 0;

  // Pega o que o usuário selecionou nas caixas de filtro
  const mesSelecionado = filtroMes.value;
  const anoSelecionado = filtroAno.value;

  transacoes.forEach(function (transacao) {
    // Proteção para transações antigas criadas antes de existir o campo data
    const dataDefinida = transacao.data || "2026-05-29";

    // Separa a string "AAAA-MM-DD"
    const partesData = dataDefinida.split("-");
    const anoTransacao = partesData[0];
    const mesTransacao = partesData[1];

    // Regras para verificar se a transação deve aparecer ou não
    const bateMes =
      mesSelecionado === "todos" || mesTransacao === mesSelecionado;
    const bateAno = !anoSelecionado || anoTransacao === anoSelecionado;

    // Se passar no filtro, joga na tela e soma no saldo
    if (bateMes && bateAno) {
      addTransTela(transacao);

      if (transacao.tipo === "entrada") {
        somaEntradas = somaEntradas + transacao.valor;
      } else {
        somaSaidas = somaSaidas + transacao.valor;
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

  // Se a transação tiver data, muda o padrão do sistema (AAAA-MM-DD) para o nosso (DD/MM/AAAA)
  let dataExibicao = "--/--/----";
  if (transacao.data) {
    const [ano, mes, dia] = transacao.data.split("-");
    dataExibicao = `${dia}/${mes}/${ano}`;
  }

  li.innerHTML = `
    <span>${transacao.descricao} <small style="opacity: 0.6; font-size: 0.85rem;">(${dataExibicao})</small></span>
    <span class="valor-transacao">
    ${transacao.tipo === "entrada" ? "+ " : "- "}R$ ${transacao.valor.toFixed(2)}
    </span>
    <button class="botao-deletar">X</button>
  `;

  const botaoDeletar = li.querySelector(".botao-deletar");

  botaoDeletar.addEventListener("click", function () {
    const indice = transacoes.indexOf(transacao);
    transacoes.splice(indice, 1);

    // Atualiza os saldos e o banco, redesenhando a tela sem o item deletado
    atualizarSaldos();
  });
  listaTransacoes.appendChild(li);
}

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const descricao = campoDescricao.value;
  const valor = Number(campoValor.value);
  const tipo = campoTipo.value;
  const data = campoData.value; // NOVO: Pega a data do formulário

  const novaTransacao = {
    descricao: descricao,
    valor: valor,
    tipo: tipo,
    data: data, // NOVO: Guarda a data junto com os outros dados
  };

  transacoes.push(novaTransacao);

  // Executa a atualização completa seguindo os filtros que estiverem ativos na tela
  atualizarSaldos();
  formulario.reset();
});

function iniciarAplicativo() {
  // Agora apenas chamamos o atualizarSaldos, que já cuida de desenhar a tela filtrada
  atualizarSaldos();
}
iniciarAplicativo();

// NOVOS LISTENERS: Avisam o JavaScript para refazer as contas sempre que você mexer nos filtros
filtroMes.addEventListener("change", atualizarSaldos);
filtroAno.addEventListener("input", atualizarSaldos);
