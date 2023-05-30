const express = require('express');
const router = express.Router();
const https = require('https');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Insira o caminho de seu certificado .p12 dentro de seu projeto
const certificado = fs.readFileSync(process.env.CERTIFICADO_PROD_PATH);

// Insira os valores de suas credenciais em desenvolvimento do pix
const credenciais = {
  client_id: process.env.PROD_CLIENT_ID,
  client_secret: process.env.PROD_CLIENT_SECRET,
};

let accessToken = '';
let tokenType = '';
let expiresIn = 0;
let tokenExpirationTimeout;

const data = JSON.stringify({ grant_type: 'client_credentials' });
const data_credentials = credenciais.client_id + ':' + credenciais.client_secret;

// Codificando as credenciais em base64
const auth = Buffer.from(data_credentials).toString('base64');

// Configuração do agente https com o certificado
const agent = new https.Agent({
  pfx: certificado,
  passphrase: '',
});

// Função para obter o access token
const getAccessToken = async () => {
  try {
    const config = {
      method: 'POST',
      url: process.env.PROD_URL + '/oauth/token',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
      data: data,
    };

    const response = await axios(config);
    accessToken = response.data.access_token;
    tokenType = response.data.token_type;
    expiresIn = response.data.expires_in;

    // Configurar o timeout para renovar o token antes de expirar
    const timeout = expiresIn * 1000; // converter para milissegundos
    clearTimeout(tokenExpirationTimeout);
    tokenExpirationTimeout = setTimeout(getAccessToken, timeout);

    console.log('Access token obtido com sucesso!');
  } catch (error) {
    console.error(error);
    console.log('Erro na obtenção do access token');
  }
};

// Rota para criar cobrança imediata
router.post('/cob', async (req, res) => {
  try {
    if (!accessToken || expiresIn <= 0) {
      await getAccessToken();
    }

    const { cpf, nome, original } = req.body;
    const chave = process.env.CHAVE_PIX;

    const cobranca = {
      calendario: {
        expiracao: 3600
      },
      PRODedor: {
        cpf,
        nome
      },
      valor: {
        original
      },
      chave,
      solicitacaoPagador: "Luana BOT!"
    };

    const config = {
      method: 'POST',
      url: process.env.PROD_URL + '/v2/cob',
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
      data: cobranca,
    };

    const response = await axios(config);

    const { expiracao } = response.data.calendario;
    const { id } = response.data.loc;
    const { status, PRODedor, valor, solicitacaoPagador, qrcode, imagemQrcode } = response.data;

    console.log('Valores retornados:');
    console.log('Expiração:', expiracao);
    console.log('ID:', id);
    console.log('Status:', status);
    console.log('PRODedor:', PRODedor);
    console.log('Valor:', valor);
    console.log('Solicitação do Pagador:', solicitacaoPagador);
    console.log('QR Code:', qrcode);
    console.log('Imagem QR Code:', imagemQrcode);

    // Armazena o ID retornado
    const cobrancaId = id;

    // Faz a requisição para obter o QR Code
    const qrcodeConfig = {
      method: 'GET',
      url: `${process.env.PROD_URL}/v2/loc/${cobrancaId}/qrcode`,
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
        'Content-Type': 'application/json',
        // Certificado
      },
      httpsAgent: agent,
    };

    const qrcodeResponse = await axios(qrcodeConfig);

    // Retorna o resultado para o usuário
    res.send({
      expiracao,
      status,
      PRODedor,
      valor,
      solicitacaoPagador,
      qrcode: qrcodeResponse.data.qrcode,
      imagemQrcode: qrcodeResponse.data.imagemQrcode
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar cobrança');
  }
});

module.exports = router;
