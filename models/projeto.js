const mongoose = require("mongoose");

const projetoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "O nome do projeto é obrigatório"],
      trim: true,
    },
    descricao: {
      type: String,
      trim: true,
      default: "",
    },
    gestor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    usuarios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Projeto", projetoSchema, "projetos");
