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
  flowsVisible: true,
  speedIndex: 0,
  timer: null,
  chart: null,
  chartKind: 'from',
  mapKind: null
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

function namesForSegment(a, b) {
  const names = new Set();

  for (const node of [a, b]) {
    const set = state.regionByNode.get(node);
    if (!set) continue;
    for (const raw of set) {
      const key = String(raw).trim();
      if (key && key !== 'ВСЕГО') {
        names.add(DISPLAY_NAME[key] || key);
      }
    }
  }

  return [...names];
}

function weightFor(value,max) {
  if(!value||value<=0)return 1.5;
  const minWeight=1.5;
  const oldMaxWeight=10;
  const maxWeight=oldMaxWeight*1.5;
  const ratio=max>0?Math.max(0,Math.min(1,value/max)):0;
  const t=Math.log1p(ratio*99)/Math.log1p(99);
  return minWeight+(maxWeight-minWeight)*t;
}

function renderYear(year) {
  state.currentYear = Number(year);
  document.getElementById('yearLabel').textContent = year;

  updateYearInfo();
  updateYearArrowButtons();

  document.querySelectorAll('.years button').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.year) === state.currentYear);
  });

  flowLayer.clearLayers();

  const { flow } = calculateFlows(state.currentYear);
  const values = [...flow.values()].filter(v => v > 0);
  const max = Math.max(...values, 1);

  // Every calculated edge is rendered. The network is not reconstructed
  // from neighbouring nodes during drawing, so branches and merges remain intact.
  for (const [key, value] of flow) {
    if (value <= 0) continue;

    const split = key.indexOf('>');
    const a = key.slice(0, split);
    const b = key.slice(split + 1);
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

  state.flowsVisible=true;
  if(!map.hasLayer(flowLayer))flowLayer.addTo(map);

  document.getElementById('status').textContent = '';

  const tablePanel = document.getElementById('tablePanel');
  if (tablePanel && !tablePanel.classList.contains('hidden')) {
    const kind = document.getElementById('tableTitle').dataset.kind;
    if (kind) showTable(kind);
  }

  const chartsPanel = document.getElementById('chartsPanel');
  if (chartsPanel && !chartsPanel.classList.contains('hidden')) {
    showChart(state.chartKind);
  updateChartTotal();
  }

  if (state.mapKind) {
    applyMapTheme(state.mapKind);
  }
}


function buildYearButtons() {
  const box=document.getElementById('yearButtons');
  box.innerHTML='';
  CONFIG.years.forEach(year=>{
    const btn=document.createElement('button');
    btn.textContent=year; btn.dataset.year=year;
    btn.onclick=()=>{
      const wasPlaying=state.playing;
      pauseAnimation();
      renderYear(year);
      if(wasPlaying)startAnimation();
    };
    box.appendChild(btn);
  });
  updateYearArrowButtons();
}


function pauseAnimation() {
  state.playing=false;
  if(state.timer)clearInterval(state.timer);
  state.timer=null;
  flowLayer.eachLayer(layer=>{if(layer.pause)layer.pause();});
  updateAnimationButton();
}


function startAnimation() {
  state.flowsVisible=true;
  if(!map.hasLayer(flowLayer)) flowLayer.addTo(map);
  state.playing=true;
  flowLayer.eachLayer(layer=>{if(layer.resume)layer.resume();});
  updateAnimationButton();
}


function toggleSpeed() {
  state.speedIndex = (state.speedIndex + 1) % 3;
  document.getElementById('speedBtn').textContent =
    `Скорость: ×${[1, 2, 4][state.speedIndex]}`;

  // Rebuild only the selected year's flow paths with the new Ant Path delay.
  const wasPlaying = state.playing;
  renderYear(state.currentYear);
  if (wasPlaying) startAnimation();
}




const YEAR_TOTALS={1896:190302,1897:84733,1898:200080,1899:221034,1900:218552,1901:119557,1902:110396,1903:125444,1904:46719,1905:44029,1906:216646,1907:576211,1908:758770,1909:707077,1910:352950,1911:226062,1912:259585,1913:327430,1914:336409,1915:28185,1916:11201};
function yearTotalText(){return `${state.currentYear} год - ${YEAR_TOTALS[state.currentYear]??0} переселенцев`;}
function updateYearInfo(){document.querySelectorAll('.year-info,.chart-total').forEach(e=>e.textContent=yearTotalText());}
function updateYearArrowButtons(){
 const ys=CONFIG.years, i=ys.indexOf(Number(state.currentYear));
 const p=document.getElementById('prevYearBtn'),n=document.getElementById('nextYearBtn');
 if(p)p.disabled=i<=0;if(n)n.disabled=i<0||i>=ys.length-1;
}
function changeYear(delta) {
  const ys=CONFIG.years, i=ys.indexOf(Number(state.currentYear));
  if(i<0)return;
  const ni=Math.max(0,Math.min(ys.length-1,i+delta));
  if(ni===i)return;
  const wasPlaying=state.playing;
  pauseAnimation();
  renderYear(ys[ni]);
  if(wasPlaying)startAnimation();
}
function updateAnimationButton() {
  const btn=document.getElementById('animationBtn');
  if(!btn)return;
  btn.textContent=state.playing?'Анимация: включена':'Анимация';
  btn.classList.toggle('primary',state.playing);
}

function updateFlowsButton() {
  const btn = document.getElementById('flowsBtn');
  if (!btn) return;
  btn.textContent = state.flowsVisible
    ? 'Потоки: включены'
    : 'Потоки: выключены';
  btn.classList.toggle('primary', state.flowsVisible);
}

function setFlowsVisible(visible) {
  state.flowsVisible=Boolean(visible);
  if(state.flowsVisible){if(!map.hasLayer(flowLayer))flowLayer.addTo(map);}
  else{if(map.hasLayer(flowLayer))map.removeLayer(flowLayer);}
  updateAnimationButton();
}

function setAnimationVisible(enabled) {
  if (enabled) {
    startAnimation();
  } else {
    pauseAnimation();
  }
}

function regionRawName(feature) {
  return String(
    feature?.properties?.prov_ENG ||
    feature?.properties?.name ||
    feature?.properties?.NAME || ''
  ).trim();
}

function buildRegionValues(kind) {
  const rows = kind === 'from' ? state.fromRows : state.toRows;
  const key = kind === 'from'
    ? 'Origin'
    : (rows[0] && ('Destination' in rows[0] ? 'Destination' : 'Destinatoin'));

  const values = new Map();

  for (const row of rows) {
    const raw = String(row[key] || '').trim();
    if (!raw || raw === 'ВСЕГО') continue;

    const value = num(row[`year_${state.currentYear}`]);
    if (value > 0) {
      values.set(raw, (values.get(raw) || 0) + value);
    }
  }

  return values;
}

function colorScale(kind, t) {
  // Very transparent thematic fill: the basemap remains visible.
  const strength = Math.max(0, Math.min(1, t));
  if (kind === 'from') {
    return `rgb(255, ${Math.round(248 - 145 * strength)}, ${Math.round(248 - 145 * strength)})`;
  }
  return `rgb(${Math.round(248 - 145 * strength)}, 255, ${Math.round(248 - 145 * strength)})`;
}

function applyMapTheme(kind) {
  state.mapKind = kind;

  const values = buildRegionValues(kind);
  let max = 0;
  values.forEach(v => { if (v > max) max = v; });

  baseLayer.eachLayer(layer => {
    const raw = regionRawName(layer.feature);
    const value = values.get(raw) || 0;

    if (!value || max <= 0) {
      layer.setStyle({
        color: CONFIG.colors.boundary,
        weight: 1.5,
        fillColor: '#eef1f4',
        fillOpacity: 0.08
      });
      return;
    }

    const t = Math.pow(value / max, 0.45);
    layer.setStyle({
      color: CONFIG.colors.boundary,
      weight: 1.6,
      fillColor: colorScale(kind, t),
      fillOpacity: 0.25
    });
  });

  renderMapLegend(kind, max);
}

function renderMapLegend(kind,max){
 const box=document.getElementById('mapLegend');if(!box)return;
 const title=kind==='from'?'Число переселенцев — исход':'Число переселенцев — водворение';
 if(!max||max<=0){box.innerHTML=`<div class="map-legend-title">${title}</div><div>Нет ненулевых значений для выбранного года.</div><div class="year-info">${yearTotalText()}</div>`;return;}
 const bands=[[0,.2],[.2,.4],[.4,.6],[.6,.8],[.8,1]];
 const rows=bands.map(([lo,hi],i)=>{
   const low=i===0?0:Math.floor(max*lo)+1, high=i===4?Math.round(max):Math.floor(max*hi);
   return `<div class="map-legend-row"><span class="map-legend-swatch" style="background:${colorScale(kind,(lo+hi)/2)}"></span><span>${low.toLocaleString('ru-RU')}–${high.toLocaleString('ru-RU')}</span></div>`;
 }).join('');
 box.innerHTML=`<div class="map-legend-title">${title}</div>${rows}<div class="year-info">${yearTotalText()}</div>`;
}


function clearMapTheme() {
  state.mapKind = null;
  baseLayer.eachLayer(layer => baseLayer.resetStyle(layer));
  const box = document.getElementById('mapLegend');
  if (box) box.innerHTML = '';
}

function showOnlyPanel(panelId) {
  ['tablesPanel', 'chartsPanel', 'mapsPanel'].forEach(id => {
    const panel = document.getElementById(id);
    if (panel) panel.classList.toggle('hidden', id !== panelId);
  });
}


function updateChartTotal(){
 const wrap=document.querySelector('.chart-wrap');if(!wrap)return;
 let el=wrap.querySelector('.chart-total');
 if(!el){el=document.createElement('div');el.className='chart-total';wrap.appendChild(el);}
 el.textContent=yearTotalText();
}
function getAggregatedRows(kind) {
  const rows = kind === 'from' ? state.fromRows : state.toRows;
  const nameKey = kind === 'from'
    ? 'Origin'
    : (rows[0] && ('Destination' in rows[0] ? 'Destination' : 'Destinatoin'));

  const totals = new Map();
  let sourceGrandTotal = null;

  for (const r of rows) {
    const rawName = String(r[nameKey] || '').trim();
    const value = num(r[`year_${state.currentYear}`]);

    if (rawName === 'ВСЕГО') {
      if (Number.isFinite(value)) sourceGrandTotal = value;
      continue;
    }

    const displayName = DISPLAY_NAME[rawName] || rawName;
    if (!displayName || value <= 0) continue;
    totals.set(displayName, (totals.get(displayName) || 0) + value);
  }

  return {
    rows: [...totals.entries()]
      .map(([name, value]) => ({name, value}))
      .sort((a,b) => b.value - a.value),
    sourceGrandTotal
  };
}

function showTable(kind) {
  const title = kind === 'from' ? 'Исход' : 'Водворение';
  const result = getAggregatedRows(kind);
  const list = result.rows;

  document.getElementById('tableTitle').textContent =
    `${title} — ${state.currentYear}`;
  document.getElementById('tableTitle').dataset.kind = kind;
  document.getElementById('tablePanel').classList.remove('hidden');

  const totalRow = result.sourceGrandTotal !== null
    ? `<tr class="total-row"><td>ВСЕГО</td><td>${result.sourceGrandTotal.toLocaleString('ru-RU')}</td></tr>`
    : '';

  document.getElementById('tableContent').innerHTML = `
    <div class="table-scroll">
      <table>
        <thead><tr><th>регион</th><th>число переселенцев</th></tr></thead>
        <tbody>
          ${list.map(r => `
            <tr><td>${escapeHtml(r.name)}</td><td>${r.value.toLocaleString('ru-RU')}</td></tr>
          `).join('')}
          ${totalRow}
        </tbody>
      </table>
    </div>`;
}

function showChart(kind) {
  const result = getAggregatedRows(kind);
  const list = result.rows;
  const total = result.sourceGrandTotal !== null
    ? result.sourceGrandTotal
    : list.reduce((sum, r) => sum + r.value, 0);

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

  const legendLabels = labels.map((label, i) => {
    const pct = total > 0 ? (Number(values[i]) / total * 100).toFixed(1) : '0.0';
    return `${pct}% - ${label}`;
  });

  const canvas = document.getElementById('migrationChart');
  const ctx = canvas.getContext('2d');
  if (state.chart) state.chart.destroy();

  state.chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{data: values, backgroundColor, borderColor: '#ffffff', borderWidth: 1.5}]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            generateLabels: chart => chart.data.labels.map((label, i) => ({
              text: legendLabels[i],
              fillStyle: chart.data.datasets[0].backgroundColor[i],
              strokeStyle: '#ffffff',
              lineWidth: 1,
              hidden: false,
              index: i
            }))
          }
        },
        title: {
          display: true,
          text: `${kind === 'from' ? 'Исход' : 'Водворение'} — ${state.currentYear}`
        },
        tooltip: {
          callbacks: {
            label: context => {
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
    state.currentYear = CONFIG.years[0];
    state.flowsVisible = true;
    state.playing = false;
updateAnimationButton();
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


const panel = document.querySelector('.panel');

document.getElementById('panelToggle').onclick = () => {
  panel.classList.toggle('collapsed');
  document.getElementById('panelToggle').textContent =
    panel.classList.contains('collapsed') ? '☰' : '×';
};

document.getElementById('animationBtn').onclick=()=>{
  if(state.playing) pauseAnimation();
  else { renderYear(state.currentYear); startAnimation(); }
};

document.getElementById('tablesBtn').onclick = () => {
  showOnlyPanel('tablesPanel');
  clearMapTheme();
  const panelEl = document.getElementById('tablePanel');
  if (panelEl) panelEl.classList.add('hidden');
};

document.getElementById('chartsBtn').onclick = () => {
  showOnlyPanel('chartsPanel');
  clearMapTheme();
  showChart(state.chartKind);
  updateChartTotal();
};

document.getElementById('mapsBtn').onclick = () => {
  showOnlyPanel('mapsPanel');
  if (state.mapKind) applyMapTheme(state.mapKind);
  else applyMapTheme('from');
};

document.getElementById('fromBtn').onclick = () => showTable('from');
document.getElementById('toBtn').onclick = () => showTable('to');

document.getElementById('fromChartBtn').onclick = () => {
  state.chartKind = 'from';
  showChart('from');
  updateChartTotal();
};
document.getElementById('toChartBtn').onclick = () => {
  state.chartKind = 'to';
  showChart('to');
  updateChartTotal();
};

document.getElementById('fromMapBtn').onclick = () => applyMapTheme('from');
document.getElementById('toMapBtn').onclick = () => applyMapTheme('to');

document.getElementById('closeTable').onclick = () => {
  document.getElementById('tablePanel').classList.add('hidden');
};

document.getElementById('prevYearBtn').onclick=()=>changeYear(-1);
document.getElementById('nextYearBtn').onclick=()=>changeYear(1);

init();
