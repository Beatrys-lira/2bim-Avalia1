const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let tokenGoogle = "";
let svgAtual = "";

window.receberLogin = function (resposta) {
  tokenGoogle = resposta.credential;
  mensagem.textContent = "Login realizado! Escolha um número para desenhar.";
};

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  svgAtual = "";
  area.innerHTML = "";
  botaoBaixar.hidden = true;

  const numero = Number(campoNumero.value);

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }

  if (!tokenGoogle) {
    mensagem.textContent = "Entre com sua conta Google para desenhar.";
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGoogle}`,
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Número inválido. Digite um inteiro entre 1 e 100.";
      return;
    }

    if (resposta.status === 401) {
      tokenGoogle = "";
      mensagem.textContent = "Login inválido ou expirado. Entre novamente com Google.";
      return;
    }

    if (!resposta.ok) {
      mensagem.textContent = "Não foi possível gerar o desenho.";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch {
    mensagem.textContent = "Erro de conexão. Tente novamente.";
  }
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) return;

  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = "exemplo.svg";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
});