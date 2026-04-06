# 📒 Senai Notes — API

API REST para gerenciamento de notas pessoais com autenticação JWT, construída com **Node.js**, **Express** e **MongoDB**.

---

## 📖 Documentação Interativa (Swagger)

> **Esta é a forma recomendada de explorar e testar a API.**

Após iniciar o servidor, acesse:

```
http://localhost:3000/api-docs
```

O Swagger UI oferece uma interface visual completa onde você pode:

- 📋 **Visualizar** todos os endpoints, parâmetros, bodies e responses
- 🔐 **Autenticar** com seu token JWT usando o botão **Authorize 🔒**
- ▶️ **Executar** requisições reais diretamente do navegador, sem necessidade de Postman ou curl
- 📦 **Explorar** os modelos de dados e exemplos de payloads

**Como autenticar no Swagger:**
1. Chame `POST /api/auth/login` dentro do próprio Swagger
2. Copie o valor do campo `data.token` na resposta
3. Clique no botão **Authorize 🔒** (canto superior direito)
4. Cole o token no campo e confirme — todos os endpoints protegidos passam a funcionar

---

## 🚀 Instalação e Configuração

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repositorio>
cd notes-api
npm install
```

### 2. Configurar variáveis de ambiente

O projeto utiliza um arquivo `.env` para todas as configurações sensíveis. Nunca edite o `.env.example` — ele existe apenas como referência.

```bash
cp .env.example .env
```

Abra o arquivo `.env` recém-criado e preencha cada variável conforme as instruções internas do `.env.example`.

#### Gerando o JWT_SECRET

A segurança da autenticação da aplicação depende de uma chave criptográfica forte e imprevisível. Para gerar uma, execute no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Cole o valor gerado na variável `JWT_SECRET` do seu `.env`. Nunca reutilize a mesma chave em ambientes diferentes, e nunca a compartilhe ou versione.

### 3. Executar o servidor

```bash
# Modo desenvolvimento (hot reload via nodemon)
npm run dev

# Modo produção
npm start
```

Ao iniciar, o terminal exibirá:

```
🚀 Servidor rodando em http://localhost:3000
📖 Documentação Swagger: http://localhost:3000/api-docs
🩺 Health check:         http://localhost:3000/health
🌍 Ambiente:             development
```

---

## 📁 Estrutura do Projeto

```
notes-api/
├── server.js                    # Ponto de entrada — conecta ao BD e sobe o servidor HTTP
├── swagger.json                 # Especificação OpenAPI 3.0 completa
├── .env.example                 # Modelo de variáveis de ambiente (não contém valores reais)
├── .gitignore
├── package.json
└── src/
    ├── app.js                   # Configuração do Express: middleware, rotas, Swagger UI
    ├── config/
    │   └── database.js          # Conexão com o MongoDB via Mongoose
    ├── models/
    │   ├── User.js              # Schema do usuário (name, email, password com bcrypt)
    │   └── Note.js              # Schema da nota (title, content, tags, imageUrl, crop, archived)
    ├── services/
    │   ├── authService.js       # Lógica de negócio: registro, login, geração de token
    │   └── noteService.js       # Lógica de negócio: CRUD, busca, filtros, estatísticas
    ├── controllers/
    │   ├── authController.js    # Valida entrada via Zod → chama authService → responde
    │   └── noteController.js    # Valida entrada via Zod → chama noteService → responde
    ├── routes/
    │   ├── authRoutes.js        # POST /api/auth/register e /api/auth/login
    │   └── noteRoutes.js        # CRUD de notas (todas protegidas por authMiddleware)
    ├── middleware/
    │   ├── authMiddleware.js    # Verifica o JWT e injeta req.user com { id, email }
    │   └── errorMiddleware.js   # Handler global de erros — formata todas as respostas de erro
    └── utils/
        ├── ApiError.js          # Classe de erro customizada com statusCode e code
        ├── responseHelper.js    # successResponse() / errorResponse() — garante o formato padrão
        ├── schemas.js           # Schemas Zod para validação de entrada (auth e notas)
        └── validators.js        # Validação de ObjectId, paginação e outros utilitários
```

---

## 🔐 Autenticação JWT

Todas as rotas de notas exigem autenticação. O fluxo é simples:

1. Registre-se ou faça login para obter um token
2. Inclua o token em todas as requisições protegidas:

```http
Authorization: Bearer <seu_token_aqui>
```

**Detalhes de segurança:**
- Tokens expiram conforme `JWT_EXPIRES_IN` (padrão: `7d`)
- O `userId` é sempre extraído do token — jamais do corpo da requisição
- Senhas são armazenadas com **bcrypt** (12 salt rounds)
- O campo `password` tem `select: false` no schema — nunca é retornado em queries

---

## 🗺️ Mapa de Rotas

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET`   | `/health`                  | ✗ | Verificação de disponibilidade |
| `POST`  | `/api/auth/register`       | ✗ | Criar conta |
| `POST`  | `/api/auth/login`          | ✗ | Autenticar e obter token |
| `GET`   | `/api/notes`               | ✓ | Listar notas (com filtros e paginação) |
| `POST`  | `/api/notes`               | ✓ | Criar nota |
| `GET`   | `/api/notes/stats`         | ✓ | Estatísticas agregadas |
| `GET`   | `/api/notes/:id`           | ✓ | Buscar nota por ID |
| `PUT`   | `/api/notes/:id`           | ✓ | Atualizar nota (parcial) |
| `DELETE`| `/api/notes/:id`           | ✓ | Excluir nota permanentemente |
| `PATCH` | `/api/notes/:id/archive`   | ✓ | Alternar status arquivado/ativo |
| `GET`   | `/api-docs`                | ✗ | Interface Swagger UI |

> Para exemplos detalhados de request/response de cada endpoint, acesse `/api-docs`.

---

## 📐 Formato Padrão de Resposta

Toda resposta da API segue um contrato consistente:

**Sucesso:**
```json
{
  "success": true,
  "message": "Descrição da operação",
  "data": { }
}
```

**Listagem (com paginação):**
```json
{
  "success": true,
  "message": "Notes fetched successfully",
  "data": [ ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Erro:**
```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

---

## 🔍 Filtros e Paginação

`GET /api/notes` suporta os seguintes parâmetros de query:

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page`     | number  | `1`  | Página atual |
| `limit`    | number  | `10` | Itens por página (máx. 100) |
| `search`   | string  | —    | Busca case-insensitive em `title` e `content` |
| `tag`      | string  | —    | Filtra notas que contenham exatamente esta tag |
| `archived` | boolean | —    | `true` / `false` (omitir = todas) |

Todos os filtros são combináveis:

```
GET /api/notes?search=reunião&tag=trabalho&archived=false&page=2&limit=5
```

---

## 🖼️ Imagem e Recorte (crop)

O campo `imageUrl` é **opcional** e aceita qualquer URL válida (`http` ou `https`).

O campo `crop` é também **opcional** e armazena as coordenadas de recorte como porcentagem da imagem:

```json
{
  "imageUrl": "https://example.com/foto.jpg",
  "crop": { "x": 10, "y": 5, "width": 80, "height": 90 }
}
```

**Importante:** O backend apenas armazena e retorna esses valores — o processamento visual do recorte é responsabilidade do frontend (via CSS `backgroundSize` / `backgroundPosition` ou `object-fit`). Nenhuma imagem é modificada no servidor.

Uma nota pode ser criada com apenas `title` e `content`, sem qualquer imagem:

```json
{ "title": "Minha nota", "content": "Conteúdo aqui." }
```

---

## 🛡️ Segurança

| Aspecto | Implementação |
|---------|---------------|
| Senhas | bcrypt com 12 salt rounds |
| Exposição de senha | `select: false` no schema + `toJSON()` remove o campo |
| Autenticação | JWT verificado em cada requisição protegida |
| Isolamento de dados | `userId` sempre extraído do JWT, nunca do body |
| Propriedade de notas | `findOne({ _id, userId })` — 404 se não for dono |
| Validação de entrada | Zod: trim, lowercase, deduplicação, limites de tamanho |
| Headers HTTP | Helmet com CSP completo (relaxado apenas no `/api-docs`) |
| Erros em produção | Stack traces ocultados quando `NODE_ENV=production` |

---

## 📦 Dependências Principais

```bash
# Instalar todas as dependências de uma vez
npm install

# Caso precise instalar swagger-ui-express individualmente
npm install swagger-ui-express
```

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `express` | 4.x | Framework HTTP |
| `mongoose` | 8.x | ODM para MongoDB |
| `jsonwebtoken` | 9.x | Geração e verificação de JWT |
| `bcryptjs` | 2.x | Hash de senhas |
| `zod` | 4.x | Validação de schemas |
| `helmet` | 7.x | Headers de segurança HTTP |
| `cors` | 2.x | Política de CORS |
| `dotenv` | 16.x | Variáveis de ambiente |
| `swagger-ui-express` | 5.x | Interface visual da documentação |
| `express-async-errors` | 3.x | Tratamento de erros assíncronos |
| `nodemon` | 3.x (dev) | Hot reload em desenvolvimento |

---

## 🌐 Conectando com um Frontend (Angular)

### Interceptor de autenticação

```typescript
// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

### Consumindo a listagem de notas

```typescript
// A resposta tem `data` como array plano — sem aninhamento extra
this.http.get<NotesListResponse>('/api/notes').subscribe(res => {
  this.notes      = res.data;        // array direto
  this.pagination = res.pagination;  // { total, page, limit, totalPages }
});
```

### Tratamento de erros padronizado

```typescript
this.http.post('/api/notes', body).pipe(
  catchError(err => {
    const message = err.error?.message ?? 'Erro desconhecido';
    const code    = err.error?.error?.code ?? 'INTERNAL_ERROR';
    console.error(`[${code}] ${message}`);
    return throwError(() => err);
  })
).subscribe(res => { /* ... */ });
```