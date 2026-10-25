'use strict';

// A camada de dados está isolada aqui para a futura integração com a API Express/MongoDB.
const STORAGE_KEY = 'taskflow.workspace.v1';
const STATUSES = { todo: 'A fazer', progress: 'Em andamento', done: 'Concluído' };
const PRIORITIES = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
// As chaves das cores foram mantidas para preservar os projetos já salvos.
const COLORS = {
  purple: { color: 'var(--accent)', tint: 'var(--accent-soft)' },
  blue: { color: 'var(--info)', tint: 'var(--info-soft)' },
  orange: { color: 'var(--warning)', tint: 'var(--warning-soft)' },
  green: { color: 'var(--success)', tint: 'var(--success-soft)' },
  pink: { color: 'var(--pink)', tint: 'var(--pink-soft)' },
};
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const icon = (name, className = '') => `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const makeId = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => localDate();
const relativeDate = (offset) => { const date = new Date(); date.setDate(date.getDate() + offset); return localDate(date); };
const parseDate = (value) => new Date(`${value}T12:00:00`);
const formatDate = (value, options = { day: '2-digit', month: 'short' }) => value ? parseDate(value).toLocaleDateString('pt-BR', options).replace('.', '') : 'Sem prazo';
const isOverdue = (task) => task.status !== 'done' && Boolean(task.due) && task.due < today();
const getProject = (id) => data.projects.find((project) => project.id === id);
const projectStyle = (project) => { const color = COLORS[project?.color] || COLORS.purple; return `--project-color:${color.color};--project-tint:${color.tint}`; };
const normalized = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function demoData() {
  const projects = [
    { id: 'website', name: 'Website institucional', description: 'Um novo espaço digital para conectar ideias.', color: 'purple', createdAt: relativeDate(-14) },
    { id: 'app', name: 'Aplicativo mobile', description: 'Uma experiência simples, na palma da mão.', color: 'blue', createdAt: relativeDate(-10) },
    { id: 'marketing', name: 'Campanha de marketing', description: 'Boas histórias merecem chegar mais longe.', color: 'orange', createdAt: relativeDate(-7) },
  ];
  const task = (id, title, description, priority, status, offset, assignee, category, extras = {}) => ({ id, projectId: 'website', title, description, priority, status, due: relativeDate(offset), assignee, category, comments: [], createdAt: new Date().toISOString(), ...extras });
  const tasks = [
    task('t1', 'Criar identidade visual', 'Definir cores, tipografia e os elementos visuais da marca.', 'alta', 'todo', 2, 'Ana Silva', 'Design', { cover: true }),
    task('t2', 'Planejar estrutura das páginas', 'Organizar o conteúdo e definir a navegação do site.', 'media', 'todo', 4, 'Pedro Lima', 'Planejamento'),
    task('t3', 'Preparar conteúdo do site', 'Reunir os textos e as informações de cada seção.', 'baixa', 'todo', 6, 'Júlia Costa', 'Conteúdo'),
    task('t4', 'Desenvolver a página inicial', 'Transformar o layout em uma página responsiva.', 'alta', 'progress', -1, 'Pedro Lima', 'Desenvolvimento', { comments: [{ id: 'c1', author: 'Ana Silva', text: 'Os componentes do layout já estão prontos para começar.', createdAt: new Date().toISOString() }] }),
    task('t5', 'Criar componentes de interface', 'Botões, campos e cartões para manter tudo consistente.', 'media', 'progress', 3, 'Ana Silva', 'Design'),
    task('t6', 'Configurar ambiente do projeto', 'Organizar a estrutura de pastas e as ferramentas.', 'baixa', 'progress', 1, 'Lucas Santos', 'Desenvolvimento'),
    task('t7', 'Definir escopo do projeto', 'Alinhar os objetivos, as entregas e os próximos passos.', 'alta', 'done', -5, 'Júlia Costa', 'Planejamento'),
    task('t8', 'Pesquisar referências visuais', 'Explorar ideias e reunir inspirações para o projeto.', 'media', 'done', -4, 'Ana Silva', 'Design'),
    task('t9', 'Levantar requisitos', 'Entender as necessidades de quem vai usar o site.', 'media', 'done', -3, 'Pedro Lima', 'Planejamento'),
    task('t10', 'Desenhar fluxo de navegação', 'Mapear a jornada principal do aplicativo.', 'alta', 'todo', 5, 'Ana Silva', 'Design', { projectId: 'app' }),
    task('t11', 'Prototipar tela de boas-vindas', 'Apresentar uma primeira versão da experiência.', 'media', 'progress', 7, 'Lucas Santos', 'Design', { projectId: 'app' }),
    task('t12', 'Definir público da campanha', 'Mapear perfis, interesses e canais de comunicação.', 'alta', 'done', -2, 'Júlia Costa', 'Planejamento', { projectId: 'marketing' }),
    task('t13', 'Criar calendário editorial', 'Planejar as próximas publicações da campanha.', 'media', 'todo', 4, 'Júlia Costa', 'Conteúdo', { projectId: 'marketing' }),
  ];
  return { version: 1, projects, tasks };
}

// Somente dados válidos são carregados. Textos do usuário são escapados antes da renderização.
function validStoredData(value) {
  if (value?.version !== 1 || !Array.isArray(value.projects) || !Array.isArray(value.tasks)) return false;
  const validDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parseDate(date).getTime()) && localDate(parseDate(date)) === date;
  const ids = new Set();
  for (const project of value.projects) {
    if (typeof project.id !== 'string' || ids.has(project.id) || typeof project.name !== 'string' || !project.name.trim() || typeof project.description !== 'string' || !Object.hasOwn(COLORS, project.color) || !validDate(project.createdAt)) return false;
    ids.add(project.id);
  }
  const taskIds = new Set();
  return value.tasks.every((task) => {
    if (typeof task.id !== 'string' || taskIds.has(task.id) || !ids.has(task.projectId) || typeof task.title !== 'string' || !task.title.trim() || typeof task.description !== 'string' || typeof task.assignee !== 'string' || !Object.hasOwn(STATUSES, task.status) || !Object.hasOwn(PRIORITIES, task.priority) || !validDate(task.due) || !Array.isArray(task.comments)) return false;
    taskIds.add(task.id);
    return task.comments.every((comment) => typeof comment.id === 'string' && typeof comment.author === 'string' && typeof comment.text === 'string');
  });
}

let storageWarning = '';
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const value = JSON.parse(saved);
      if (validStoredData(value)) return value;
      storageWarning = 'Os dados salvos não puderam ser lidos. Carregamos o exemplo inicial.';
    }
  } catch {
    storageWarning = 'O armazenamento está indisponível. As mudanças durarão enquanto esta página estiver aberta.';
  }
  return demoData();
}

let data = loadData();
const state = {
  view: ['dashboard', 'projetos', 'quadro', 'calendario'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'quadro',
  projectId: data.projects[0]?.id || 'all',
  query: '', priority: '', status: '', dateFrom: '', dateTo: '', overdue: false,
  layout: 'kanban', filtersOpen: false, calendarDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
};
let pendingDelete = null;
let draggedTask = null;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    toast('Não foi possível salvar no navegador. As alterações estão disponíveis nesta sessão.', true);
    return false;
  }
}

const API_STATUS = { todo: 'a_fazer', progress: 'em_andamento', done: 'concluido' };
const UI_STATUS = { a_fazer: 'todo', em_andamento: 'progress', concluido: 'done' };
let apiEnabled = false;

async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.erro || `Erro HTTP ${response.status}`);
  return body;
}

const mongoId = (value) => /^[a-f\d]{24}$/i.test(String(value));
const dateOnly = (value) => value ? String(value).slice(0, 10) : '';
const projectFromApi = (project) => ({
  id: project._id,
  name: project.nome,
  description: project.descricao || '',
  color: project.cor || 'purple',
  createdAt: dateOnly(project.createdAt) || today(),
});
const taskFromApi = (task) => ({
  id: task._id,
  projectId: task.projeto?._id || task.projeto,
  title: task.titulo,
  description: task.descricao || '',
  priority: task.prioridade || 'media',
  status: UI_STATUS[task.status] || 'todo',
  due: dateOnly(task.prazo),
  assignee: task.responsavelNome || '',
  category: task.categoria || 'Tarefa',
  cover: Boolean(task.destaque),
  comments: (task.comentarios || []).map((comment) => ({
    id: comment._id || makeId(), author: comment.autorNome || 'Você', text: comment.texto, createdAt: comment.data,
  })),
  createdAt: task.createdAt,
});
const projectToApi = (project) => ({ nome: project.name, descricao: project.description, cor: project.color });
const taskToApi = (task) => ({
  titulo: task.title,
  descricao: task.description,
  prioridade: task.priority,
  status: API_STATUS[task.status],
  prazo: task.due || null,
  projeto: task.projectId,
  responsavelNome: task.assignee,
  categoria: task.category || 'Tarefa',
  destaque: Boolean(task.cover),
  comentarios: task.comments.map((comment) => ({ autorNome: comment.author, texto: comment.text, data: comment.createdAt })),
});

async function syncProject(project) {
  if (!apiEnabled) return project;
  const saved = mongoId(project.id)
    ? await apiRequest(`/projetos/${project.id}`, { method: 'PUT', body: JSON.stringify(projectToApi(project)) })
    : await apiRequest('/projetos', { method: 'POST', body: JSON.stringify(projectToApi(project)) });
  return projectFromApi(saved);
}

async function syncTask(task, statusOnly = false) {
  if (!apiEnabled) return task;
  const saved = mongoId(task.id)
    ? await apiRequest(`/tarefas/${task.id}${statusOnly ? '/status' : ''}`, {
      method: statusOnly ? 'PATCH' : 'PUT',
      body: JSON.stringify(statusOnly ? { status: API_STATUS[task.status] } : taskToApi(task)),
    })
    : await apiRequest('/tarefas', { method: 'POST', body: JSON.stringify(taskToApi(task)) });
  return taskFromApi(saved);
}

async function seedApi(source) {
  const projectIds = new Map();
  const projects = [];
  for (const project of source.projects) {
    const saved = projectFromApi(await apiRequest('/projetos', { method: 'POST', body: JSON.stringify(projectToApi(project)) }));
    projectIds.set(project.id, saved.id);
    projects.push(saved);
  }
  const tasks = [];
  for (const task of source.tasks) {
    const candidate = { ...task, projectId: projectIds.get(task.projectId) };
    tasks.push(taskFromApi(await apiRequest('/tarefas', { method: 'POST', body: JSON.stringify(taskToApi(candidate)) })));
  }
  return { version: 1, projects, tasks };
}

async function hydrateFromApi() {
  try {
    const health = await apiRequest('');
    if (health.database !== 'connected') return;
    apiEnabled = true;
    const [projects, tasks] = await Promise.all([apiRequest('/projetos'), apiRequest('/tarefas')]);
    data = projects.length
      ? { version: 1, projects: projects.map(projectFromApi), tasks: tasks.map(taskFromApi) }
      : await seedApi(data);
    state.projectId = data.projects[0]?.id || 'all';
    persist();
    render();
    toast('Dados sincronizados com o MongoDB.');
  } catch (error) {
    apiEnabled = false;
    toast(`Modo local: ${error.message}`, true);
  }
}

async function safelySync(operation) {
  try {
    return await operation();
  } catch (error) {
    toast(`Alteração salva localmente. API: ${error.message}`, true);
    return null;
  }
}

function toast(message, error = false) {
  const element = document.createElement('div');
  element.className = `toast${error ? ' error' : ''}`;
  element.innerHTML = `${icon(error ? 'help' : 'check-circle')}<span>${escapeHTML(message)}</span>`;
  $('#toast-container').append(element);
  setTimeout(() => element.remove(), error ? 8000 : 4000);
}

function initials(name = '') { return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '—'; }
function avatar(name, index = 0) {
  const colors = ['purple', 'orange', 'blue', 'green', 'pink'];
  const hash = [...name].reduce((sum, character) => sum + character.charCodeAt(0), index);
  return `<span class="avatar avatar-${colors[hash % colors.length]}" title="${escapeHTML(name || 'Sem responsável')}">${escapeHTML(initials(name))}</span>`;
}

function projectTasks(projectId = state.projectId) { return data.tasks.filter((task) => projectId === 'all' || task.projectId === projectId); }
function visibleTasks() {
  return projectTasks().filter((task) => {
    const matchesText = !state.query || normalized(`${task.title} ${task.description} ${task.assignee}`).includes(normalized(state.query));
    return matchesText && (!state.priority || task.priority === state.priority) && (!state.status || task.status === state.status) && (!state.dateFrom || task.due >= state.dateFrom) && (!state.dateTo || task.due <= state.dateTo) && (!state.overdue || isOverdue(task));
  });
}

function counts(tasks) { return { total: tasks.length, todo: tasks.filter((task) => task.status === 'todo').length, progress: tasks.filter((task) => task.status === 'progress').length, done: tasks.filter((task) => task.status === 'done').length }; }
function statsMarkup(tasks) {
  const count = counts(tasks);
  const stats = [
    { name: 'Total de tarefas', number: count.total, icon: 'board', color: 'purple', caption: 'Todas as suas ideias', percent: 100 },
    { name: 'A fazer', number: count.todo, icon: 'clock', color: 'orange', caption: 'Prontas para começar', percent: count.total ? count.todo / count.total * 100 : 0 },
    { name: 'Em andamento', number: count.progress, icon: 'progress', color: 'blue', caption: 'Ideias em movimento', percent: count.total ? count.progress / count.total * 100 : 0 },
    { name: 'Concluídas', number: count.done, icon: 'check-circle', color: 'green', caption: 'Cada entrega conta', percent: count.total ? count.done / count.total * 100 : 0 },
  ];
  return `<section class="stats-grid" aria-label="Resumo das tarefas">${stats.map((stat) => `<article class="stat-card stat-${stat.color}"><div class="stat-top"><span>${stat.name}</span><span class="stat-icon">${icon(stat.icon)}</span></div><div class="stat-main"><strong class="stat-number">${String(stat.number).padStart(2, '0')}</strong></div><div class="stat-bottom"><span>${stat.caption}</span><span class="mini-progress" aria-label="${Math.round(stat.percent)}% do total"><span style="width:${stat.percent}%"></span></span></div></article>`).join('')}</section>`;
}

function pageHeading(title, subtitle, action = 'new-task', buttonText = 'Nova tarefa') {
  return `<div class="page-heading"><div><h1>${title}</h1><p class="heading-subtitle">${subtitle}</p></div><div class="heading-actions"><span class="date-label">${icon('calendar')}${escapeHTML(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }))}</span><button type="button" class="button button-primary" data-action="${action}">${icon('plus')}${buttonText}</button></div></div>`;
}

function renderSidebar() {
  $('#project-count').textContent = data.projects.length;
  $('#project-nav').innerHTML = data.projects.map((project) => `<button type="button" class="project-nav-item${state.view === 'quadro' && state.projectId === project.id ? ' selected' : ''}" data-action="open-project" data-id="${escapeHTML(project.id)}" style="${projectStyle(project)}"><span class="project-dot"></span><span>${escapeHTML(project.name)}</span></button>`).join('');
  $$('.nav-item').forEach((item) => {
    const active = item.dataset.view === state.view;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
  $('#notification-dot').hidden = !data.tasks.some(isOverdue);
}

function render() {
  const titles = { dashboard: 'Dashboard', projetos: 'Projetos', quadro: 'Meu quadro', calendario: 'Calendário' };
  document.title = `${titles[state.view]} · TaskFlow`;
  $('#breadcrumb-title').textContent = titles[state.view];
  renderSidebar();
  const views = { dashboard: renderDashboard, projetos: renderProjects, quadro: renderBoard, calendario: renderCalendar };
  $('#page-content').innerHTML = views[state.view]();
  $('#global-search').value = state.query;
}

function navigate(view) {
  state.view = view;
  closeSidebar();
  if (location.hash !== `#${view}`) location.hash = view; else render();
}

function projectOptions(selected = state.projectId, includeAll = true) {
  return `${includeAll ? `<option value="all"${selected === 'all' ? ' selected' : ''}>Todos os projetos</option>` : ''}${data.projects.map((project) => `<option value="${escapeHTML(project.id)}"${selected === project.id ? ' selected' : ''}>${escapeHTML(project.name)}</option>`).join('')}`;
}

function boardProjectHeader() {
  const project = getProject(state.projectId);
  const members = [...new Set(projectTasks().map((task) => task.assignee).filter(Boolean))];
  return `<div class="project-header"><span class="project-symbol" style="${projectStyle(project)}">${icon(project ? 'folder' : 'board')}</span><div><h2 class="project-title">${escapeHTML(project?.name || 'Todos os projetos')}</h2><p class="project-subtitle">${escapeHTML(project?.description || 'Todas as suas ideias, reunidas em um só lugar.')}</p></div><div class="project-meta"><div class="avatar-stack" aria-label="Responsáveis pelas tarefas">${members.slice(0, 4).map((member) => avatar(member)).join('')}${members.length > 4 ? `<span class="avatar">+${members.length - 4}</span>` : ''}</div>${project ? `<button class="icon-button" type="button" data-action="edit-project" data-id="${escapeHTML(project.id)}" aria-label="Editar projeto">${icon('more')}</button>` : ''}</div></div>`;
}

function renderBoard() {
  const tasks = visibleTasks();
  const activeFilters = Boolean(state.priority || state.status || state.dateFrom || state.dateTo || state.overdue);
  return `${pageHeading('Meu quadro', 'Um espaço para organizar ideias e fazer acontecer.')}${statsMarkup(projectTasks())}<section class="board-panel" aria-label="Quadro de tarefas">${boardProjectHeader()}
    <div class="board-tabs" role="tablist" aria-label="Visualização das tarefas"><button role="tab" id="kanban-tab" aria-controls="board-content" aria-selected="${state.layout === 'kanban'}" tabindex="${state.layout === 'kanban' ? '0' : '-1'}" class="board-tab${state.layout === 'kanban' ? ' active' : ''}" data-action="layout" data-layout="kanban">${icon('board')}Quadro Kanban<span class="tab-counter">${tasks.length}</span></button><button role="tab" id="list-tab" aria-controls="board-content" aria-selected="${state.layout === 'list'}" tabindex="${state.layout === 'list' ? '0' : '-1'}" class="board-tab${state.layout === 'list' ? ' active' : ''}" data-action="layout" data-layout="list">${icon('list')}Lista</button></div>
    <div class="board-toolbar"><label class="board-search">${icon('search')}<input type="search" id="board-search" value="${escapeHTML(state.query)}" placeholder="Buscar tarefa..." aria-label="Buscar tarefa no quadro"></label><select class="filter-select project-filter" id="project-filter" aria-label="Filtrar por projeto">${projectOptions()}</select><select class="filter-select priority-filter" id="priority-filter" aria-label="Filtrar por prioridade"><option value="">Prioridade</option>${Object.entries(PRIORITIES).map(([value, name]) => `<option value="${value}"${state.priority === value ? ' selected' : ''}>${name}</option>`).join('')}</select><div class="toolbar-right"><span class="filter-summary" id="filter-summary">${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''}</span><button type="button" class="button button-secondary filter-toggle${activeFilters || state.filtersOpen ? ' is-active' : ''}" data-action="toggle-filters" aria-expanded="${state.filtersOpen}" aria-controls="expanded-filters">${icon('filter')}Filtros${activeFilters ? ' •' : ''}</button></div></div>
    <div class="expanded-filters" id="expanded-filters"${state.filtersOpen ? '' : ' hidden'}><label>Status<select class="filter-select" id="status-filter"><option value="">Todos os status</option>${Object.entries(STATUSES).map(([value, name]) => `<option value="${value}"${state.status === value ? ' selected' : ''}>${name}</option>`).join('')}</select></label><label>Prazo a partir de<input type="date" id="date-from-filter" value="${state.dateFrom}" min="2000-01-01" max="2100-12-31"></label><label>Até<input type="date" id="date-to-filter" value="${state.dateTo}" min="2000-01-01" max="2100-12-31"></label><label><span>Acompanhamento</span><select class="filter-select" id="overdue-filter"><option value="">Todos os prazos</option><option value="overdue"${state.overdue ? ' selected' : ''}>Somente atrasadas</option></select></label><button class="text-button" type="button" data-action="clear-filters">Limpar filtros</button></div>
    <div id="board-content" role="tabpanel" aria-labelledby="${state.layout === 'kanban' ? 'kanban-tab' : 'list-tab'}">${data.projects.length ? boardContent(tasks) : noProjectsMarkup()}</div>
    <div class="board-bottom"><span>${icon('check-circle')}Alterações salvas neste navegador</span><span class="drag-hint">Arraste os cartões para atualizar o status ${icon('arrow')}</span></div></section>`;
}

function boardContent(tasks) { return state.layout === 'kanban' ? kanbanMarkup(tasks) : listMarkup(tasks); }
function refreshBoardContent() {
  const content = $('#board-content');
  if (!content) return;
  const tasks = visibleTasks();
  content.innerHTML = data.projects.length ? boardContent(tasks) : noProjectsMarkup();
  const counter = $('.tab-counter');
  if (counter) counter.textContent = tasks.length;
  const summary = $('#filter-summary');
  if (summary) summary.textContent = `${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''}`;
}

function kanbanMarkup(tasks) {
  return `<div class="kanban">${Object.entries(STATUSES).map(([status, name]) => {
    const group = tasks.filter((task) => task.status === status);
    return `<section class="kanban-column column-${status}" data-drop-status="${status}" aria-label="${name}"><div class="column-header"><span class="column-dot"></span><h3>${name}</h3><span class="column-count">${group.length}</span><button class="icon-button" type="button" data-action="new-task" data-status="${status}" aria-label="Adicionar tarefa em ${name}">${icon('plus')}</button></div><div class="column-tasks">${group.length ? group.map(taskCardMarkup).join('') : '<p class="empty-column">Tudo tranquilo por aqui.<br>Que tal adicionar uma tarefa?</p>'}</div><button type="button" class="column-add" data-action="new-task" data-status="${status}">${icon('plus')}Adicionar tarefa</button></section>`;
  }).join('')}</div>`;
}

function priorityMarkup(priority) { return `<span class="priority priority-${priority}">${icon('flag')}${PRIORITIES[priority]}</span>`; }
function taskCardMarkup(task) {
  const category = task.category || 'Tarefa';
  const categoryColor = { Desenvolvimento: 'blue', Planejamento: 'orange', Conteúdo: 'green' }[category] || 'purple';
  return `<article class="task-card" draggable="true" data-task-id="${escapeHTML(task.id)}" tabindex="0" role="button" aria-label="Editar tarefa: ${escapeHTML(task.title)}"><div class="task-card-top"><span class="category category-${categoryColor}">${escapeHTML(category)}</span><span class="icon-button" aria-hidden="true">${icon('more')}</span></div>${task.cover ? '<div class="task-cover" aria-hidden="true"><div class="cover-copy">Make it<br>simple.<small>LESS, BUT BETTER.</small></div><span class="cover-window"><i></i><b></b></span></div>' : ''}<h3 class="task-card-title">${escapeHTML(task.title)}</h3><p class="task-description">${escapeHTML(task.description || 'Uma nova ideia pronta para acontecer.')}</p><div class="task-date-line${isOverdue(task) ? ' overdue' : ''}${task.status === 'done' ? ' finished' : ''}">${icon(task.status === 'done' ? 'check-circle' : 'calendar')}<span>${task.status === 'done' ? 'Prazo: ' : ''}${formatDate(task.due)}</span>${isOverdue(task) ? '<span class="overdue-label">Atrasada</span>' : ''}${state.projectId === 'all' ? `<span class="task-project-badge">${escapeHTML(getProject(task.projectId)?.name)}</span>` : ''}</div><div class="task-card-footer">${priorityMarkup(task.priority)}<div class="task-people">${task.comments.length ? `<span class="comment-count" aria-label="${task.comments.length} comentário${task.comments.length !== 1 ? 's' : ''}">${icon('comment')}${task.comments.length}</span>` : ''}${avatar(task.assignee)}</div></div></article>`;
}

function listMarkup(tasks) {
  if (!tasks.length) return `<div class="empty-state">${icon('search')}<h3>Nenhuma tarefa por aqui</h3><p>Tente ajustar os filtros ou dê o primeiro passo com uma nova tarefa.</p><button class="button button-light" data-action="clear-filters">Limpar filtros</button></div>`;
  return `<div class="table-scroll"><table class="task-table"><thead><tr><th scope="col">Tarefa</th><th scope="col">Status</th><th scope="col">Prioridade</th><th scope="col">Prazo</th><th scope="col">Responsável</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead><tbody>${tasks.map((task) => `<tr><td><button class="task-name-button" type="button" data-action="edit-task" data-id="${escapeHTML(task.id)}">${escapeHTML(task.title)}</button></td><td><select class="status-select" data-task-status="${escapeHTML(task.id)}" aria-label="Status de ${escapeHTML(task.title)}">${Object.entries(STATUSES).map(([value, name]) => `<option value="${value}"${task.status === value ? ' selected' : ''}>${name}</option>`).join('')}</select></td><td>${priorityMarkup(task.priority)}</td><td${isOverdue(task) ? ' class="is-overdue"' : ''}>${formatDate(task.due)}${isOverdue(task) ? ' · Atrasada' : ''}</td><td>${avatar(task.assignee)}</td><td><button type="button" class="icon-button small" data-action="edit-task" data-id="${escapeHTML(task.id)}" aria-label="Editar ${escapeHTML(task.title)}">${icon('edit')}</button></td></tr>`).join('')}</tbody></table></div>`;
}

function projectCardMarkup(project) {
  const tasks = projectTasks(project.id);
  const completed = tasks.filter((task) => task.status === 'done').length;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  return `<article class="project-card" style="${projectStyle(project)}"><div class="project-card-top"><span class="project-symbol">${icon('folder')}</span><button class="icon-button" type="button" data-action="edit-project" data-id="${escapeHTML(project.id)}" aria-label="Editar ${escapeHTML(project.name)}">${icon('more')}</button></div><button class="project-card-heading" type="button" data-action="open-project" data-id="${escapeHTML(project.id)}"><h3>${escapeHTML(project.name)}</h3></button><p>${escapeHTML(project.description || 'Um espaço para tirar novas ideias do papel.')}</p><div class="project-progress-label"><span>${completed} de ${tasks.length} tarefas concluídas</span><span>${percent}%</span></div><div class="project-progress-track" role="progressbar" aria-label="Progresso de ${escapeHTML(project.name)}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><div class="project-card-footer"><span>Criado em ${formatDate(project.createdAt)}</span><button class="text-button" type="button" data-action="open-project" data-id="${escapeHTML(project.id)}">Abrir projeto${icon('arrow')}</button></div></article>`;
}

function renderProjects() {
  return `${pageHeading('Seus projetos', 'Dê um lugar para cada ideia. E um próximo passo para cada plano.', 'new-project', 'Novo projeto')}<div class="project-grid">${data.projects.map(projectCardMarkup).join('')}<button type="button" class="new-project-card" data-action="new-project">${icon('plus')}<strong>Um novo começo</strong><span>Crie seu próximo projeto</span></button></div>`;
}

function deadlineMarkup(task) {
  const date = parseDate(task.due);
  return `<button type="button" class="deadline-item" data-action="edit-task" data-id="${escapeHTML(task.id)}"><span class="deadline-day">${date.getDate()}<small>${date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></span><span><span class="deadline-title">${escapeHTML(task.title)}</span><span class="deadline-project">${escapeHTML(getProject(task.projectId)?.name)}${isOverdue(task) ? ' · Atrasada' : ''}</span></span>${priorityMarkup(task.priority)}</button>`;
}

function renderDashboard() {
  const count = counts(data.tasks);
  const percent = count.total ? Math.round(count.done / count.total * 100) : 0;
  const todoPercent = count.total ? count.todo / count.total * 100 : 0;
  const progressPercent = count.total ? count.progress / count.total * 100 : 0;
  const pending = data.tasks.filter((task) => task.status !== 'done').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  return `${pageHeading('Visão geral', 'Um pouco de organização, um mundo de possibilidades.')}${statsMarkup(data.tasks)}<section class="dashboard-welcome"><div class="welcome-copy"><span class="eyebrow">SEU PRÓXIMO PASSO COMEÇA AQUI</span><h2>Pequenas tarefas.<br>Grandes ideias em movimento.</h2><p>${count.total ? `Você já concluiu ${count.done} de ${count.total} tarefas. Continue no seu ritmo, cada entrega faz a diferença.` : 'Tudo começa com uma ideia. Crie seu primeiro projeto e transforme planos em próximos passos.'}</p><button class="button button-primary" type="button" data-action="go-board">Ir para meu quadro${icon('arrow')}</button></div><div class="welcome-art" aria-hidden="true"><div class="paper"><i></i><i></i><i></i>${icon('check')}</div><span class="floating-star">✦</span></div></section><div class="section-heading"><h2>Seus projetos</h2><a class="text-button" href="#projetos">Ver todos${icon('arrow')}</a></div><div class="project-grid">${data.projects.length ? data.projects.slice(0, 3).map(projectCardMarkup).join('') : '<button type="button" class="new-project-card" data-action="new-project">' + icon('plus') + '<strong>Criar primeiro projeto</strong></button>'}</div><div class="dashboard-lower"><section class="surface"><div class="section-heading"><h2>De olho nos prazos</h2><span class="category category-orange">Próximas entregas</span></div><div>${pending.length ? pending.map(deadlineMarkup).join('') : '<div class="empty-state"><h3>Tudo em dia!</h3><p>Suas próximas tarefas vão aparecer aqui.</p></div>'}</div></section><section class="surface"><div class="section-heading"><h2>Cada passo conta</h2>${icon('target')}</div><div class="distribution"><div class="donut" style="background:conic-gradient(var(--chart-todo) 0% ${todoPercent}%,var(--chart-progress) ${todoPercent}% ${todoPercent + progressPercent}%,var(--chart-done) ${todoPercent + progressPercent}% 100%)"><div class="donut-center"><strong>${percent}%</strong><span>de tarefas concluídas</span></div></div></div><div class="legend"><span><i style="--legend-color:var(--chart-todo)"></i>A fazer</span><span><i style="--legend-color:var(--chart-progress)"></i>Em andamento</span><span><i style="--legend-color:var(--chart-done)"></i>Concluído</span></div></section></div>`;
}

function renderCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month, index - offset + 1);
    const key = localDate(date);
    const tasks = data.tasks.filter((task) => task.due === key);
    return `<div class="calendar-day${date.getMonth() !== month ? ' outside' : ''}${key === today() ? ' today' : ''}"><time class="calendar-day-number" datetime="${key}">${date.getDate()}</time>${tasks.map((task) => `<button class="calendar-task" style="${projectStyle(getProject(task.projectId))}" data-action="edit-task" data-id="${escapeHTML(task.id)}" type="button" title="${escapeHTML(task.title)} · ${STATUSES[task.status]}">${task.status === 'done' ? '✓ ' : ''}${escapeHTML(task.title)}</button>`).join('')}</div>`;
  });
  return `${pageHeading('Calendário', 'Um olhar para os prazos. Um espaço para se planejar.')}<section class="calendar-panel" aria-label="Calendário de prazos"><div class="calendar-heading"><h2>${state.calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2><div class="calendar-controls"><button class="button button-secondary" type="button" data-action="calendar-today">Hoje</button><button class="icon-button" type="button" data-action="calendar-prev" aria-label="Mês anterior">${icon('chevron', 'previous-month')}</button><button class="icon-button" type="button" data-action="calendar-next" aria-label="Próximo mês">${icon('chevron')}</button></div></div><div class="calendar-weekdays">${['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => `<span>${day}</span>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div><p class="calendar-empty">Clique em uma tarefa para ver os detalhes ou alterar o prazo.</p></section>`;
}

function noProjectsMarkup() { return `<div class="empty-state">${icon('folder')}<h3>Todo grande projeto começa com uma ideia.</h3><p>Crie um projeto para organizar suas primeiras tarefas.</p><button type="button" class="button button-primary" data-action="new-project">${icon('plus')}Criar meu primeiro projeto</button></div>`; }

function openTask(id, status = 'todo') {
  if (!data.projects.length) { toast('Crie um projeto antes de adicionar uma tarefa.'); openProject(); return; }
  const task = data.tasks.find((item) => item.id === id);
  const form = $('#task-form');
  form.reset();
  form.elements.projectId.innerHTML = projectOptions(task?.projectId || (state.projectId === 'all' ? data.projects[0].id : state.projectId), false);
  form.elements.id.value = task?.id || '';
  form.elements.title.value = task?.title || '';
  form.elements.description.value = task?.description || '';
  form.elements.priority.value = task?.priority || 'media';
  form.elements.status.value = task?.status || status;
  form.elements.due.value = task?.due || relativeDate(3);
  form.elements.assignee.value = task?.assignee || '';
  $('#task-dialog-title').textContent = task ? 'Detalhes da tarefa' : 'Nova tarefa';
  $('#save-task').textContent = task ? 'Salvar alterações' : 'Criar tarefa';
  $('#delete-task').hidden = !task;
  $('.comments-section', form)?.remove();
  if (task) {
    const comments = document.createElement('section');
    comments.className = 'comments-section';
    comments.innerHTML = `<h3>Comentários <span class="category">${task.comments.length}</span></h3><div id="comments-list">${commentsMarkup(task)}</div><div class="comment-input"><textarea id="new-comment" rows="2" maxlength="1000" placeholder="Deixe uma ideia ou atualização..." aria-label="Novo comentário"></textarea><button class="button button-light" type="button" data-action="add-comment" data-id="${escapeHTML(task.id)}" aria-label="Enviar comentário">${icon('arrow')}</button></div>`;
    $('.form-note', form).before(comments);
  }
  $('#task-dialog').showModal();
  form.elements.title.focus();
}

function commentsMarkup(task) {
  return task.comments.length ? task.comments.map((comment) => `<div class="comment-item">${avatar(comment.author)}<div><strong>${escapeHTML(comment.author)}</strong><p>${escapeHTML(comment.text)}</p></div></div>`).join('') : '<p class="no-comments">A conversa começa com uma ideia. Deixe a sua!</p>';
}

function openProject(id) {
  const project = getProject(id);
  const form = $('#project-form');
  form.reset();
  form.elements.id.value = project?.id || '';
  form.elements.name.value = project?.name || '';
  form.elements.description.value = project?.description || '';
  form.elements.color.value = project?.color || 'purple';
  $('#project-dialog-title').textContent = project ? 'Editar projeto' : 'Novo projeto';
  $('#save-project').textContent = project ? 'Salvar alterações' : 'Criar projeto';
  $('#delete-project').hidden = !project;
  $('#project-dialog').showModal();
  form.elements.name.focus();
}

function showConfirm(type, id) {
  const item = type === 'task' ? data.tasks.find((task) => task.id === id) : getProject(id);
  if (!item) return;
  pendingDelete = { type, id };
  const tasks = type === 'project' ? projectTasks(id).length : 0;
  $('#confirm-title').textContent = type === 'task' ? 'Excluir tarefa?' : 'Excluir projeto?';
  $('#confirm-description').textContent = type === 'task' ? `A tarefa “${item.title}” será excluída. Essa ação não pode ser desfeita.` : `O projeto “${item.name}” e suas ${tasks} tarefa${tasks !== 1 ? 's' : ''} serão excluídos. Essa ação não pode ser desfeita.`;
  $('#confirm-dialog').showModal();
}

function clearFilters() {
  Object.assign(state, { query: '', priority: '', status: '', dateFrom: '', dateTo: '', overdue: false });
  render();
}

function moveTask(id, status) {
  const task = data.tasks.find((item) => item.id === id);
  if (!task || !Object.hasOwn(STATUSES, status) || task.status === status) return;
  task.status = status;
  persist();
  render();
  safelySync(() => syncTask(task, true));
  toast(`Tarefa movida para ${STATUSES[status].toLowerCase()}.`);
}

function showHelp() {
  $('#info-title').textContent = 'Seu primeiro passo no TaskFlow';
  $('#info-content').innerHTML = '<ol class="help-steps"><li><strong>Dê um lugar às suas ideias</strong>Crie um projeto e escolha uma cor para identificar seu espaço.</li><li><strong>Transforme planos em tarefas</strong>Defina um título, um prazo e uma prioridade. Você também pode indicar o responsável.</li><li><strong>Faça o trabalho fluir</strong>Arraste os cartões entre as colunas ou abra uma tarefa para mudar o status. No celular, use o formulário ou a visualização em lista.</li><li><strong>Encontre o que importa</strong>Pesquise por nome, filtre por prioridade, status ou prazo e acompanhe os resultados no dashboard.</li></ol><p class="info-note">Com o servidor e o MongoDB configurados, as alterações são sincronizadas pela API. Sem conexão com o banco, o TaskFlow continua funcionando localmente neste navegador.</p>';
  $('#info-dialog').showModal();
}

function showNotifications() {
  const overdue = data.tasks.filter(isOverdue).sort((a, b) => a.due.localeCompare(b.due));
  $('#info-title').textContent = overdue.length ? `${overdue.length} tarefa${overdue.length > 1 ? 's' : ''} precisa${overdue.length > 1 ? 'm' : ''} de atenção` : 'Tudo em dia por aqui';
  $('#info-content').innerHTML = overdue.length ? overdue.map(deadlineMarkup).join('') : '<p class="info-note">Nenhuma tarefa atrasada. Continue assim, um passo de cada vez!</p>';
  $('#info-dialog').showModal();
}

const mobileLayout = window.matchMedia('(max-width: 760px)');
function syncSidebarAccessibility() {
  const open = document.body.classList.contains('sidebar-open');
  $('#sidebar').inert = mobileLayout.matches && !open;
  $('.app-shell').inert = mobileLayout.matches && open;
}
function closeSidebar() {
  const focusWasInSidebar = $('#sidebar').contains(document.activeElement);
  document.body.classList.remove('sidebar-open');
  $('#mobile-menu').setAttribute('aria-expanded', 'false');
  syncSidebarAccessibility();
  if (mobileLayout.matches && focusWasInSidebar) $('#mobile-menu').focus();
}

document.addEventListener('click', (event) => {
  const close = event.target.closest('[data-close]');
  if (close) { document.getElementById(close.dataset.close).close(); return; }
  const action = event.target.closest('[data-action]');
  if (action) {
    const id = action.dataset.id;
    switch (action.dataset.action) {
      case 'new-task': openTask(undefined, action.dataset.status || 'todo'); break;
      case 'edit-task': if ($('#info-dialog').open) $('#info-dialog').close(); openTask(id); break;
      case 'new-project': openProject(); break;
      case 'edit-project': openProject(id); break;
      case 'open-project': state.projectId = id; clearFilters(); navigate('quadro'); break;
      case 'go-board': navigate('quadro'); break;
      case 'layout': state.layout = action.dataset.layout; render(); $(`#${state.layout === 'kanban' ? 'kanban' : 'list'}-tab`)?.focus(); break;
      case 'toggle-filters': state.filtersOpen = !state.filtersOpen; render(); $('[data-action="toggle-filters"]')?.focus(); break;
      case 'clear-filters': clearFilters(); break;
      case 'help': showHelp(); break;
      case 'notifications': showNotifications(); break;
      case 'calendar-prev': state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1); render(); break;
      case 'calendar-next': state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1); render(); break;
      case 'calendar-today': state.calendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); render(); break;
      case 'add-comment': {
        const input = $('#new-comment');
        const text = input.value.trim();
        if (!text) { input.focus(); break; }
        const task = data.tasks.find((item) => item.id === id);
        if (!task) break;
        task.comments.push({ id: makeId(), author: 'Você', text, createdAt: new Date().toISOString() });
        persist();
        safelySync(() => syncTask(task));
        $('#comments-list').innerHTML = commentsMarkup(task);
        $('.comments-section .category').textContent = task.comments.length;
        input.value = '';
        input.focus();
        render();
        toast('Comentário adicionado.');
        break;
      }
    }
    return;
  }
  const card = event.target.closest('[data-task-id]');
  if (card && !event.target.closest('button, select, input')) openTask(card.dataset.taskId);
});

document.addEventListener('input', (event) => {
  if (event.target.matches('#board-search, #global-search')) {
    state.query = event.target.value;
    const switchToAll = event.target.id === 'global-search' && state.projectId !== 'all';
    if (switchToAll) state.projectId = 'all';
    if (state.view !== 'quadro') {
      state.projectId = 'all';
      navigate('quadro');
      // O hash pode atualizar de forma assíncrona: a busca é preservada no estado.
    } else if (switchToAll) {
      render();
    } else {
      refreshBoardContent();
      const other = event.target.id === 'board-search' ? $('#global-search') : $('#board-search');
      if (other) other.value = state.query;
    }
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  const filters = { 'project-filter': 'projectId', 'priority-filter': 'priority', 'status-filter': 'status', 'date-from-filter': 'dateFrom', 'date-to-filter': 'dateTo' };
  if (Object.hasOwn(filters, target.id)) {
    state[filters[target.id]] = target.value;
    if (state.dateFrom && state.dateTo && state.dateFrom > state.dateTo) {
      if (target.id === 'date-from-filter') state.dateTo = state.dateFrom; else state.dateFrom = state.dateTo;
      toast('Ajustamos o intervalo para manter o prazo inicial antes do final.');
    }
    render();
    document.getElementById(target.id)?.focus();
  }
  if (target.id === 'overdue-filter') { state.overdue = Boolean(target.value); render(); $('#overdue-filter').focus(); }
  if (target.dataset.taskStatus) moveTask(target.dataset.taskStatus, target.value);
});

$('#task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = form.elements;
  if (!fields.title.value.trim()) { fields.title.setCustomValidity('Dê um título para a tarefa.'); fields.title.reportValidity(); return; }
  if (!getProject(fields.projectId.value)) { toast('Selecione um projeto válido.', true); return; }
  const existing = data.tasks.find((task) => task.id === fields.id.value);
  const values = { title: fields.title.value.trim(), description: fields.description.value.trim(), projectId: fields.projectId.value, priority: fields.priority.value, status: fields.status.value, due: fields.due.value, assignee: fields.assignee.value.trim() };
  if (existing) Object.assign(existing, values);
  else data.tasks.push({ ...values, id: makeId(), category: 'Tarefa', comments: [], createdAt: new Date().toISOString() });
  if (state.projectId !== 'all' && state.projectId !== values.projectId) state.projectId = values.projectId;
  persist();
  const saved = await safelySync(() => syncTask(existing || data.tasks.at(-1)));
  if (saved) {
    const target = existing || data.tasks.at(-1);
    Object.assign(target, saved);
    persist();
  }
  $('#task-dialog').close();
  render();
  toast(existing ? 'Tarefa atualizada. Cada detalhe conta!' : 'Nova tarefa criada. Vamos fazer acontecer!');
});

$('#project-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const fields = event.currentTarget.elements;
  if (!fields.name.value.trim()) { fields.name.setCustomValidity('Dê um nome para o projeto.'); fields.name.reportValidity(); return; }
  const existing = getProject(fields.id.value);
  const values = { name: fields.name.value.trim(), description: fields.description.value.trim(), color: fields.color.value };
  let project = existing;
  if (existing) Object.assign(existing, values);
  else {
    project = { ...values, id: makeId(), createdAt: today() };
    data.projects.push(project);
    state.projectId = project.id;
    Object.assign(state, { query: '', priority: '', status: '', dateFrom: '', dateTo: '', overdue: false });
  }
  persist();
  const previousId = project.id;
  const saved = await safelySync(() => syncProject(project));
  if (saved) {
    Object.assign(project, saved);
    data.tasks.forEach((task) => { if (task.projectId === previousId) task.projectId = saved.id; });
    if (state.projectId === previousId) state.projectId = saved.id;
    persist();
  }
  $('#project-dialog').close();
  if (!existing) navigate('quadro');
  render();
  toast(existing ? 'Projeto atualizado.' : 'Seu novo projeto está pronto para começar!');
});

// Remove a mensagem de validação assim que o usuário corrigir o campo.
[$('#task-form').elements.title, $('#project-form').elements.name].forEach((field) => field.addEventListener('input', () => field.setCustomValidity('')));
$('#delete-task').addEventListener('click', () => showConfirm('task', $('#task-form').elements.id.value));
$('#delete-project').addEventListener('click', () => showConfirm('project', $('#project-form').elements.id.value));
$('#confirm-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!pendingDelete) return;
  const { type, id } = pendingDelete;
  if (apiEnabled && mongoId(id)) {
    await safelySync(() => apiRequest(`/${type === 'task' ? 'tarefas' : 'projetos'}/${id}`, { method: 'DELETE' }));
  }
  if (type === 'task') {
    data.tasks = data.tasks.filter((task) => task.id !== id);
    $('#task-dialog').close();
  } else {
    data.projects = data.projects.filter((project) => project.id !== id);
    data.tasks = data.tasks.filter((task) => task.projectId !== id);
    if (state.projectId === id) state.projectId = data.projects[0]?.id || 'all';
    $('#project-dialog').close();
  }
  pendingDelete = null;
  persist();
  $('#confirm-dialog').close();
  render();
  toast(type === 'task' ? 'Tarefa excluída.' : 'Projeto e tarefas excluídos.');
});

document.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-task-id]');
  if (!card) return;
  draggedTask = card.dataset.taskId;
  event.dataTransfer.setData('text/plain', draggedTask);
  event.dataTransfer.effectAllowed = 'move';
  card.classList.add('dragging');
});
document.addEventListener('dragover', (event) => {
  const column = event.target.closest('[data-drop-status]');
  if (!column || !draggedTask) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  $$('.kanban-column').forEach((item) => item.classList.toggle('drag-over', item === column));
});
document.addEventListener('dragleave', (event) => {
  const column = event.target.closest('[data-drop-status]');
  if (column && !column.contains(event.relatedTarget)) column.classList.remove('drag-over');
});
document.addEventListener('drop', (event) => {
  const column = event.target.closest('[data-drop-status]');
  if (!column || !draggedTask) return;
  event.preventDefault();
  const taskId = draggedTask;
  draggedTask = null;
  moveTask(taskId, column.dataset.dropStatus);
  $$('.drag-over, .dragging').forEach((element) => element.classList.remove('drag-over', 'dragging'));
});
document.addEventListener('dragend', () => { draggedTask = null; $$('.drag-over, .dragging').forEach((element) => element.classList.remove('drag-over', 'dragging')); });

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if ($('dialog[open]')) return;
    if (state.view !== 'quadro') { state.projectId = 'all'; state.view = 'quadro'; history.replaceState(null, '', '#quadro'); render(); }
    const search = window.matchMedia('(min-width: 1001px)').matches ? $('#global-search') : $('#board-search');
    search?.focus();
  }
  if (event.key === 'Escape') closeSidebar();
  const card = event.target.closest('[data-task-id]');
  if (card && event.target === card && ['Enter', ' '].includes(event.key)) { event.preventDefault(); openTask(card.dataset.taskId); }
  if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    state.layout = event.key === 'Home' ? 'kanban' : event.key === 'End' ? 'list' : state.layout === 'kanban' ? 'list' : 'kanban';
    render();
    $(`#${state.layout === 'kanban' ? 'kanban' : 'list'}-tab`).focus();
  }
});

$('#mobile-menu').addEventListener('click', () => {
  const open = document.body.classList.toggle('sidebar-open');
  $('#mobile-menu').setAttribute('aria-expanded', String(open));
  syncSidebarAccessibility();
  if (open) $('.brand').focus();
});
mobileLayout.addEventListener('change', closeSidebar);
$('#sidebar-backdrop').addEventListener('click', closeSidebar);
$$('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
}));
window.addEventListener('hashchange', () => { const view = location.hash.slice(1); state.view = ['dashboard', 'projetos', 'quadro', 'calendario'].includes(view) ? view : 'quadro'; closeSidebar(); render(); });
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    const incoming = JSON.parse(event.newValue);
    if (!validStoredData(incoming)) return;
    data = incoming;
    if (state.projectId !== 'all' && !getProject(state.projectId)) state.projectId = data.projects[0]?.id || 'all';
    render();
    toast('Workspace atualizado com as alterações de outra aba.');
  } catch { /* Mantém os dados atuais quando uma gravação externa é inválida. */ }
});

render();
syncSidebarAccessibility();
if (storageWarning) toast(storageWarning, true);
hydrateFromApi();
