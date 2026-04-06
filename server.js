require('dotenv').config(); 
const app             = require('./src/app');
const connectDatabase = require('./src/config/database');


const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();

    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📖 Documentação Swagger: /api-docs`);
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
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar o banco de dados:', error.message);
    process.exit(1);
  }
};

startServer();