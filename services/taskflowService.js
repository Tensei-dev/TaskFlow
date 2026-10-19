//NOTE: Funções que executam as operações do TaskFlow direto no banco (MongoDB). As rotas do Express devem apenas chamar estas funções.

const mongoose = require("mongoose");
const Projeto = require("../models/Projeto");
const Tarefa = require("../models/Tarefa");

const STATUS = ["a_fazer", "em_andamento", "concluido"];
const PRIORIDADES = ["baixa", "media", "alta"];

//NOTE: Funções abaixo são todas auxiliares, usadas pelas demais funções do arquivo
// ------------------------------------------------------------------------------------------------------------------
//NOTE: Erro com código HTTP, para as rotas saberem o que responder
class ErroApp extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

//NOTE: Verifica se o ID informado é um ObjectId válido do MongoDB
function validarId(id, nome = "ID") {
  if (!mongoose.isValidObjectId(id)) {
    throw new ErroApp(`${nome} inválido`, 400);
  }
}

//NOTE: Escapa caracteres especiais para usar o texto digitado numa busca (regex)
function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

//NOTE: Remove campos que não podem ser alterados pelo usuário
function limparDados(dados) {
  const { _id, createdAt, updatedAt, __v, ...resto } = dados || {};
  return resto;
}
// ------------------------------------------------------------------------------------------------------------------

//NOTE: Funções abaixo são todas relativas aos projetos (criar, editar, excluir e visualizar)
// ------------------------------------------------------------------------------------------------------------------
//NOTE: Cria um novo projeto
async function criarProjeto(dados) {
  return Projeto.create(limparDados(dados));
}

//NOTE: Lista todos os projetos, do mais recente para o mais antigo
async function listarProjetos() {
  return Projeto.find().sort({ createdAt: -1 });
}

//NOTE: Busca um projeto pelo ID
async function buscarProjetoPorId(id) {
  validarId(id, "ID do projeto");
  const projeto = await Projeto.findById(id);
  if (!projeto) throw new ErroApp("Projeto não encontrado", 404);
  return projeto;
}

//NOTE: Edita as informações de um projeto
async function editarProjeto(id, dados) {
  validarId(id, "ID do projeto");

  //NOTE: returnDocument devolve o projeto já atualizado e runValidators aplica as validações do model
  const projeto = await Projeto.findByIdAndUpdate(id, limparDados(dados), {
    returnDocument: "after",
    runValidators: true,
  });
  if (!projeto) throw new ErroApp("Projeto não encontrado", 404);
  return projeto;
}

//NOTE: Exclui um projeto e também todas as tarefas dele
async function excluirProjeto(id) {
  validarId(id, "ID do projeto");
  const projeto = await Projeto.findByIdAndDelete(id);
  if (!projeto) throw new ErroApp("Projeto não encontrado", 404);

  //NOTE: Remove as tarefas do projeto excluído, para não ficarem tarefas órfãs no banco
  const { deletedCount } = await Tarefa.deleteMany({ projeto: id });
  return { projeto, tarefasExcluidas: deletedCount };
}
// ------------------------------------------------------------------------------------------------------------------

//NOTE: Funções abaixo são todas relativas às tarefas (cadastrar, visualizar, editar, alterar status e excluir)
// ------------------------------------------------------------------------------------------------------------------
//NOTE: Cadastra uma nova tarefa em um projeto existente
async function criarTarefa(dados) {
  const limpos = limparDados(dados);
  validarId(limpos.projeto, "ID do projeto");

  //NOTE: Confere se o projeto informado existe antes de salvar a tarefa
  const existe = await Projeto.exists({ _id: limpos.projeto });
  if (!existe) throw new ErroApp("Projeto não encontrado", 404);

  return Tarefa.create(limpos);
}

//NOTE: Lista as tarefas de um projeto, ordenadas pelo prazo
async function listarTarefasDoProjeto(projetoId) {
  validarId(projetoId, "ID do projeto");
  return Tarefa.find({ projeto: projetoId }).sort({ prazo: 1, createdAt: -1 });
}

//NOTE: Busca uma tarefa pelo ID, junto com o nome do projeto ao qual pertence
async function buscarTarefaPorId(id) {
  validarId(id, "ID da tarefa");
  const tarefa = await Tarefa.findById(id).populate("projeto", "nome");
  if (!tarefa) throw new ErroApp("Tarefa não encontrada", 404);
  return tarefa;
}

//NOTE: Edita as informações de uma tarefa
async function editarTarefa(id, dados) {
  validarId(id, "ID da tarefa");
  const limpos = limparDados(dados);

  //NOTE: Se for trocar a tarefa de projeto, confere se o novo projeto existe
  if (limpos.projeto !== undefined) {
    validarId(limpos.projeto, "ID do projeto");
    const existe = await Projeto.exists({ _id: limpos.projeto });
    if (!existe) throw new ErroApp("Projeto não encontrado", 404);
  }

  const tarefa = await Tarefa.findByIdAndUpdate(id, limpos, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!tarefa) throw new ErroApp("Tarefa não encontrada", 404);
  return tarefa;
}

//NOTE: Altera o status de uma tarefa, usado ao mover a tarefa entre as colunas do Kanban
async function alterarStatus(id, status) {
  if (!STATUS.includes(status)) {
    throw new ErroApp(`Status inválido. Use: ${STATUS.join(", ")}`, 400);
  }
  return editarTarefa(id, { status });
}

//NOTE: Exclui uma tarefa
async function excluirTarefa(id) {
  validarId(id, "ID da tarefa");
  const tarefa = await Tarefa.findByIdAndDelete(id);
  if (!tarefa) throw new ErroApp("Tarefa não encontrada", 404);
  return tarefa;
}
// ------------------------------------------------------------------------------------------------------------------

//NOTE: Funções abaixo são todas relativas ao quadro Kanban
// ------------------------------------------------------------------------------------------------------------------
//NOTE: Retorna as tarefas de um projeto separadas nas colunas A fazer, Em andamento e Concluído
async function obterKanban(projetoId) {
  const tarefas = await listarTarefasDoProjeto(projetoId);

  //NOTE: Distribui cada tarefa na coluna correspondente ao seu status
  const quadro = { a_fazer: [], em_andamento: [], concluido: [] };
  for (const tarefa of tarefas) {
    quadro[tarefa.status].push(tarefa);
  }
  return quadro;
}
// ------------------------------------------------------------------------------------------------------------------

//NOTE: Funções abaixo são todas relativas aos filtros
// ------------------------------------------------------------------------------------------------------------------
//NOTE: Pesquisa tarefas por nome, prioridade, status, prazo e projeto. Todos os filtros são opcionais e podem ser combinados:
//   nome       -> parte do título (ignora maiúsculas/minúsculas)
//   prioridade -> "baixa" | "media" | "alta"
//   status     -> "a_fazer" | "em_andamento" | "concluido"
//   prazoDe    -> prazo a partir desta data ("2026-11-01")
//   prazoAte   -> prazo até esta data, inclusive ("2026-11-30")
//   projeto    -> ID do projeto, para filtrar dentro de um projeto só
async function filtrarTarefas(filtros = {}) {
  const { nome, prioridade, status, prazoDe, prazoAte, projeto } = filtros;
  const consulta = {};

  //NOTE: Filtro por nome, busca parte do título ignorando maiúsculas e minúsculas
  if (nome && nome.trim()) {
    consulta.titulo = { $regex: escaparRegex(nome.trim()), $options: "i" };
  }

  //NOTE: Filtro por prioridade, aceita apenas os valores definidos no model
  if (prioridade) {
    if (!PRIORIDADES.includes(prioridade)) {
      throw new ErroApp(
        `Prioridade inválida. Use: ${PRIORIDADES.join(", ")}`,
        400,
      );
    }
    consulta.prioridade = prioridade;
  }

  //NOTE: Filtro por status, aceita apenas os valores definidos no model
  if (status) {
    if (!STATUS.includes(status)) {
      throw new ErroApp(`Status inválido. Use: ${STATUS.join(", ")}`, 400);
    }
    consulta.status = status;
  }

  //NOTE: Filtro por prazo, com data inicial e/ou final
  if (prazoDe || prazoAte) {
    consulta.prazo = {};
    if (prazoDe) {
      const inicio = new Date(prazoDe);
      if (isNaN(inicio)) throw new ErroApp("Data inicial inválida", 400);
      consulta.prazo.$gte = inicio;
    }
    if (prazoAte) {
      const fim = new Date(prazoAte);
      if (isNaN(fim)) throw new ErroApp("Data final inválida", 400);

      //NOTE: Ajusta o horário para o fim do dia, para incluir o dia inteiro
      fim.setUTCHours(23, 59, 59, 999);
      consulta.prazo.$lte = fim;
    }
  }

  //NOTE: Filtro por projeto
  if (projeto) {
    validarId(projeto, "ID do projeto");
    consulta.projeto = projeto;
  }

  return Tarefa.find(consulta)
    .populate("projeto", "nome")
    .sort({ prazo: 1, createdAt: -1 });
}
// ------------------------------------------------------------------------------------------------------------------

//NOTE: Funções abaixo são todas relativas as dashboard
// ------------------------------------------------------------------------------------------------------------------
//NOTE: Retorna o Dashboard resumo das tarefas, com filtro só para aquele projeto, sem filtro para todos os projetos
async function obterDashboard(projetoId) {
  const filtro = {};
  if (projetoId) {
    validarId(projetoId, "ID do projeto");
    filtro.projeto = new mongoose.Types.ObjectId(projetoId);
  }

  //NOTE: Função de sumarização de tarefas, conta a quantidade de tarefas por status
  const contagem = await Tarefa.aggregate([
    { $match: filtro },
    { $group: { _id: "$status", quantidade: { $sum: 1 } } },
  ]);

  //NOTE: Função de sumarização de tarefas, atribui a cada status a sua respectiva contagem
  const porStatus = { a_fazer: 0, em_andamento: 0, concluido: 0 };
  for (const item of contagem) {
    porStatus[item._id] = item.quantidade;
  }

  //NOTE: Função para detectar tarefas atrasadas
  const atrasadas = await Tarefa.countDocuments({
    ...filtro,
    status: { $ne: "concluido" },
    prazo: { $lt: new Date() },
  });

  return {
    total: porStatus.a_fazer + porStatus.em_andamento + porStatus.concluido,
    pendentes: porStatus.a_fazer,
    emAndamento: porStatus.em_andamento,
    concluidas: porStatus.concluido,
    atrasadas,
  };
}
// ------------------------------------------------------------------------------------------------------------------

module.exports = {
  ErroApp,
  criarProjeto,
  listarProjetos,
  buscarProjetoPorId,
  editarProjeto,
  excluirProjeto,
  criarTarefa,
  listarTarefasDoProjeto,
  buscarTarefaPorId,
  editarTarefa,
  alterarStatus,
  excluirTarefa,
  obterKanban,
  filtrarTarefas,
  obterDashboard,
};
