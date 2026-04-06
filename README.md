# 📒 Notes API

API REST de gerenciamento de notas com autenticação JWT, construída com Node.js, Express e MongoDB.

---

## 📁 Estrutura do Projeto

```
notes-api/
├── server.js                   # Ponto de entrada — inicia servidor
├── .env.example                # Modelo de variáveis de ambiente
├── .gitignore
├── package.json
└── src/
    ├── app.js                  # Configuração do Express
    ├── config/
    │   └── database.js         # Conexão com MongoDB
    ├── controllers/
    │   ├── authController.js   # Recebe req/res de autenticação
    │   └── noteController.js   # Recebe req/res de notas
    ├── services/
    │   ├── authService.js      # Lógica: registro e login
    │   └── noteService.js      # Lógica: CRUD de notas
    ├── models/
    │   ├── User.js             # Schema do usuário
    │   └── Note.js             # Schema da nota
    ├── routes/
    │   ├── authRoutes.js       # Rotas públicas
    │   └── noteRoutes.js       # Rotas protegidas
    ├── middleware/
    │   ├── authMiddleware.js   # Verificação do JWT
    │   └── errorMiddleware.js  # Tratamento global de erros
    └── utils/
        ├── ApiError.js         # Classe de erro personalizada
        └── responseHelper.js   # Padronização de respostas
```

---

## ⚙️ Como configurar e rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/notes-api
JWT_SECRET=sua_chave_secreta_longa
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4200
```

> **Gerar JWT_SECRET seguro:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3. Rodar o projeto

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

### 4. Verificar se está rodando

```
GET http://localhost:3000/health
```

Resposta esperada:
```json
{ "status": "ok", "ambiente": "development", "timestamp": "..." }
```

---

## 🔗 Endpoints da API

### Autenticação (pública)

| Método | Rota                  | Descrição          |
|--------|-----------------------|--------------------|
| POST   | /api/auth/register    | Registrar usuário  |
| POST   | /api/auth/login       | Fazer login        |

### Notas (protegidas — exigem Bearer Token)

| Método | Rota              | Descrição              |
|--------|-------------------|------------------------|
| GET    | /api/notes        | Listar todas as notas  |
| POST   | /api/notes        | Criar nova nota        |
| GET    | /api/notes/:id    | Buscar nota por ID     |
| PUT    | /api/notes/:id    | Atualizar nota         |
| DELETE | /api/notes/:id    | Deletar nota           |

---

## 📨 Exemplos de requisições

### Registrar usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "minhasenha123"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "senha": "minhasenha123"
}
```

### Criar nota
```http
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Minha primeira nota",
  "conteudo": "Conteúdo da nota aqui"
}
```

---

## 🔐 Segurança

- Senhas hashadas com **bcrypt** (salt rounds: 12)
- Autenticação via **JWT** (expiração configurável)
- `usuarioId` extraído **sempre do token**, nunca do body
- Headers de segurança via **helmet**
- **CORS** configurado por variável de ambiente
- Erros sensíveis não expostos em produção
- Campos de senha com `select: false` no schema