const mongoose = require('mongoose');

/**
 * Conecta ao MongoDB usando a URI definida em variável de ambiente.
 * Encerra o processo em caso de falha crítica para evitar estado inválido.
 */
const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1); // Encerra se não houver banco
  }
};

module.exports = connectDatabase;