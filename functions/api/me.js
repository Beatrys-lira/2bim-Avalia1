export async function onRequest({ request, env }) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const responder = (dados, status) => new Response(JSON.stringify(dados), { status, headers });
  if (request.method !== "GET") return responder({ erro: "Método não permitido." }, 405);
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return responder({ erro: "Entre com sua conta Google." }, 401);
  try {
    const resposta = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token));
    if (resposta.status !== 200) return responder({ erro: "Login inválido ou expirado." }, 401);
    const conta = await resposta.json();
    if (!env.GOOGLE_CLIENT_ID || conta.aud !== env.GOOGLE_CLIENT_ID || conta.email_verified !== "true" || !conta.email) {
      return responder({ erro: "Conta Google não autorizada." }, 401);
    }
    return responder({ nome: conta.name || conta.given_name || conta.email.split("@")[0], email: conta.email, foto: conta.picture || "" }, 200);
  } catch {
    return responder({ erro: "Não foi possível verificar o login. Tente novamente." }, 503);
  }
}
