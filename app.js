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


const CHART_COLORS = [
  '#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e',
  '#17becf', '#e377c2', '#8c564b', '#bcbd22', '#3366cc'
];
const OTHER_COLOR = '#808080';

const pieCalloutPlugin = {
  id: 'pieCalloutLabels',
  afterDraw(chart) {
    if (chart.config.type !== 'pie') return;
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    const data = chart.data.datasets[0].data;
    const total = data.reduce((a,b) => a + Number(b || 0), 0);
    if (!total) return;

    ctx.save();
    ctx.font = '600 12px Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;

    meta.data.forEach((arc, i) => {
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const r = arc.outerRadius;
      const cx = arc.x, cy = arc.y;
      const x1 = cx + Math.cos(angle) * r;
      const y1 = cy + Math.sin(angle) * r;
      const elbow = r + 18;
      const x2 = cx + Math.cos(angle) * elbow;
      const y2 = cy + Math.sin(angle) * elbow;
      const right = Math.cos(angle) >= 0;
      const x3 = x2 + (right ? 34 : -34);
      const y3 = y2;

      const pct = (Number(data[i]) / total * 100).toFixed(1);
      const label = `${chart.data.labels[i]} (${pct}%)`;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      ctx.textAlign = right ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x3 + (right ? 5 : -5), y3);
    });
    ctx.restore();
  }
};

const DISPLAY_NAME = {
  "Акмолинская": "Акмолинская область",
  "Архангельская": "Архангельская губерния",
  "Астраханская": "Астраханская губерния",
  "Бессарабская": "Бессарабская губерния",
  "Виленская": "Виленская губерния",
  "Витебская": "Витебская губерния",
  "Владимирская": "Владимирская губерния",
  "Вологодская": "Вологодская губерния",
  "Волынская": "Волынская губерния",
  "Воронежская": "Воронежская губерния",
  "Вятская": "Вятская губерния",
  "Гродненская": "Гродненская губерния",
  "Войска_Донского": "Область Войска Донского",
  "Екатеринославская": "Екатеринославская губерния",
  "Казанская": "Казанская губерния",
  "Калужская": "Калужская губерния",
  "Киевская": "Киевская губерния",
  "Ковенская": "Ковенская губерния",
  "Костромская": "Костромская губерния",
  "Курляндская": "Курляндская губерния",
  "Курская": "Курская губерния",
  "Лифляндская": "Лифляндская губерния",
  "Минская": "Минская губерния",
  "Могилёвская": "Могилёвская губерния",
  "Московская": "Московская губерния",
  "Нижегородская": "Нижегородская губерния",
  "Новгородская": "Новгородская губерния",
  "Олонецкая": "Олонецкая губерния",
  "Оренбургская": "Оренбургская губерния",
  "Орловская": "Орловская губерния",
  "Пензенская": "Пензенская губерния",
  "Пермская": "Пермская губерния",
  "Подольская": "Подольская губерния",
  "Полтавская": "Полтавская губерния",
  "Псковская": "Псковская губерния",
  "Рязанская": "Рязанская губерния",
  "Самарская": "Самарская губерния",
  "Санкт-Петербургская": "Санкт-Петербургская губерния",
  "Саратовская": "Саратовская губерния",
  "Симбирская": "Симбирская губерния",
  "Смоленская": "Смоленская губерния",
  "Таврическая": "Таврическая губерния",
  "Тамбовская": "Тамбовская губерния",
  "Тверская": "Тверская губерния",
  "Тульская": "Тульская губерния",
  "Уфимская": "Уфимская губерния",
  "Харьковская": "Харьковская губерния",
  "Херсонская": "Херсонская губерния",
  "Черниговская": "Черниговская губерния",
  "Эстляндская": "Эстляндская губерния",
  "Ярославская": "Ярославская губерния",
  "Варшавская": "Варшавская губерния",
  "Калишская": "Калишская губерния",
  "Келецкая": "Келецкая губерния",
  "Ломжинская": "Ломжинская губерния",
  "Люблинская": "Люблинская губерния",
  "Петроковская": "Петроковская губерния",
  "Плоцкая": "Плоцкая губерния",
  "Радомская": "Радомская губерния",
  "Сувалкская": "Сувалкская губерния",
  "Седлецкая": "Седлецкая губерния",
  "Бакинская": "Бакинская губерния",
  "Дагестанская": "Дагестанская область",
  "Елизаветпольская": "Елизаветпольская губерния",
  "Карсская": "Карсская область",
  "Кубанская": "Кубанская область",
  "Кутаисская": "Кутаисская губерния",
  "Ставропольская": "Ставропольская губерния",
  "Терская": "Терская область",
  "Тифлисская": "Тифлисская губерния",
  "Черноморская": "Черноморская губерния",
  "Эриванская": "Эриванская губерния",
  "Амурская": "Амурская область",
  "Енисейская": "Енисейская губерния",
  "Забайкальская": "Забайкальская область",
  "Иркутская": "Иркутская губерния",
  "Приморская": "Приморская область",
  "Сахалин": "Сахалин",
  "Тобольская": "Тобольская губерния",
  "Томская": "Томская губерния",
  "Якутская": "Якутская область",
  "Закаспийская": "Закаспийская область",
  "Самаркандская": "Самаркандская область",
  "Семипалатинская": "Семипалатинская область",
  "Семиреченская": "Семиреченская область",
  "Сырдарьинская": "Сырдарьинская область",
  "Тургайская": "Тургайская область",
  "Уральская": "Уральская область",
  "Москва": "Москва",
  "Санкт-Петербург": "Санкт-Петербург",
  "Одесса": "Одесса",
  "Варшава": "Варшава",
  "Ферганская": "Ферганская область"
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
  timer: null,
  chart: null,
  chartKind: 'from'
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
    weight: 1.25,
    fillColor: CONFIG.colors.boundaryFill,
    fillOpacity: 0.42
  },
  onEachFeature: (feature, layer) => {
    const raw = feature?.properties?.prov_ENG || feature?.properties?.name || feature?.properties?.NAME;
    if (raw) {
      const key = String(raw).trim();
      const name = DISPLAY_NAME[key] || key;
      layer.bindPopup(`<div class="region-popup">${escapeHtml(name)}</div>`);
      layer.on({
        mouseover: () => layer.setStyle({weight: 1.7}),
        mouseout: () => baseLayer.resetStyle(layer)
      });
    }
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

  document.getElementById('status').textContent = '';

  const tablePanel = document.getElementById('tablePanel');
  if (!tablePanel.classList.contains('hidden')) {
    const kind = document.getElementById('tableTitle').dataset.kind;
    if (kind) showTable(kind);
  }
  if (!document.getElementById('chartsPanel').classList.contains('hidden')) {
    showChart(state.chartKind);
  }

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
  // Запуск анимирует поток только в выбранном году.
  // Год никогда не переключается автоматически.
  state.playing = true;
  renderYear(state.currentYear);
}

function toggleSpeed() {
  state.speedIndex = (state.speedIndex + 1) % 3;
  document.getElementById('speedBtn').textContent =
    `Скорость: ×${[1, 2, 4][state.speedIndex]}`;

  if (state.playing) startAnimation();
  else renderYear(state.currentYear);
}

function getAggregatedRows(kind) {
  const rows = kind === 'from' ? state.fromRows : state.toRows;
  const nameKey = kind === 'from' ? 'Origin' : (rows[0] && ('Destination' in rows[0] ? 'Destination' : 'Destinatoin'));
  const totals = new Map();
  for (const r of rows) {
    const raw = String(r[nameKey] || '').trim();
    const name = DISPLAY_NAME[raw] || raw;
    const value = num(r[`year_${state.currentYear}`]);
    if (!name || value <= 0) continue;
    totals.set(name, (totals.get(name) || 0) + value);
  }
  return [...totals.entries()].map(([name,value]) => ({name,value})).sort((a,b)=>b.value-a.value);
}

function showTable(kind) {
  const title = kind === 'from' ? 'Исход' : 'Водворение';
  const list = getAggregatedRows(kind);
  document.getElementById('tableTitle').textContent = `${title} — ${state.currentYear}`;
  document.getElementById('tableTitle').dataset.kind = kind;
  document.getElementById('tablePanel').classList.remove('hidden');
  document.getElementById('tableContent').innerHTML = `<div class="table-scroll"><table><thead><tr><th>регион</th><th>число переселенцев</th></tr></thead><tbody>${list.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${r.value.toLocaleString('ru-RU')}</td></tr>`).join('')}</tbody></table></div>`;
}

function showChart(kind) {
  const list = getAggregatedRows(kind);
  const top = list.slice(0, 10);
  const rest = list.slice(10).reduce((sum, r) => sum + r.value, 0);
  const labels = top.map(r => r.name);
  const values = top.map(r => r.value);

  if (rest > 0) {
    labels.push('другие');
    values.push(rest);
  }

  const backgroundColor = top.map((_, i) => CHART_COLORS[i]);
  if (rest > 0) backgroundColor.push(OTHER_COLOR);

  const canvas = document.getElementById('migrationChart');
  const ctx = canvas.getContext('2d');
  if (state.chart) state.chart.destroy();

  state.chart = new Chart(ctx, {
    type: 'pie',
    plugins: [pieCalloutPlugin],
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor,
        borderColor: '#ffffff',
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {top: 42, right: 170, bottom: 42, left: 170}
      },
      plugins: {
        legend: {display: false},
        title: {
          display: true,
          text: `${kind === 'from' ? 'Исход' : 'Водворение'} — ${state.currentYear}`
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.raw || 0);
              return `${context.label}: ${value.toLocaleString('ru-RU')} переселенцев`;
            }
          }
        }
      }
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));
}

document.getElementById('closeTable').onclick = () => {
  document.getElementById('tablePanel').classList.add('hidden');
};

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

    document.getElementById('status').textContent = '';
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

document.getElementById('tablesBtn').onclick = () => {
  document.getElementById('tablesPanel').classList.toggle('hidden');
  document.getElementById('chartsPanel').classList.add('hidden');
};
document.getElementById('chartsBtn').onclick = () => {
  document.getElementById('chartsPanel').classList.toggle('hidden');
  document.getElementById('tablesPanel').classList.add('hidden');
  if (!document.getElementById('chartsPanel').classList.contains('hidden')) showChart(state.chartKind);
};
document.getElementById('fromBtn').onclick = () => showTable('from');
document.getElementById('toBtn').onclick = () => showTable('to');
document.getElementById('fromChartBtn').onclick = () => showChart('from');
document.getElementById('toChartBtn').onclick = () => showChart('to');
document.getElementById('closeTable').onclick = () => document.getElementById('tablePanel').classList.add('hidden');

init();

