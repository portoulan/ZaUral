/* Interactive migration map — GitHub Pages */
const CONFIG = {
  years: Array.from({length: 21}, (_, i) => 1896 + i),
  animationInterval: [1600, 900, 450],
  antDelay: [700, 350, 140],
  colors: {
    flow: '#d85b36',
    boundary: '#7d8790',
    boundaryFill: '#e9edf0'
  }
};

const state = {
  nodes: new Map(),
  edges: new Map(),
  fromRows: [],
  toRows: [],
  regionByNode: new Map(),
  destinationNodes: new Set(),
  currentYear: 1896,
  playing: false,
  speedIndex: 0,
  timer: null
};

const map = L.map('map', { zoomControl: true }).setView([55, 55], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 10,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const flowLayer = L.layerGroup().addTo(map);

const baseLayer = L.geoJSON(null, {
  style: {
    color: CONFIG.colors.boundary,
    weight: 0.7,
    fillColor: CONFIG.colors.boundaryFill,
    fillOpacity: 0.42
  }
}).addTo(map);

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (!lines.length) return [];
  const headers = lines[0].split(';').map(v => v.trim());
  return lines.slice(1).map(line => {
    const cells = line.split(';');
    const obj = {};
    headers.forEach((h, i) => obj[h] = (cells[i] ?? '').trim());
    return obj;
  });
}

function num(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

async function loadText(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.text();
}

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

function addRegionName(node, name) {
  node = String(node || '').trim();
  name = String(name || '').trim();
  if (!node || !name) return;
  if (!state.regionByNode.has(node)) state.regionByNode.set(node, new Set());
  state.regionByNode.get(node).add(name);
}

function indexData() {
  state.regionByNode.clear();
  state.destinationNodes.clear();

  for (const r of state.fromRows) addRegionName(r.EDGE, r.Origin);

  for (const r of state.toRows) {
    const node = (r.EDGE || '').trim();
    addRegionName(node, r.Destination || r.Destinatoin);
    if (node) state.destinationNodes.add(node);
  }
}

/*
  EDGES.csv describes directed chains. Duplicate consecutive declarations
  are removed. Example:
  N303;N501;N502;...;N332
  becomes N303 -> N501 -> N502 -> ... -> N332.
*/
function buildGraph(edgesText) {
  state.edges.clear();

  for (const line of edgesText.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const chain = line.split(';')
      .map(v => v.trim())
      .filter(v => /^N\d+$/i.test(v));

    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i], b = chain[i + 1];
      if (!state.edges.has(a)) state.edges.set(a, []);
      if (!state.edges.get(a).includes(b)) state.edges.get(a).push(b);
    }
  }
}

/*
  Flow model:
  - migration_from injects the annual number at its source node.
  - the amount travels along EDGES.csv.
  - at a destination node (migration_to) the route ends.
  - at a merge, incoming flows are summed.
  - at a branch, the flow is split in proportion to the annual destination
    volumes reachable through each branch; if no destination volume is
    available below the branch, it is split equally.
*/
function calculateFlows(year) {
  const injected = new Map();

  for (const r of state.fromRows) {
    const node = (r.EDGE || '').trim();
    const value = num(r[`year_${year}`]);
    if (node && value > 0) injected.set(node, (injected.get(node) || 0) + value);
  }

  const destinationVolume = new Map();
  for (const r of state.toRows) {
    const node = (r.EDGE || '').trim();
    const value = num(r[`year_${year}`]);
    if (node && value > 0) destinationVolume.set(node, (destinationVolume.get(node) || 0) + value);
  }

  // The graph is acyclic in the supplied EDGES.csv. Build a topological order.
  const indegree = new Map();
  const allNodes = new Set([...state.edges.keys(), ...injected.keys()]);
  for (const [a, bs] of state.edges) {
    allNodes.add(a);
    for (const b of bs) {
      allNodes.add(b);
      indegree.set(b, (indegree.get(b) || 0) + 1);
    }
  }

  const queue = [...allNodes].filter(n => (indegree.get(n) || 0) === 0);
  const topo = [];
  while (queue.length) {
    const u = queue.shift();
    topo.push(u);
    for (const v of state.edges.get(u) || []) {
      indegree.set(v, (indegree.get(v) || 0) - 1);
      if (indegree.get(v) === 0) queue.push(v);
    }
  }

  // Downstream destination demand used only to determine branch shares.
  const downstreamDemand = new Map();
  for (const node of [...topo].reverse()) {
    let d = destinationVolume.get(node) || 0;
    for (const child of state.edges.get(node) || []) d += downstreamDemand.get(child) || 0;
    downstreamDemand.set(node, d);
  }

  const incoming = new Map(injected);
  const flow = new Map();

  for (const a of topo) {
    const total = incoming.get(a) || 0;
    const next = state.edges.get(a) || [];

    if (total <= 0 || !next.length || state.destinationNodes.has(a)) continue;

    const weights = next.map(b => downstreamDemand.get(b) || 0);
    const weightSum = weights.reduce((s, x) => s + x, 0);
    const shares = weightSum > 0
      ? weights.map(w => total * w / weightSum)
      : next.map(() => total / next.length);

    next.forEach((b, i) => {
      const amount = shares[i];
      if (amount <= 0) return;
      const key = `${a}>${b}`;
      flow.set(key, (flow.get(key) || 0) + amount);
      incoming.set(b, (incoming.get(b) || 0) + amount);
    });
  }

  return { flow };
}

function weightFor(value, max) {
  if (!value || value <= 0) return 0;
  const ratio = Math.log10(value + 1) / Math.log10(max + 1);
  return 1.5 + 9.5 * Math.max(0, Math.min(1, ratio));
}

function namesForSegment(a, b) {
  const names = new Set([
    ...(state.regionByNode.get(a) || []),
    ...(state.regionByNode.get(b) || [])
  ]);
  return [...names];
}

function renderYear(year) {
  state.currentYear = year;
  document.getElementById('yearLabel').textContent = year;
  document.getElementById('yearSlider').value = year;

  document.querySelectorAll('.years button').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.year) === year);
  });

  flowLayer.clearLayers();

  const { flow } = calculateFlows(year);
  const values = [...flow.values()].filter(v => v > 0);
  const max = Math.max(...values, 1);

  for (const [key, value] of flow) {
    if (value <= 0) continue;

    const [a, b] = key.split('>');
    const A = state.nodes.get(a);
    const B = state.nodes.get(b);
    if (!A || !B) continue;

    const path = L.polyline.antPath(
      [[A.lat, A.lon], [B.lat, B.lon]],
      {
        delay: CONFIG.antDelay[state.speedIndex],
        dashArray: [10, 20],
        weight: weightFor(value, max),
        color: CONFIG.colors.flow,
        pulseColor: '#ffffff',
        paused: !state.playing,
        hardwareAccelerated: true,
        reverse: false,
        opacity: 0.86,
        lineCap: 'round',
        lineJoin: 'round'
      }
    );

    // По наведению ничего не показываем.
    // По клику показываем только название губернии/губерний.
    const names = namesForSegment(a, b);
    if (names.length) {
      path.bindPopup(
        `<div class="region-popup">${names.map(escapeHtml).join('<br>')}</div>`,
        { closeButton: true }
      );
    }

    path.on('mouseover', () => path.setStyle({ opacity: 1 }));
    path.on('mouseout', () => path.setStyle({ opacity: 0.86 }));
    path.addTo(flowLayer);
  }

  document.getElementById('status').textContent =
    `Год ${year}: показано потоков — ${flow.size.toLocaleString('ru-RU')}.`;
}

function buildYearButtons() {
  const box = document.getElementById('yearButtons');
  box.innerHTML = '';

  CONFIG.years.forEach(year => {
    const btn = document.createElement('button');
    btn.textContent = year;
    btn.dataset.year = year;
    btn.onclick = () => {
      pauseAnimation();
      renderYear(year);
    };
    box.appendChild(btn);
  });
}

function pauseAnimation() {
  state.playing = false;
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
  renderYear(state.currentYear);
}

function startAnimation() {
  state.playing = true;
  renderYear(state.currentYear);

  if (state.timer) clearInterval(state.timer);

  state.timer = setInterval(() => {
    const idx = CONFIG.years.indexOf(state.currentYear);
    const next = CONFIG.years[(idx + 1) % CONFIG.years.length];
    renderYear(next);
  }, CONFIG.animationInterval[state.speedIndex]);
}

function toggleSpeed() {
  state.speedIndex = (state.speedIndex + 1) % 3;
  document.getElementById('speedBtn').textContent =
    `Скорость: ×${[1, 2, 4][state.speedIndex]}`;

  if (state.playing) startAnimation();
  else renderYear(state.currentYear);
}

function showTable(kind) {
  const rows = kind === 'from' ? state.fromRows : state.toRows;
  const title = kind === 'from'
    ? 'Исход — migration_from.csv'
    : 'Водворение — migration_to.csv';

  document.getElementById('tableTitle').textContent = title;
  document.getElementById('tablePanel').classList.remove('hidden');

  const nameKey = kind === 'from'
    ? 'Origin'
    : (rows[0] && ('Destination' in rows[0] ? 'Destination' : 'Destinatoin'));

  const list = rows.map(r => ({
    name: r[nameKey] || '',
    node: r.EDGE || '',
    value: num(r[`year_${state.currentYear}`])
  })).sort((a, b) => b.value - a.value);

  document.getElementById('tableContent').innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>Губерния</th><th>Узел</th><th>${state.currentYear}</th></tr>
        </thead>
        <tbody>
          ${list.map(r => `
            <tr>
              <td>${escapeHtml(r.name)}</td>
              <td>${escapeHtml(r.node)}</td>
              <td>${r.value.toLocaleString('ru-RU')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));
}

async function init() {
  try {
    const [geo, nodesText, edgesText, fromText, toText] = await Promise.all([
      loadJSON('data.geojson'),
      loadText('NODES.csv'),
      loadText('EDGES.csv'),
      loadText('migration_from.csv'),
      loadText('migration_to.csv')
    ]);

    baseLayer.addData(geo);

    for (const r of parseCSV(nodesText)) {
      const id = (r.id || '').trim();
      const lon = num(r.lon);
      const lat = num(r.lat);
      if (id && Number.isFinite(lon) && Number.isFinite(lat)) {
        state.nodes.set(id, { lon, lat });
      }
    }

    buildGraph(edgesText);
    state.fromRows = parseCSV(fromText);
    state.toRows = parseCSV(toText);
    indexData();

    buildYearButtons();
    renderYear(CONFIG.years[0]);

    const bounds = baseLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.04));

    document.getElementById('status').textContent =
      `Загружено узлов: ${state.nodes.size}; источников: ${state.fromRows.length}; строк водворения: ${state.toRows.length}.`;
  } catch (err) {
    console.error(err);
    document.getElementById('status').innerHTML =
      `<strong>Ошибка загрузки.</strong> Проверьте, что все файлы лежат рядом с index.html.<br>${escapeHtml(err.message)}`;
  }
}

document.getElementById('playBtn').onclick = startAnimation;
document.getElementById('pauseBtn').onclick = pauseAnimation;
document.getElementById('speedBtn').onclick = toggleSpeed;

document.getElementById('yearSlider').oninput = e => {
  pauseAnimation();
  renderYear(Number(e.target.value));
};

document.getElementById('fromBtn').onclick = () => showTable('from');
document.getElementById('toBtn').onclick = () => showTable('to');
document.getElementById('closeTable').onclick = () =>
  document.getElementById('tablePanel').classList.add('hidden');

document.getElementById('panelToggle').onclick = () => {
  const controls = document.querySelector('.controls');
  controls.style.display = controls.style.display === 'none' ? '' : 'none';
};

init();
