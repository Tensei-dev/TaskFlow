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

Nesta entrega, o frontend usa dados de demonstração salvos no `localStorage` do navegador, sob a chave `taskflow.workspace.v1`. A estrutura de banco permanece no repositório para a etapa de integração com a API.

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

## Equipe

| Nome | GitHub |
| --- | --- |
| Rodrigo Lemes Zago | [@Tensei-dev](https://github.com/Tensei-dev) |

## Licença

Projeto acadêmico, sem fins comerciais.
