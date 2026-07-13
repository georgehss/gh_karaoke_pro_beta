// Arquivo: netlify/functions/login.js

exports.handler = async function (event, context) {
  // Configuração de CORS (importante caso acesse de outro domínio, como localhost)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Se o navegador mandar um OPTIONS (preflight check), respondemos ok
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Apenas aceitamos POST (igual no Python)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ erro: "Método não permitido" })
    };
  }

  try {
    // Pega o que o app enviou
    const body = JSON.parse(event.body);
    const { username, password } = body;

    // === LÓGICA DE VALIDAÇÃO ===
    // Aqui você pode colocar a regra que quiser. 
    // Para simplificar, se não for vazio, passa.
    if (!username || !password) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ erro: "Usuário ou senha não podem ser vazios!" })
      };
    }

    // Se deu certo, monta a resposta com a estrutura idêntica a do servidor Python
    const respostaSucesso = {
      token: "gh-pro-netlify-token-" + Date.now(), // Gera um token aleatório simples
      user: {
        id: "1",
        username: username,
        isPro: true
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(respostaSucesso)
    };

  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ erro: "Erro ao processar a requisição." })
    };
  }
};