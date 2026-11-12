require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const publicDir = path.join(__dirname, "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Conectado ao MongoDB Atlas"))
    .catch((err) => console.error("Erro ao conectar ao MongoDB:", err.message));
} else {
  console.log("MONGODB_URI não definida; iniciando somente o frontend.");
}

app.get("/api", (_req, res) => {
  res.json({ name: "TaskFlow", status: "online" });
});

app.get("*path", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TaskFlow disponível em http://localhost:${PORT}`));
