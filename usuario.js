const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "O nome é obrigatório"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "O e-mail é obrigatório"],
      unique: true, // não deixa cadastrar dois usuários com o mesmo e-mail
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "E-mail inválido"],
    },
    senha: {
      type: String,
      required: [true, "A senha é obrigatória"],
      minlength: [6, "A senha deve ter pelo menos 6 caracteres"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Usuario", usuarioSchema, "usuarios");
