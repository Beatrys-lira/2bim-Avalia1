const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");
const botaoGerar = document.getElementById("gerar");
const login = document.getElementById("login");
const estudio = document.getElementById("estudio");
const vazio = document.getElementById("vazio");
const foto = document.getElementById("foto");
let tokenGoogle = "";
let svgAtual = "";
let versao = 0;
let verificacao = 0;
let expiracao;

function desconectar() {
  versao++;
  verificacao++;
  clearTimeout(expiracao);
  tokenGoogle = "";
  svgAtual = "";
  area.innerHTML = "";
  vazio.hidden = false;
  botaoBaixar.hidden = true;
  campoNumero.disabled = true;
  botaoGerar.disabled = true;
  botaoGerar.textContent = "Gerar desenho";
  estudio.hidden = true;
  login.hidden = false;
  foto.hidden = true;
  foto.removeAttribute("src");
  document.getElementById("nome").textContent = "";
  document.getElementById("email").textContent = "";
}

window.receberLogin = async function (resposta) {
  desconectar();
  const tentativa = verificacao;
  mensagem.textContent = "Confirmando sua conta Google…";
  try {
    const token = resposta.credential;
    const resultado = await fetch("/api/me", { headers: { Authorization: "Bearer " + token } });
    const conta = await resultado.json();
    if (tentativa !== verificacao) return;
    if (!resultado.ok) throw new Error(conta.erro || "Não foi possível entrar.");
    tokenGoogle = token;
    const nome = conta.nome;
    document.getElementById("nome").textContent = nome;
    document.getElementById("email").textContent = conta.email;
    document.getElementById("saudacao").textContent = "Olá, " + nome.split(" ")[0] + "!";
    document.getElementById("iniciais").textContent = nome.charAt(0).toUpperCase();
    foto.onerror = () => { foto.hidden = true; };
    try {
      const url = new URL(conta.foto);
      if (url.protocol === "https:") { foto.src = url.href; foto.hidden = false; }
    } catch {}
    login.hidden = true;
    estudio.hidden = false;
    campoNumero.disabled = false;
    botaoGerar.disabled = false;
    mensagem.textContent = "";
    campoNumero.focus();
    try {
      const parte = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const dados = JSON.parse(atob(parte));
      const tempo = dados.exp * 1000 - Date.now();
      if (Number.isFinite(tempo)) expiracao = setTimeout(() => {
        desconectar();
        mensagem.textContent = "Sua sessão expirou. Entre novamente para continuar.";
      }, Math.max(0, tempo));
    } catch {}
  } catch (erro) {
    if (tentativa !== verificacao) return;
    mensagem.textContent = erro.message || "Erro de conexão. Tente novamente.";
  }
};

document.getElementById("sair").addEventListener("click", () => {
  desconectar();
  mensagem.textContent = "Você saiu da conta. Entre novamente para gerar um desenho.";
  window.google?.accounts?.id?.disableAutoSelect();
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!tokenGoogle) {
    mensagem.textContent = "Entre com sua conta Google para desenhar.";
    return;
  }
  const numero = Number(campoNumero.value);
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }
  const atual = ++versao;
  const token = tokenGoogle;
  mensagem.textContent = "Criando seu desenho…";
  svgAtual = "";
  area.innerHTML = "";
  botaoBaixar.hidden = true;
  vazio.hidden = false;
  botaoGerar.disabled = true;
  botaoGerar.textContent = "Criando…";
  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ numero }),
    });
    if (atual !== versao || token !== tokenGoogle) return;
    if (resposta.status === 401) {
      desconectar();
      mensagem.textContent = "Login inválido ou expirado. Entre novamente com Google.";
      return;
    }
    if (resposta.status === 400) {
      mensagem.textContent = "Número inválido. Digite um inteiro entre 1 e 100.";
      return;
    }
    if (!resposta.ok) throw new Error("Não foi possível gerar o desenho.");
    const svg = await resposta.text();
    if (atual !== versao || token !== tokenGoogle) return;
    svgAtual = svg;
    area.innerHTML = svgAtual;
    vazio.hidden = true;
    botaoBaixar.hidden = false;
    mensagem.textContent = "Pronto! Seu desenho está assinado e pode ser baixado.";
  } catch (erro) {
    if (atual === versao) mensagem.textContent = erro.message || "Erro de conexão. Tente novamente.";
  } finally {
    if (atual === versao && tokenGoogle) {
      botaoGerar.disabled = false;
      botaoGerar.textContent = "Gerar desenho";
    }
  }
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual || !tokenGoogle) return;
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
