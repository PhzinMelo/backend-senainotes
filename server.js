require('dotenv').config(); // Carrega .env ANTES de qualquer outro módulo
const app = require('./src/app');
const connectDatabase = require('./src/config/database');

const PORT = process.env.PORT || 3000;

/**
 * Inicialização do servidor.
 * Conecta ao banco primeiro — só sobe o HTTP se a conexão for bem-sucedida.
 */
const startServer = async () => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  });

  // ─── Graceful shutdown: fecha conexões ao encerrar o processo ────────────
  const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} recebido. Encerrando servidor...`);
    server.close(() => {
      console.log('✅ Servidor encerrado com sucesso');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();