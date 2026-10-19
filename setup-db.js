require("dotenv").config();
const mongoose = require("mongoose");

const Projeto = require("./models/Projeto");
const Tarefa = require("./models/Tarefa");
const Usuario = require("./models/Usuario");

async function setup_db() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado ao MongoDB Atlas");

    await Usuario.createCollection();
    await Projeto.createCollection();
    await Tarefa.createCollection();
    await Usuario.createIndexes();
    console.log("Coleções criadas: usuarios, projetos, tarefas");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

setup_db();
