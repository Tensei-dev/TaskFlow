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
    cor: {
      type: String,
      enum: ["purple", "blue", "orange", "green", "pink"],
      default: "purple",
    },
    gestor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    usuarios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Projeto", projetoSchema, "projetos");
