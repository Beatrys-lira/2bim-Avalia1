# Desenho Assinado

Página que recebe um número inteiro entre 1 e 100 e exibe uma figura em SVG, assinada com o e-mail da conta Google usada no login.

A figura é a tabuada modular no círculo: 240 pontos igualmente espaçados numa circunferência, com cada ponto `i` ligado ao ponto `(k * i) mod 240`, em que `k = número + 1`. O número 1 produz uma cardioide, o 2 uma nefroide, e cada valor gera uma figura diferente.

## Funcionamento

O usuário entra com sua conta Google e escolhe um número. A página envia o número em JSON para `POST /api/desenho` e o token de identidade no cabeçalho `Authorization: Bearer <id_token>`.

A Pages Function verifica o token pelo serviço tokeninfo do Google, confere o Client ID e se o e-mail foi verificado. Depois gera o SVG no servidor usando o e-mail confirmado pelo Google. O formulário não possui campo de e-mail.

A API retorna 200 com o SVG quando a requisição é válida, 400 para corpo ou número inválido, 401 para autenticação inválida ou ausente e 405 para métodos diferentes de POST. As verificações seguem a ordem: método, corpo e token.

## Estrutura

```text
public/
  index.html             formulário e botão de login Google
  style.css              aparência da página
  script.js              envio à API, exibição e download do SVG
lib/
  desenho.js             função de geração do SVG
functions/api/
  desenho.js             validação da requisição e do token Google
evidencias/
  exemplo.svg            desenho com o número 6, derivado do RA
```

## Publicação no Cloudflare Pages

Framework preset: `None`. Build command: vazio. Build output directory: `public`.

O Client ID é configurado na variável de ambiente `GOOGLE_CLIENT_ID` no Cloudflare e no botão de login da página. A origem do site deve estar cadastrada nas origens JavaScript autorizadas do cliente OAuth no Google Cloud.

## Identificação

Nome: Beatrys Belo
RA: 2026108406
URL: https://2bim-avalia-beatrys.pages.dev/
