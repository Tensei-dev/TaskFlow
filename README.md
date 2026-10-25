# TaskFlow

Sistema web de gerenciamento de tarefas inspirado no Trello. A aplicação reúne uma interface responsiva, quadro Kanban, dashboard, projetos, calendário e filtros, além da estrutura de backend em Node.js e dos modelos para MongoDB.

Projeto desenvolvido para a disciplina de **Desenvolvimento Web I** — Universidade Federal de Uberlândia (UFU).

## Funcionalidades do frontend

- Dashboard com totais por status, progresso e próximos prazos.
- Criação, edição e exclusão de projetos e tarefas.
- Quadro Kanban com movimentação por arrastar e soltar.
- Visualização em lista e alteração direta de status.
- Busca e filtros combinados por projeto, prioridade, status e prazo.
- Calendário mensal, comentários e alertas de tarefas atrasadas.
- Layout responsivo e navegação acessível por teclado.

Quando o MongoDB está configurado, o frontend carrega e salva projetos, tarefas, comentários e mudanças do Kanban pela API REST. Se o banco estiver indisponível, a interface continua funcional e mantém os dados no `localStorage`, sob a chave `taskflow.workspace.v1`.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Frontend | HTML, CSS e JavaScript |
| Backend | Node.js e Express |
| Banco de dados | MongoDB Atlas |
| ODM | Mongoose |

## Estrutura

```text
TaskFlow/
├── public/                 # interface web
│   ├── assets/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── models/                 # modelos do MongoDB
├── services/               # operações de dados
├── server.js               # servidor Express e frontend
├── setup-db.js             # preparação das coleções
└── package.json
```

## Como executar

Requer Node.js 20 ou superior.

```bash
npm install
npm start
```

Acesse **http://localhost:3000**. O frontend funciona sem conexão com o MongoDB.

Para avaliar apenas esta entrega de frontend, também é possível abrir `public/index.html` diretamente no navegador, sem instalar dependências.

Para usar o banco, copie `.env.example` para `.env` e substitua os valores de exemplo:

```dotenv
MONGODB_URI="mongodb+srv://USUARIO:SENHA@CLUSTER.mongodb.net/gerenciador_tarefas?retryWrites=true&w=majority"
PORT=3000
```

Comandos adicionais:

```bash
npm run dev       # servidor com reinício automático
npm run setup-db  # prepara as coleções do banco
npm run check     # verifica a sintaxe do JavaScript
```

## API REST

| Método | Endpoint | Operação |
| --- | --- | --- |
| `GET` / `POST` | `/api/projetos` | Listar e criar projetos |
| `GET` / `PUT` / `DELETE` | `/api/projetos/:id` | Consultar, editar e excluir um projeto |
| `GET` | `/api/projetos/:id/tarefas` | Listar tarefas de um projeto |
| `GET` | `/api/projetos/:id/kanban` | Obter as colunas do Kanban |
| `GET` / `POST` | `/api/tarefas` | Filtrar/listar e criar tarefas |
| `GET` / `PUT` / `DELETE` | `/api/tarefas/:id` | Consultar, editar e excluir uma tarefa |
| `PATCH` | `/api/tarefas/:id/status` | Alterar o status de uma tarefa |
| `GET` | `/api/dashboard` | Obter os totais do dashboard |

`GET /api` informa se o servidor está online e se o MongoDB está conectado. Na primeira execução com um banco vazio, os dados iniciais exibidos pela interface são cadastrados automaticamente no MongoDB.

## Verificação para entrega

1. Configure `.env` caso a demonstração utilize o MongoDB.
2. Execute `npm install` e `npm run check`.
3. Inicie com `npm start`.
4. Acesse `http://localhost:3000` e teste criação, edição, exclusão, filtros e movimentação no Kanban.

## Equipe

| Nome | GitHub |
| --- | --- |
| Rodrigo Lemes Zago | [@Tensei-dev](https://github.com/Tensei-dev) |

## Licença

Projeto acadêmico, sem fins comerciais.
