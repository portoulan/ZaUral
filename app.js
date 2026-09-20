/* Interactive migration map — complete rewrite */

const CONFIG = {
  years: Array.from({ length: 21 }, (_, i) => 1896 + i),
  animationDelay: 900,
  colors: {
    boundary: '#555',
    boundaryFill: '#e7e7e7',
    flow: '#1769aa'
  }
};

const DISPLAY_NAME = {
  'Акмолинская':'Акмолинская область','Архангельская':'Архангельская губерния','Астраханская':'Астраханская губерния','Бессарабская':'Бессарабская губерния','Виленская':'Виленская губерния','Витебская':'Витебская губерния','Владимирская':'Владимирская губерния','Вологодская':'Вологодская губерния','Волынская':'Волынская губерния','Воронежская':'Воронежская губерния','Вятская':'Вятская губерния','Гродненская':'Гродненская губерния','Войска_Донского':'Область Войска Донского','Екатеринославская':'Екатеринославская губерния','Казанская':'Казанская губерния','Калужская':'Калужская губерния','Киевская':'Киевская губерния','Ковенская':'Ковенская губерния','Костромская':'Костромская губерния','Курляндская':'Курляндская губерния','Курская':'Курская губерния','Лифляндская':'Лифляндская губерния','Минская':'Минская губерния','Могилёвская':'Могилёвская губерния','Московская':'Московская губерния','Нижегородская':'Нижегородская губерния','Новгородская':'Новгородская губерния','Олонецкая':'Олонецкая губерния','Оренбургская':'Оренбургская губерния','Орловская':'Орловская губерния','Пензенская':'Пензенская губерния','Пермская':'Пермская губерния','Подольская':'Подольская губерния','Полтавская':'Полтавская губерния','Псковская':'Псковская губерния','Рязанская':'Рязанская губерния','Самарская':'Самарская губерния','Санкт-Петербургская':'Санкт-Петербургская губерния','Саратовская':'Саратовская губерния','Симбирская':'Симбирская губерния','Смоленская':'Смоленская губерния','Таврическая':'Таврическая губерния','Тамбовская':'Тамбовская губерния','Тверская':'Тверская губерния','Тульская':'Тульская губерния','Уфимская':'Уфимская губерния','Харьковская':'Харьковская губерния','Херсонская':'Херсонская губерния','Черниговская':'Черниговская губерния','Эстляндская':'Эстляндская губерния','Ярославская':'Ярославская губерния','Варшавская':'Варшавская губерния','Калишская':'Калишская губерния','Келецкая':'Келецкая губерния','Ломжинская':'Ломжинская губерния','Люблинская':'Люблинская губерния','Петроковская':'Петроковская губерния','Плоцкая':'Плоцкая губерния','Радомская':'Радомская губерния','Сувалкская':'Сувалкская губерния','Седлецкая':'Седлецкая губерния','Бакинская':'Бакинская губерния','Дагестанская':'Дагестанская область','Елизаветпольская':'Елизаветпольская губерния','Карсская':'Карсская область','Кубанская':'Кубанская область','Кутаисская':'Кутаисская губерния','Ставропольская':'Ставропольская губерния','Терская':'Терская область','Тифлисская':'Тифлисская губерния','Черноморская':'Черноморская губерния','Эриванская':'Эриванская губерния','Амурская':'Амурская область','Енисейская':'Енисейская губерния','Забайкальская':'Забайкальская область','Иркутская':'Иркутская губерния','Приморская':'Приморская область','Сахалин':'Сахалин','Тобольская':'Тобольская губерния','Томская':'Томская губерния','Якутская':'Якутская область','Закаспийская':'Закаспийская область','Самаркандская':'Самаркандская область','Семипалатинская':'Семипалатинская область','Семиреченская':'Семиреченская область','Сырдарьинская':'Сырдарьинская область','Тургайская':'Тургайская область','Уральская':'Уральская область','Москва':'Москва','Санкт-Петербург':'Санкт-Петербург','Одесса':'Одесса','Варшава':'Варшава','Ферганская':'Ферганская область'
};

const ANIM_DELAYS = [900, 450, 225];

const CHART_COLORS = ['#1f77b4','#d62728','#2ca02c','#9467bd','#ff7f0e','#17becf','#e377c2','#8c564b','#bcbd22','#3366cc'];
const OTHER_COLOR = '#808080';

const state = {
  currentYear: CONFIG.years[0],
  speed: 1,
  speedIndex: 0,
  running: false,
  timer: null,
  nodes: new Map(),
  edges: [],
  outgoing: new Map(),
  incoming: new Map(),
  fromRows: [],
  toRows: [],
  fromByNode: new Map(),
  toByNode: new Map(),
  regionByNode: new Map(),
  flowLayer: null,
  chart: null
};

const map = L.map('map', { preferCanvas: true }).setView([55, 50], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const baseLayer = L.geoJSON(null, {
  style: () => ({
    color: CONFIG.colors.boundary,
    weight: 1.35,
    fillColor: CONFIG.colors.boundaryFill,
    fillOpacity: 0.42
  }),
  onEachFeature: (feature, layer) => {
    const raw = feature?.properties?.prov_ENG || feature?.properties?.name || feature?.properties?.NAME;
    if (!raw) return;
    const name = DISPLAY_NAME[String(raw).trim()] || String(raw).trim();
    layer.bindPopup(`<div class="region-popup">${escapeHtml(name)}</div>`);
    layer.on({
      mouseover: () => layer.setStyle({ weight: 1.8 }),
      mouseout: () => baseLayer.resetStyle(layer)
    });
  }
}).addTo(map);

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function num(value) {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function parseCSV(text) {
  const clean = String(text || '').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = clean.split('\n').filter(line => line.trim());
  if (!lines.length) return [];
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(v => v.trim());
  return lines.slice(1).map(line => {
    const cells = line.split(delimiter);
    const row = {};
    headers.forEach((h, i) => row[h] = (cells[i] ?? '').trim());
    return row;
  });
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

function addRegionNode(region, node) {
  if (!region || !node || region === 'ВСЕГО') return;
  if (!state.regionByNode.has(node)) state.regionByNode.set(node, new Set());
  state.regionByNode.get(node).add(region);
}

function buildGraph(text) {
  state.edges = [];
  state.outgoing.clear();
  state.incoming.clear();

  for (const row of parseCSV(text)) {
    const ids = Object.values(row).map(v => String(v || '').trim()).filter(Boolean);
    if (ids.length < 2) continue;
    const from = ids[0];
    for (const to of ids.slice(1)) {
      if (!to || !state.nodes.has(from) || !state.nodes.has(to)) continue;
      state.edges.push([from, to]);
      if (!state.outgoing.has(from)) state.outgoing.set(from, []);
      if (!state.incoming.has(to)) state.incoming.set(to, []);
      state.outgoing.get(from).push(to);
      state.incoming.get(to).push(from);
    }
  }
}

function indexData() {
  state.fromByNode.clear();
  state.toByNode.clear();
  state.regionByNode.clear();

  for (const row of state.fromRows) {
    const node = String(row.EDGE || '').trim();
    const region = String(row.Origin || '').trim();
    if (!node) continue;
    if (!state.fromByNode.has(node)) state.fromByNode.set(node, []);
    state.fromByNode.get(node).push(row);
    addRegionNode(region, node);
  }

  for (const row of state.toRows) {
    const node = String(row.EDGE || '').trim();
    const key = Object.prototype.hasOwnProperty.call(row, 'Destination') ? 'Destination' : 'Destinatoin';
    const region = String(row[key] || '').trim();
    if (!node) continue;
    if (!state.toByNode.has(node)) state.toByNode.set(node, []);
    state.toByNode.get(node).push(row);
    addRegionNode(region, node);
  }
}

function ownSourceValue(node, year) {
  return (state.fromByNode.get(node) || []).reduce((sum, row) => sum + num(row[`year_${year}`]), 0);
}

function calculateNodeFlows(year) {
  const own = new Map();
  const flow = new Map();
  const visiting = new Set();

  for (const node of state.nodes.keys()) own.set(node, ownSourceValue(node, year));

  function calc(node) {
    if (flow.has(node)) return flow.get(node);
    if (visiting.has(node)) return own.get(node) || 0;
    visiting.add(node);
    let total = own.get(node) || 0;
    for (const parent of (state.incoming.get(node) || [])) total += calc(parent);
    visiting.delete(node);
    flow.set(node, total);
    return total;
  }

  for (const node of state.nodes.keys()) calc(node);
  return flow;
}

function namesForSegment(a, b) {
  const names = new Set();
  for (const node of [a, b]) {
    for (const raw of (state.regionByNode.get(node) || [])) {
      if (raw !== 'ВСЕГО') names.add(DISPLAY_NAME[raw] || raw);
    }
  }
  return [...names];
}

function coords(id) {
  const n = state.nodes.get(id);
  return n ? [n.lat, n.lon] : null;
}

function weightFor(value, max) {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(0.8, 0.8 + Math.pow(value / max, 0.55) * 8);
}

function renderYear(year) {
  state.currentYear = Number(year);

  const yearLabel = document.getElementById('yearLabel');
  if (yearLabel) yearLabel.textContent = year;

  document.querySelectorAll('#yearButtons button').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.year) === Number(year));
  });

  if (state.flowLayer) state.flowLayer.clearLayers();
  else state.flowLayer = L.layerGroup().addTo(map);

  // This is the v5 flow calculation: every calculated edge flow is rendered
  // as an Ant Path, including branches and merged nodes.
  const flow = calculateNodeFlows(year);
  const values = [...flow.values()].filter(v => v > 0);
  const max = Math.max(...values, 1);
  state.maxFlow = max;

  for (const [a, b] of state.edges) {
    const value = flow.get(a) || 0;
    if (value <= 0) continue;

    const A = state.nodes.get(a);
    const B = state.nodes.get(b);
    if (!A || !B) continue;

    let path;
    const options = {
      delay: ANIM_DELAYS[state.speedIndex] ?? ANIM_DELAYS[0],
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
    };

    if (typeof L.polyline.antPath === 'function') {
      path = L.polyline.antPath(
        [[A.lat, A.lon], [B.lat, B.lon]],
        options
      );
    } else {
      path = L.polyline([[A.lat, A.lon], [B.lat, B.lon]], options);
    }

    const names = namesForSegment(a, b);
    if (names.length) {
      path.bindPopup(
        `<div class="region-popup">${names.map(escapeHtml).join('<br>')}</div>`,
        { closeButton: true }
      );
    }

    path.on('mouseover', () => path.setStyle({ opacity: 1 }));
    path.on('mouseout', () => path.setStyle({ opacity: 0.86 }));
    path.addTo(state.flowLayer);
  }

  const status = document.getElementById('status');
  if (status) status.textContent = '';

  const tablePanel = document.getElementById('tablePanel');
  if (tablePanel && !tablePanel.classList.contains('hidden')) {
    const kind = document.getElementById('tableTitle')?.dataset.kind;
    if (kind) showTable(kind);
  }

  const chartsPanel = document.getElementById('chartsPanel');
  if (chartsPanel && !chartsPanel.classList.contains('hidden')) {
    const kind = window.currentChartKind || 'from';
    applyRegionTheme(kind);
    showChart(kind);
  }
}


function updateYearUI() {
  const label = document.getElementById('yearLabel');
  if (label) label.textContent = state.currentYear;
  const status = document.getElementById('status');
  if (status) status.textContent = `Год: ${state.currentYear}`;
  document.querySelectorAll('#yearButtons button').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.year) === state.currentYear));
}

function buildYearButtons() {
  const box = document.getElementById('yearButtons');
  if (!box) return;
  box.innerHTML = '';
  CONFIG.years.forEach(year => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = year;
    btn.dataset.year = year;
    btn.addEventListener('click', () => { pauseAnimation(); renderYear(year); });
    box.appendChild(btn);
  });
}

function setAntPathPaused(paused) {
  if (!state.flowLayer) return;
  state.flowLayer.eachLayer(layer => {
    if (layer.pause && layer.resume) {
      if (paused) layer.pause(); else layer.resume();
    }
  });
}

function startAnimation() {
  state.running = true;
  if (state.flowLayer) {
    state.flowLayer.eachLayer(layer => {
      if (layer.resume) layer.resume();
    });
  }
}


function pauseAnimation() {
  state.running = false;
  if (state.flowLayer) {
    state.flowLayer.eachLayer(layer => {
      if (layer.pause) layer.pause();
    });
  }
}


function toggleSpeed() {
  state.speedIndex = (state.speedIndex + 1) % 3;
  const btn = document.getElementById('speedBtn');
  if (btn) btn.textContent = `Скорость: ×${[1, 2, 4][state.speedIndex]}`;

  if (state.running) startAnimation();
  else renderYear(state.currentYear);
}


function aggregateTable(kind) {
  const rows = kind === 'from' ? state.fromRows : state.toRows;
  const nameKey = kind === 'from' ? 'Origin' : (rows[0] && Object.hasOwn(rows[0], 'Destination') ? 'Destination' : 'Destinatoin');
  const totals = new Map();
  let grandTotal = null;

  for (const row of rows) {
    const raw = String(row[nameKey] || '').trim();
    const value = num(row[`year_${state.currentYear}`]);
    if (raw === 'ВСЕГО') { grandTotal = value; continue; }
    if (!raw || value <= 0) continue;
    const name = DISPLAY_NAME[raw] || raw;
    totals.set(name, (totals.get(name) || 0) + value);
  }

  return {
    list: [...totals.entries()].map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value),
    grandTotal
  };
}

function showTable(kind) {
  const result = aggregateTable(kind);
  const title = kind === 'from' ? 'Исход' : 'Водворение';
  const panel = document.getElementById('tablePanel');
  const titleEl = document.getElementById('tableTitle');
  if (!panel || !titleEl) return;

  titleEl.textContent = `${title} — ${state.currentYear}`;
  titleEl.dataset.kind = kind;
  panel.classList.remove('hidden');

  document.getElementById('tableContent').innerHTML = `
    <div class="table-scroll"><table>
      <thead><tr><th>регион</th><th>число переселенцев</th></tr></thead>
      <tbody>
        ${result.list.map(r => `<tr><td>${escapeHtml(r.name)}</td><td>${r.value.toLocaleString('ru-RU')}</td></tr>`).join('')}
        ${result.grandTotal !== null ? `<tr class="total-row"><td>ВСЕГО</td><td>${result.grandTotal.toLocaleString('ru-RU')}</td></tr>` : ''}
      </tbody>
    </table></div>`;
}

function clearRegionTheme() {
  baseLayer.eachLayer(layer => baseLayer.resetStyle(layer));
}

function applyRegionTheme(kind) {
  const rows = kind === 'from' ? state.fromRows : state.toRows;
  const nameKey = kind === 'from'
    ? 'Origin'
    : (rows[0] && Object.prototype.hasOwnProperty.call(rows[0], 'Destination')
        ? 'Destination' : 'Destinatoin');

  const values = new Map();

  for (const row of rows) {
    const raw = String(row[nameKey] || '').trim();
    if (!raw || raw === 'ВСЕГО') continue;
    const value = num(row[`year_${state.currentYear}`]);
    if (value > 0) values.set(raw, (values.get(raw) || 0) + value);
  }

  let max = 0;
  for (const value of values.values()) max = Math.max(max, value);

  baseLayer.eachLayer(layer => {
    const raw = String(
      layer.feature?.properties?.prov_ENG ||
      layer.feature?.properties?.name ||
      layer.feature?.properties?.NAME || ''
    ).trim();

    const value = values.get(raw) || 0;

    if (!value || !max) {
      layer.setStyle({
        color: CONFIG.colors.boundary,
        weight: 1.35,
        fillColor: '#eeeeee',
        fillOpacity: 0.10
      });
      return;
    }

    const t = Math.pow(value / max, 0.45);
    const fillColor = kind === 'from'
      ? `rgb(255, ${Math.round(245 - 150*t)}, ${Math.round(245 - 150*t)})`
      : `rgb(${Math.round(245 - 150*t)}, 255, ${Math.round(245 - 150*t)})`;

    layer.setStyle({
      color: CONFIG.colors.boundary,
      weight: 1.5,
      fillColor,
      fillOpacity: 0.18 + 0.30*t
    });
  });
}

function showChart(kind) {
  if (typeof Chart === 'undefined') return;
  const result = aggregateTable(kind);
  const top = result.list.slice(0, 10);
  const rest = result.list.slice(10).reduce((s,r) => s + r.value, 0);
  const labels = top.map(r => r.name);
  const values = top.map(r => r.value);
  if (rest > 0) { labels.push('другие'); values.push(rest); }
  const colors = top.map((_,i) => CHART_COLORS[i]);
  if (rest > 0) colors.push(OTHER_COLOR);
  const total = result.grandTotal ?? values.reduce((s,v) => s+v, 0);
  const legend = labels.map((label,i) => `${total ? (values[i]/total*100).toFixed(1) : '0.0'}% - ${label}`);

  const canvas = document.getElementById('migrationChart');
  if (!canvas) return;
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 1.5 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 8,
            generateLabels: chart => chart.data.labels.map((label,i) => ({
              text: legend[i],
              fillStyle: chart.data.datasets[0].backgroundColor[i],
              strokeStyle: '#fff', lineWidth: 1, hidden: false, index: i
            }))
          }
        },
        title: { display: true, text: `${kind === 'from' ? 'Исход' : 'Водворение'} — ${state.currentYear}` },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${Number(ctx.raw || 0).toLocaleString('ru-RU')} переселенцев` } }
      }
    }
  });
}

function refreshPanels() {
  const tablePanel = document.getElementById('tablePanel');
  if (tablePanel && !tablePanel.classList.contains('hidden')) {
    const kind = document.getElementById('tableTitle')?.dataset.kind;
    if (kind) showTable(kind);
  }
  const chartsPanel = document.getElementById('chartsPanel');
  if (chartsPanel && !chartsPanel.classList.contains('hidden')) showChart(window.currentChartKind || 'from');
}

function wireControls() {
  document.getElementById('playBtn')?.addEventListener('click', startAnimation);
  document.getElementById('pauseBtn')?.addEventListener('click', pauseAnimation);
  document.getElementById('speedBtn')?.addEventListener('click', toggleSpeed);

  document.getElementById('tablesBtn')?.addEventListener('click', () => {
    document.getElementById('tablesPanel')?.classList.toggle('hidden');
    document.getElementById('chartsPanel')?.classList.add('hidden');
    clearRegionTheme();
  });
  document.getElementById('chartsBtn')?.addEventListener('click', () => {
    const p = document.getElementById('chartsPanel');
    p?.classList.toggle('hidden');
    document.getElementById('tablesPanel')?.classList.add('hidden');
    if (p && !p.classList.contains('hidden')) { const kind = window.currentChartKind || 'from'; applyRegionTheme(kind); showChart(kind); }
  });
  document.getElementById('fromBtn')?.addEventListener('click', () => showTable('from'));
  document.getElementById('toBtn')?.addEventListener('click', () => showTable('to'));
  document.getElementById('fromChartBtn')?.addEventListener('click', () => { window.currentChartKind='from'; applyRegionTheme('from'); showChart('from'); });
  document.getElementById('toChartBtn')?.addEventListener('click', () => { window.currentChartKind='to'; applyRegionTheme('to'); showChart('to'); });
  document.getElementById('closeTable')?.addEventListener('click', () => document.getElementById('tablePanel')?.classList.add('hidden'));
}

async function init() {
  try {
    wireControls();
    const [geo, nodesText, edgesText, fromText, toText] = await Promise.all([
      loadJSON('data.geojson'), loadText('NODES.csv'), loadText('EDGES.csv'), loadText('migration_from.csv'), loadText('migration_to.csv')
    ]);
    baseLayer.addData(geo);
    for (const row of parseCSV(nodesText)) {
      const id = String(row.id || '').trim();
      const lon = num(row.lon), lat = num(row.lat);
      if (id && Number.isFinite(lon) && Number.isFinite(lat)) state.nodes.set(id, {lon,lat});
    }
    // EDGES is parsed after nodes so only valid coordinate nodes become map edges.
    buildGraph(edgesText);
    state.fromRows = parseCSV(fromText);
    state.toRows = parseCSV(toText);
    indexData();
    buildYearButtons();
    renderYear(state.currentYear);
    const bounds = baseLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.04));
  } catch (error) {
    console.error(error);
    const status = document.getElementById('status');
    if (status) status.innerHTML = `<strong>Ошибка загрузки.</strong> Проверьте, что все файлы лежат рядом с index.html.<br>${escapeHtml(error.message)}`;
  }
}

init();
