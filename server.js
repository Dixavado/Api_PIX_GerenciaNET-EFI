require('dotenv').config(); // Carregar variáveis de ambiente do arquivo .env

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json()); // Configurar o body-parser para interpretar o corpo das requisições como JSON
const port = process.env.PORT || 3000; // Usar a porta definida no arquivo .env ou a porta 3000 como padrão

// Importar as rotas do arquivo routes.js e pix.routes.js
const routes = require('./routes/routes');
const pixDev = require('./routes/pix_dev.routes');
const pixProd = require('./routes/pix_prod.routes');

// Configurar o mecanismo de visualização EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Configurar o diretório estático do EJS
app.use(express.static(__dirname + '/views/public'));

// Utilizar as rotas
app.use('/', routes);
app.use('/dev', pixDev); // Rota específica para Homologação
app.use('/prod', pixProd); // Rota específica para Produção

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
