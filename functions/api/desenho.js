import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Método não permitido.", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  let dados;

  try {
    dados = await request.json();
  } catch {
    return new Response("Envie um JSON válido.", { status: 400 });
  }

  if (!numeroValido(dados?.numero)) {
    return new Response("O número deve ser um inteiro entre 1 e 100.", {
      status: 400,
    });
  }

  const autorizacao = request.headers.get("Authorization");
  const token = autorizacao?.match(/^Bearer\s+(\S+)$/i)?.[1];

  if (!token) {
    return new Response("Entre com sua conta Google.", { status: 401 });
  }

  let conta;

  try {
    const resposta = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );

    if (resposta.status !== 200) {
      return new Response("Login inválido ou expirado.", { status: 401 });
    }

    conta = await resposta.json();
  } catch {
    return new Response("Não foi possível verificar o login.", {
      status: 401,
    });
  }

  if (
    !env.GOOGLE_CLIENT_ID ||
    conta.aud !== env.GOOGLE_CLIENT_ID ||
    conta.email_verified !== "true" ||
    typeof conta.email !== "string" ||
    !conta.email
  ) {
    return new Response("Conta Google não autorizada.", { status: 401 });
  }

  const svg = gerarDesenho(dados.numero, conta.email);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}