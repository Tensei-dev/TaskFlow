require("dotenv").config();
const mongoose = require("mongoose");

const Projeto = require("./models/Projeto");
const Tarefa = require("./models/Tarefa");
const Usuario = require("./models/Usuario");

async function setup_db() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado ao MongoDB Atlas");

    const existentes = (
      await mongoose.connection.db.listCollections().toArray()
    ).map((c) => c.name);

    for (const Model of [Usuario, Projeto, Tarefa]) {
      const nome = Model.collection.collectionName;
      if (existentes.includes(nome)) {
        console.log(`Coleção "${nome}" já existe`);
      } else {
        await Model.createCollection();
        console.log(`Coleção "${nome}" criada`);
      }
    }

    await Usuario.createIndexes();
    console.log("Pronto!");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

setup_db();
