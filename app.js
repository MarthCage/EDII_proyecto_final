const initialCourses = [
  { id: "curso_1", name: "Curso 1", cycle: 1 },
  { id: "curso_2", name: "Curso 2", cycle: 1 },
  { id: "curso_3", name: "Curso 3", cycle: 1 },
  { id: "curso_4", name: "Curso 4", cycle: 1 },
  { id: "curso_5", name: "Curso 5", cycle: 2 },
  { id: "curso_6", name: "Curso 6", cycle: 2 },
  { id: "curso_7", name: "Curso 7", cycle: 2 }
];

const initialEdges = [
  ["curso_1", "curso_5"],
  ["curso_2", "curso_6"],
  ["curso_2", "curso_7"]
];

let courses = structuredClone(initialCourses);
let edges = structuredClone(initialEdges);

const courseNameInput = document.getElementById("courseName");
const courseCycleSelect = document.getElementById("courseCycle");
const fromCourseSelect = document.getElementById("fromCourse");
const toCourseSelect = document.getElementById("toCourse");
const dependCourseSelect = document.getElementById("dependCourse");
const approvedInput = document.getElementById("approvedInput");
const graphSvg = document.getElementById("graphSvg");

const addCourseBtn = document.getElementById("addCourseBtn");
const deleteCourseBtn = document.getElementById("deleteCourseBtn");
const addRelationBtn = document.getElementById("addRelationBtn");
const validateDagBtn = document.getElementById("validateDagBtn");
const runBfsBtn = document.getElementById("runBfsBtn");
const availableBtn = document.getElementById("availableBtn");

const modalOverlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");

function normalizeText(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function makeId(name) {
  let base = normalizeText(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  if (!base) base = "curso";

  let candidate = base;
  let counter = 2;
  while (courses.some(course => course.id === candidate)) {
    candidate = `${base}_${counter}`;
    counter += 1;
  }
  return candidate;
}

function getCourse(id) {
  return courses.find(course => course.id === id);
}

function findCourseByName(name) {
  const target = normalizeText(name);
  return courses.find(course => normalizeText(course.name) === target);
}

function showModal(html) {
  modalBody.innerHTML = html;
  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

function sortedCourses() {
  return courses.slice().sort((a, b) => a.cycle - b.cycle || a.name.localeCompare(b.name));
}

function fillCourseSelect(selectElement, placeholderText) {
  selectElement.innerHTML = `<option value="" selected disabled>${placeholderText}</option>`;

  for (const course of sortedCourses()) {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.name;
    selectElement.appendChild(option);
  }
}

function renderSelects() {
  fillCourseSelect(fromCourseSelect, "Escoge curso");
  fillCourseSelect(toCourseSelect, "Escoge curso");
  fillCourseSelect(dependCourseSelect, "Escoge curso");
}

function buildMaps() {
  const adjacency = new Map();
  const prerequisites = new Map();

  for (const course of courses) {
    adjacency.set(course.id, []);
    prerequisites.set(course.id, []);
  }

  for (const [from, to] of edges) {
    if (adjacency.has(from) && prerequisites.has(to)) {
      adjacency.get(from).push(to);
      prerequisites.get(to).push(from);
    }
  }

  return { adjacency, prerequisites };
}

function addCourse() {
  const name = courseNameInput.value.trim();
  const cycle = Number(courseCycleSelect.value);

  if (!name) {
    showModal(`<p>Debes escribir el <span class="highlight">nombre del curso</span> antes de agregarlo.</p>`);
    return;
  }

  if (!cycle) {
    showModal(`<p>Debes escoger el <span class="highlight">ciclo</span> del curso antes de agregarlo.</p>`);
    return;
  }

  if (findCourseByName(name)) {
    showModal(`<p>El curso <span class="highlight">${escapeHtml(name)}</span> ya existe en la malla.</p>`);
    return;
  }

  const newCourse = {
    id: makeId(name),
    name,
    cycle
  };

  courses.push(newCourse);
  courseNameInput.value = "";
  courseCycleSelect.value = "";
  renderAll();

  showModal(`
    <p>El curso <span class="highlight">${escapeHtml(newCourse.name)}</span> fue agregado correctamente.</p>
    <p class="small-note">Se registró como vértice del grafo en el ciclo ${newCourse.cycle}.</p>
  `);
}

function deleteCourse() {
  const name = courseNameInput.value.trim();

  if (!name) {
    showModal(`<p>Escribe el nombre del curso que deseas borrar en el campo <span class="highlight">Nombre de curso</span>.</p>`);
    return;
  }

  const course = findCourseByName(name);

  if (!course) {
    showModal(`<p>No se encontró el curso <span class="highlight">${escapeHtml(name)}</span> en la malla.</p>`);
    return;
  }

  courses = courses.filter(item => item.id !== course.id);
  edges = edges.filter(([from, to]) => from !== course.id && to !== course.id);
  courseNameInput.value = "";
  renderAll();

  showModal(`
    <p>El curso <span class="highlight">${escapeHtml(course.name)}</span> fue borrado correctamente.</p>
    <p class="small-note">También se eliminaron sus relaciones de prerrequisito asociadas.</p>
  `);
}

function addRelation() {
  const from = fromCourseSelect.value;
  const to = toCourseSelect.value;

  if (!from || !to) {
    showModal(`<p>Debes escoger el <span class="highlight">curso</span> y el <span class="highlight">curso que abre</span> para crear la relación.</p>`);
    return;
  }

  if (from === to) {
    showModal(`<p>Un curso no puede abrirse a sí mismo. Esa relación generaría un ciclo directo.</p>`);
    return;
  }

  const fromCourse = getCourse(from);
  const toCourse = getCourse(to);

  if (fromCourse.cycle === toCourse.cycle) {
    showModal(`
      <p>No se puede crear esta relación.</p>
      <p><span class="highlight">${escapeHtml(fromCourse.name)}</span> y <span class="highlight">${escapeHtml(toCourse.name)}</span> pertenecen al mismo ciclo.</p>
      <p class="small-note">En una malla curricular, un prerrequisito debe estar en un ciclo anterior al curso que habilita.</p>
    `);
    return;
  }

  if (fromCourse.cycle > toCourse.cycle) {
    showModal(`
      <p>No se puede crear esta relación.</p>
      <p><span class="highlight">${escapeHtml(fromCourse.name)}</span> está en un ciclo posterior a <span class="highlight">${escapeHtml(toCourse.name)}</span>.</p>
      <p class="small-note">Un curso de un ciclo superior no debería ser prerrequisito de un curso de ciclo anterior.</p>
    `);
    return;
  }

  if (edges.some(([a, b]) => a === from && b === to)) {
    showModal(`<p>La relación seleccionada ya existe en el grafo.</p>`);
    return;
  }

  edges.push([from, to]);
  renderGraph();

  const fromName = fromCourse.name;
  const toName = toCourse.name;

  showModal(`
    <p>Se creó la relación:</p>
    <p><span class="highlight">${escapeHtml(fromName)}</span> → <span class="highlight">${escapeHtml(toName)}</span></p>
    <p class="small-note">Esto significa que ${escapeHtml(fromName)} es prerrequisito de ${escapeHtml(toName)}.</p>
  `);
}

function bfs(startId) {
  const { adjacency } = buildMaps();
  const visited = new Set([startId]);
  const queue = [{ id: startId, level: 0 }];
  const levels = new Map();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!levels.has(current.level)) {
      levels.set(current.level, []);
    }

    levels.get(current.level).push(current.id);

    const neighbors = adjacency.get(current.id) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, level: current.level + 1 });
      }
    }
  }

  return levels;
}

function runDependencyBfs() {
  const startId = dependCourseSelect.value;

  if (!startId) {
    showModal(`<p>Escoge un curso para ejecutar BFS.</p>`);
    return;
  }

  const startCourse = getCourse(startId);
  const levels = bfs(startId);
  let html = `<p>Recorrido BFS desde <span class="highlight">${escapeHtml(startCourse.name)}</span>:</p>`;
  let hasDependents = false;

  for (const [level, ids] of levels.entries()) {
    if (level === 0) continue;
    hasDependents = true;
    const names = ids.map(id => escapeHtml(getCourse(id).name)).join(", ");
    html += `<p><span class="highlight">Nivel ${level}:</span> ${names}</p>`;
  }

  if (!hasDependents) {
    html += `<p>No hay cursos que dependan de <span class="highlight">${escapeHtml(startCourse.name)}</span>.</p>`;
  }

  html += `<p class="small-note">BFS recorre el grafo por niveles usando una cola.</p>`;
  showModal(html);
}

function detectCycleDfs() {
  const { adjacency } = buildMaps();
  const color = new Map();
  const parent = new Map();

  for (const course of courses) {
    color.set(course.id, "white");
  }

  function visit(id) {
    color.set(id, "gray");

    for (const next of adjacency.get(id) || []) {
      if (color.get(next) === "white") {
        parent.set(next, id);
        const result = visit(next);
        if (result.hasCycle) return result;
      }

      if (color.get(next) === "gray") {
        const cycle = [next];
        let current = id;

        while (current && current !== next) {
          cycle.push(current);
          current = parent.get(current);
        }

        cycle.push(next);
        cycle.reverse();
        return { hasCycle: true, cycle };
      }
    }

    color.set(id, "black");
    return { hasCycle: false, cycle: [] };
  }

  for (const course of courses) {
    if (color.get(course.id) === "white") {
      const result = visit(course.id);
      if (result.hasCycle) return result;
    }
  }

  return { hasCycle: false, cycle: [] };
}

function validateDag() {
  const result = detectCycleDfs();

  if (result.hasCycle) {
    const cycleText = result.cycle.map(id => escapeHtml(getCourse(id)?.name || id)).join(" → ");
    showModal(`
      <p><span class="bad">La malla no es un DAG.</span></p>
      <p>DFS detectó el siguiente ciclo:</p>
      <p><span class="highlight">${cycleText}</span></p>
      <p class="small-note">Una malla válida no debe tener ciclos porque un curso terminaría dependiendo de sí mismo.</p>
    `);
    return;
  }

  showModal(`
    <p><span class="ok">La malla sí es un DAG.</span></p>
    <p>No se detectaron ciclos dirigidos mediante DFS.</p>
    <p class="small-note">La estructura de prerrequisitos es válida porque permite avanzar sin dependencias circulares.</p>
  `);
}

function calculateAvailableCourses() {
  const raw = approvedInput.value.trim();

  if (!raw) {
    showModal(`<p>Escribe uno o más cursos aprobados separados por comas.</p><p class="small-note">Ejemplo: Curso 1, Curso 2</p>`);
    return;
  }

  const names = raw.split(",").map(item => item.trim()).filter(Boolean);
  const approvedIds = new Set();
  const unknown = [];

  for (const name of names) {
    const course = findCourseByName(name);
    if (course) {
      approvedIds.add(course.id);
    } else {
      unknown.push(name);
    }
  }

  if (approvedIds.size === 0) {
    showModal(`<p>No se reconoció ningún curso aprobado.</p><p class="small-note">Verifica que los nombres coincidan con los cursos registrados.</p>`);
    return;
  }

  const { prerequisites } = buildMaps();
  const available = sortedCourses().filter(course => {
    if (approvedIds.has(course.id)) return false;
    const required = prerequisites.get(course.id) || [];
    return required.length > 0 && required.every(id => approvedIds.has(id));
  });

  let html = `<p>Cursos aprobados reconocidos:</p><p><span class="highlight">${Array.from(approvedIds).map(id => escapeHtml(getCourse(id).name)).join(", ")}</span></p>`;

  if (unknown.length > 0) {
    html += `<p class="small-note">No se encontraron: ${unknown.map(escapeHtml).join(", ")}.</p>`;
  }

  if (available.length === 0) {
    html += `<p>No hay nuevos cursos disponibles con esos cursos aprobados.</p>`;
  } else {
    html += `<p>Con esos cursos aprobados, podrías llevar:</p><ul>`;
    for (const course of available) {
      const requiredNames = (prerequisites.get(course.id) || []).map(id => getCourse(id).name).join(", ");
      html += `<li><span class="highlight">${escapeHtml(course.name)}</span> <span class="small-note">(requiere: ${escapeHtml(requiredNames)})</span></li>`;
    }
    html += `</ul>`;
  }

  showModal(html);
}

function renderGraph() {
  const maxCycle = Math.max(3, ...courses.map(course => course.cycle));
  const width = Math.max(650, maxCycle * 235);
  const byCycle = new Map();

  for (let cycle = 1; cycle <= maxCycle; cycle += 1) {
    byCycle.set(cycle, []);
  }

  for (const course of sortedCourses()) {
    if (!byCycle.has(course.cycle)) {
      byCycle.set(course.cycle, []);
    }
    byCycle.get(course.cycle).push(course);
  }

  const maxRows = Math.max(4, ...Array.from(byCycle.values()).map(list => list.length));
  const height = Math.max(390, 78 + maxRows * 62);

  graphSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  graphSvg.setAttribute("width", width);
  graphSvg.setAttribute("height", height);
  graphSvg.innerHTML = `
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,8 L8,4 z" fill="#e1e0ee"></path>
      </marker>
    </defs>
  `;

  const positions = new Map();
  const nodeWidth = 124;
  const nodeHeight = 36;
  const startX = 34;
  const startY = 76;
  const colGap = 230;
  const rowGap = 62;

  for (let cycle = 1; cycle <= maxCycle; cycle += 1) {
    const x = startX + (cycle - 1) * colGap;

    const label = createSvg("text", {
      x,
      y: 23,
      class: "cycle-label"
    });
    label.textContent = `Ciclo ${cycle}`;
    graphSvg.appendChild(label);

    const list = byCycle.get(cycle) || [];
    list.forEach((course, index) => {
      positions.set(course.id, {
        x: x + 34,
        y: startY + index * rowGap
      });
    });
  }

  for (const [from, to] of edges) {
    const a = positions.get(from);
    const b = positions.get(to);
    if (!a || !b) continue;

    const x1 = a.x + nodeWidth + 8;
    const y1 = a.y + nodeHeight / 2;
    const x2 = b.x - 8;
    const y2 = b.y + nodeHeight / 2;

    const path = createSvg("path", {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      class: "edge",
      "marker-end": "url(#arrow)"
    });
    graphSvg.appendChild(path);
  }

  for (const course of sortedCourses()) {
    const pos = positions.get(course.id);
    if (!pos) continue;

    const rect = createSvg("rect", {
      x: pos.x,
      y: pos.y,
      width: nodeWidth,
      height: nodeHeight,
      class: "node-rect"
    });
    graphSvg.appendChild(rect);

    const text = createSvg("text", {
      x: pos.x + nodeWidth / 2,
      y: pos.y + nodeHeight / 2 + 1,
      class: "node-text"
    });
    text.textContent = fitName(course.name);
    graphSvg.appendChild(text);
  }
}

function fitName(name) {
  return name.length > 16 ? `${name.slice(0, 15)}…` : name;
}

function createSvg(tag, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }

  return element;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAll() {
  renderSelects();
  renderGraph();
}

addCourseBtn.addEventListener("click", addCourse);
deleteCourseBtn.addEventListener("click", deleteCourse);
addRelationBtn.addEventListener("click", addRelation);
validateDagBtn.addEventListener("click", validateDag);
runBfsBtn.addEventListener("click", runDependencyBfs);
availableBtn.addEventListener("click", calculateAvailableCourses);
closeModalBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", event => {
  if (event.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

renderAll();
