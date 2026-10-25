require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const service = require("./services/taskflowService");

const app = express();
const publicDir = path.join(__dirname, "public");
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Conectado ao MongoDB Atlas"))
    .catch((err) => console.error("Erro ao conectar ao MongoDB:", err.message));
} else {
  console.log("MONGODB_URI não definida; iniciando o frontend sem persistência na API.");
}

app.get("/api", (_req, res) => {
  res.json({
    name: "TaskFlow",
    status: "online",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api", (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ erro: "Banco de dados indisponível" });
  }
  next();
});

app.get("/api/projetos", asyncRoute(async (_req, res) => {
  res.json(await service.listarProjetos());
}));

app.post("/api/projetos", asyncRoute(async (req, res) => {
  const projeto = await service.criarProjeto(req.body);
  res.status(201).json(projeto);
}));

app.get("/api/projetos/:id", asyncRoute(async (req, res) => {
  res.json(await service.buscarProjetoPorId(req.params.id));
}));

app.put("/api/projetos/:id", asyncRoute(async (req, res) => {
  res.json(await service.editarProjeto(req.params.id, req.body));
}));

app.delete("/api/projetos/:id", asyncRoute(async (req, res) => {
  res.json(await service.excluirProjeto(req.params.id));
}));

app.get("/api/projetos/:id/tarefas", asyncRoute(async (req, res) => {
  res.json(await service.listarTarefasDoProjeto(req.params.id));
}));

app.get("/api/projetos/:id/kanban", asyncRoute(async (req, res) => {
  res.json(await service.obterKanban(req.params.id));
}));

app.get("/api/tarefas", asyncRoute(async (req, res) => {
  res.json(await service.filtrarTarefas(req.query));
}));

app.post("/api/tarefas", asyncRoute(async (req, res) => {
  const tarefa = await service.criarTarefa(req.body);
  res.status(201).json(tarefa);
}));

app.get("/api/tarefas/:id", asyncRoute(async (req, res) => {
  res.json(await service.buscarTarefaPorId(req.params.id));
}));

app.put("/api/tarefas/:id", asyncRoute(async (req, res) => {
  res.json(await service.editarTarefa(req.params.id, req.body));
}));

app.patch("/api/tarefas/:id/status", asyncRoute(async (req, res) => {
  res.json(await service.alterarStatus(req.params.id, req.body.status));
}));

app.delete("/api/tarefas/:id", asyncRoute(async (req, res) => {
  res.json(await service.excluirTarefa(req.params.id));
}));

app.get("/api/dashboard", asyncRoute(async (req, res) => {
  res.json(await service.obterDashboard(req.query.projeto));
}));

app.use("/api", (_req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use((err, _req, res, _next) => {
  const status = err.status || (err.name === "ValidationError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ erro: err.message || "Erro interno do servidor" });
});

app.use(express.static(publicDir));
app.get("*path", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TaskFlow disponível em http://localhost:${PORT}`));
