# TaskFlow

Sistema web de gerenciamento de tarefas inspirado no Trello. Permite criar projetos, cadastrar tarefas e acompanhar o andamento de cada uma em um quadro Kanban.

Projeto desenvolvido para a disciplina de **Desenvolvimento Web I** — Universidade Federal de Uberlândia (UFU).

**Professor:** João Henrique de Souza Pereira

---

## Funcionalidades

### Principais

- **Projetos**: criar, editar, excluir e visualizar projetos.
- **Tarefas**: cadastrar tarefas com título, descrição, prazo, prioridade e status.
- **Quadro Kanban**: tarefas divididas nas colunas _A fazer_, _Em andamento_ e _Concluído_.
- **Gerenciamento**: alterar status, editar informações e excluir tarefas.
- **Filtros**: pesquisar tarefas por nome, prioridade, status ou prazo.
- **Dashboard**: resumo com o total de tarefas, pendentes, em andamento e concluídas.

### Extras (planejadas)

- [ ] Cadastro e login de usuários
- [ ] Atribuição de tarefas a membros do projeto
- [ ] Comentários nas tarefas
- [ ] Arrastar tarefas entre as colunas do Kanban
- [ ] Indicador de tarefas atrasadas

---

## Tecnologias

| Camada         | Tecnologia             |
| -------------- | ---------------------- |
| Frontend       | HTML, CSS e JavaScript |
| Backend        | Node.js + Express      |
| Banco de dados | MongoDB Atlas (NoSQL)  |
| ODM            | Mongoose               |

Bibliotecas auxiliares: `cors`, `dotenv`, `bcrypt` e `nodemon` (desenvolvimento).

---

## Estrutura do projeto

```
TaskFlow/
├── models/
│   ├── Projeto.js
│   ├── Tarefa.js
│   └── Usuario.js
├── services/
│   └── taskflowService.js   # operações no banco (CRUD, Kanban, filtros e dashboard)
├── .env                     # variáveis de ambiente (não versionado)
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
├── server.js                # ponto de entrada da API
└── setup-db.js              # cria as coleções do banco, caso não existam
```

---

## Banco de dados

Banco: `gerenciador_tarefas`

### Coleção `projetos`

| Campo       | Tipo       | Descrição                           |
| ----------- | ---------- | ----------------------------------- |
| `nome`      | String     | Nome do projeto (obrigatório)       |
| `descricao` | String     | Descrição do projeto                |
| `dono`      | ObjectId   | Usuário que criou o projeto (extra) |
| `membros`   | ObjectId[] | Participantes do projeto (extra)    |
| `createdAt` | Date       | Data de criação (automático)        |

### Coleção `tarefas`

| Campo         | Tipo     | Descrição                                 |
| ------------- | -------- | ----------------------------------------- |
| `titulo`      | String   | Título da tarefa (obrigatório)            |
| `descricao`   | String   | Detalhes da tarefa                        |
| `prioridade`  | String   | `baixa`, `media` ou `alta`                |
| `status`      | String   | `a_fazer`, `em_andamento` ou `concluido`  |
| `prazo`       | Date     | Data limite                               |
| `projeto`     | ObjectId | Projeto ao qual pertence (obrigatório)    |
| `responsavel` | ObjectId | Membro atribuído (extra)                  |
| `comentarios` | Array    | Lista de `{ autor, texto, data }` (extra) |
| `createdAt`   | Date     | Data de criação (automático)              |

### Coleção `usuarios`

| Campo       | Tipo   | Descrição                             |
| ----------- | ------ | ------------------------------------- |
| `nome`      | String | Nome do usuário (obrigatório)         |
| `email`     | String | E-mail de login (obrigatório e único) |
| `senha`     | String | Senha criptografada com bcrypt        |
| `createdAt` | Date   | Data de cadastro (automático)         |

---

## Operações no banco

As funções em `services/taskflowService.js` executam todas as operações no MongoDB. As rotas do Express apenas chamam essas funções.

| Funcionalidade | Funções                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Projetos       | `criarProjeto`, `listarProjetos`, `buscarProjetoPorId`, `editarProjeto`, `excluirProjeto`                      |
| Tarefas        | `criarTarefa`, `listarTarefasDoProjeto`, `buscarTarefaPorId`, `editarTarefa`, `alterarStatus`, `excluirTarefa` |
| Quadro Kanban  | `obterKanban` — tarefas de um projeto separadas por status                                                     |
| Filtros        | `filtrarTarefas` — por nome, prioridade, status, prazo e projeto (combináveis)                                 |
| Dashboard      | `obterDashboard` — total, pendentes, em andamento, concluídas e atrasadas                                      |

Observações:

- Excluir um projeto também exclui todas as tarefas dele.
- Uma tarefa só pode ser criada em um projeto existente.
- Os erros retornam um código HTTP (`400` para dados inválidos, `404` para registro não encontrado).

---

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org) (versão LTS)
- [Git](https://git-scm.com)
- Acesso ao cluster do MongoDB Atlas (peça os dados de conexão ao grupo)

### Passo a passo

1. **Clone o repositório**

   ```bash
   git clone https://github.com/Tensei-dev/TaskFlow.git
   cd TaskFlow
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Crie o arquivo `.env`** na raiz do projeto:

   ```dotenv
   MONGODB_URI="mongodb+srv://USUARIO:SENHA@CLUSTER.mongodb.net/gerenciador_tarefas?retryWrites=true&w=majority"
   PORT=3000
   ```

4. **Prepare o banco de dados**

   ```bash
   node setup-db.js
   ```

   O script cria as coleções `usuarios`, `projetos` e `tarefas` (e o índice único de e-mail) somente se ainda não existirem.

5. **Inicie o servidor**
   ```bash
   npx nodemon server.js
   ```
   Se aparecer `Conectado ao MongoDB Atlas`, a API está rodando em `http://localhost:3000`.

### Problema comum no Windows

Se o PowerShell mostrar o erro _"a execução de scripts foi desabilitada neste sistema"_, rode:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Ou use o terminal **Command Prompt** (cmd) no lugar do PowerShell.

---

## Equipe

| Nome               | GitHub                                       |
| ------------------ | -------------------------------------------- |
| Rodrigo Lemes Zago | [@Tensei-dev](https://github.com/Tensei-dev) |

---

## Licença

Projeto acadêmico, sem fins comerciais.
