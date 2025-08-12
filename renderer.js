const STORAGE_KEY = 'sticky-tasks:v1';
let state = loadState();

function loadState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { notes: [] }; }
  catch{ return { notes: [] }; }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uuid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const board = document.getElementById('board');
const tpl = document.getElementById('note-tpl');
const newBtn = document.getElementById('newNoteBtn');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const searchInput = document.getElementById('searchInput');

function createNote(data){
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = data.id;
  node.dataset.color = data.color || 'yellow';
  node.style.order = data.order ?? 0;

  const title = node.querySelector('.title');
  const content = node.querySelector('.content');
  const due = node.querySelector('.due');
  const color = node.querySelector('.color');
  const del = node.querySelector('.delete');
  const done = node.querySelector('.done');

  title.value = data.title || '';
  content.value = data.content || '';
  if (data.due) due.value = data.due;
  color.value = data.color || 'yellow';
  done.checked = !!data.done;
  if (done.checked) node.classList.add('done');

  title.addEventListener('input', () => { data.title = title.value; saveState(); });
  content.addEventListener('input', () => { data.content = content.value; saveState(); });
  due.addEventListener('change', () => { data.due = due.value || null; saveState(); });
  color.addEventListener('change', () => { data.color = color.value; node.dataset.color = color.value; saveState(); });
  del.addEventListener('click', () => removeNote(data.id));
  done.addEventListener('change', () => { data.done = done.checked; node.classList.toggle('done', done.checked); saveState(); });

  // Drag & drop (via CSS order)
  node.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', data.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  node.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
  node.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === data.id) return;
    const dragged = state.notes.find(n => n.id === draggedId);
    if (!dragged) return;
    const tmp = dragged.order ?? 0;
    dragged.order = data.order ?? 0;
    data.order = tmp;
    render(); saveState();
  });

  return node;
}

function removeNote(id){ state.notes = state.notes.filter(n => n.id !== id); render(); saveState(); }
function addNote(){
  const maxOrder = state.notes.reduce((m, n) => Math.max(m, n.order ?? 0), 0);
  const note = { id: uuid(), title: '', content: '', due: null, color: 'yellow', done: false, order: maxOrder + 1 };
  state.notes.push(note); render(); saveState();
}
function render(){
  const q = (searchInput.value || '').toLowerCase().trim();
  board.innerHTML = '';
  const sorted = [...state.notes].sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
  for (const n of sorted){
    const node = createNote(n);
    const text = (n.title + ' ' + n.content).toLowerCase();
    node.classList.toggle('hidden', q && !text.includes(q));
    board.appendChild(node);
  }
}

newBtn.addEventListener('click', addNote);
clearDoneBtn.addEventListener('click', () => { state.notes = state.notes.filter(n => !n.done); render(); saveState(); });
searchInput.addEventListener('input', render);

// Raccourci dans la fenêtre
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); addNote(); }
});

// Raccourci global venant du main process
if (window.stickyAPI && window.stickyAPI.onCreateNewNote) {
  window.stickyAPI.onCreateNewNote(() => addNote());
}

render();
