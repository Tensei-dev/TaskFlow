const mongoose = require("mongoose");

const comentarioSchema = new mongoose.Schema(
  {
    autor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    texto: { type: String, required: true, trim: true },
    data: { type: Date, default: Date.now },
  },
  { _id: true },
);

const tarefaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, "O título da tarefa é obrigatório"],
      trim: true,
    },
    descricao: {
      type: String,
      trim: true,
      default: "",
    },
    prioridade: {
      type: String,
      enum: ["baixa", "media", "alta"],
      default: "media",
    },
    status: {
      type: String,
      enum: ["a_fazer", "em_andamento", "concluido"],
      default: "a_fazer",
    },
    prazo: {
      type: Date,
    },
    projeto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Projeto",
      required: [true, "A tarefa precisa pertencer a um projeto"],
    },
    // Extras
    responsavel: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    comentarios: [comentarioSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Tarefa", tarefaSchema, "tarefas");
