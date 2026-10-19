require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Projeto = require("./models/Projeto");
const Tarefa = require("./models/Tarefa");
const Usuario = require("./models/Usuario");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado ao MongoDB Atlas");

    await Usuario.createCollection();
    await Projeto.createCollection();
    await Tarefa.createCollection();
    await Usuario.syncIndexes();
    console.log("Coleções criadas: usuarios, projetos, tarefas");

    const usuario = await Usuario.create({
      nome: "Rodrigo",
      email: "rodrigo@exemplo.com",
      senha: await bcrypt.hash("123456", 10),
    });

    const projeto = await Projeto.create({
      nome: "Site da empresa",
      descricao: "Desenvolvimento do novo site institucional",
      dono: usuario._id,
      membros: [usuario._id],
    });

    await Tarefa.insertMany([
      {
        titulo: "Criar tela de login",
        descricao: "Formulário com e-mail e senha",
        prioridade: "alta",
        status: "a_fazer",
        prazo: new Date("2026-11-05"),
        projeto: projeto._id,
        responsavel: usuario._id,
      },
      {
        titulo: "Montar quadro Kanban",
        descricao: "Três colunas: A fazer, Em andamento e Concluído",
        prioridade: "media",
        status: "em_andamento",
        prazo: new Date("2026-11-10"),
        projeto: projeto._id,
      },
      {
        titulo: "Configurar banco no Atlas",
        prioridade: "baixa",
        status: "concluido",
        prazo: new Date("2026-10-19"),
        projeto: projeto._id,
        comentarios: [{ autor: usuario._id, texto: "Conexão funcionando!" }],
      },
    ]);

    console.log("Dados de exemplo inseridos com sucesso");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
