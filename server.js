require('dotenv').config(); // Must load .env BEFORE any other module
const app             = require('./src/app');
const connectDatabase = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📖 Documentação Swagger: http://localhost:${PORT}/api-docs`);
    console.log(`🩺 Health check:         http://localhost:${PORT}/health`);
    console.log(`🌍 Ambiente:             ${process.env.NODE_ENV || 'development'}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} recebido. Encerrando servidor...`);
    server.close(() => {
      console.log('✅ Servidor encerrado com sucesso');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error('❌ UnhandledRejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();