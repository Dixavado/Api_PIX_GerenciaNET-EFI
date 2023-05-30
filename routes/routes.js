const express = require('express');
const router = express.Router();

// Rota para a página inicial
router.get('/', (req, res) => {
  res.render('index');
});

// Exportar o router para ser utilizado em outro lugar
module.exports = router;
