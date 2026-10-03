/* Interactive migration map — GitHub Pages */
const CONFIG = {
  years: Array.from({length: 21}, (_, i) => 1896 + i),
  colors: {
    flow: '#0a1f44',
    boundary: '#7d8790',
    boundaryFill: '#e9edf0'
  },
  flowArrowOpacity: 0.6,
  // Скорость бега штрихов по маршруту, px/сек экрана — по индексу скорости
  // (кнопка «Скорость»). Чем больше — тем быстрее.
  arrowSpeed: [35, 75, 160],
  // Целевое расстояние между соседними штрихами на маршруте, px.
  arrowSpacing: 50,
  arrowMinCount: 1,
  arrowMaxCount: 20,
  // Минимальная длительность одного прохода штриха, сек — короткие
  // маршруты (мало узлов/мало px) не должны «мелькать» быстрее этого.
  arrowMinDuration: 1.1,
  // Отдельный маршрут-«декорация»: кораблики, идущие по фиксированной
  // линии узлов (не зависит от величины потока/года).
  shipSpeed: [50, 100, 200],
  shipCount: 5
};


const CHART_COLORS = [
  '#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e',
  '#17becf', '#e377c2', '#8c564b', '#bcbd22', '#3366cc',
  '#17a673', '#b35900'
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

const map = L.map('map', { zoomControl: true, fadeAnimation: false }).setView([55, 55], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 10,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const flowLayer = L.layerGroup().addTo(map);

// Анимация потока — маленькие штрихи-«пятиугольники» (левая часть
// прямоугольная, правая — треугольная, остриём по направлению движения),
// бегущие вдоль маршрута через CSS Motion Path (offset-path +
// offset-distance). stroke-dasharray физически не умеет рисовать фигурный
// штрих (только прямоугольные отрезки), поэтому форма задаётся отдельными
// SVG-фигурами, которые двигает offset-path; offset-rotate:auto сам
// поворачивает их по касательной маршрута на каждом изгибе. Это по-прежнему
// чистый CSS — JS не расходуется на кадр, только на пересчёт offset-path
// после зума/панорамы (см. layoutFlowArrows).
(function injectFlowArrowStyles() {
  if (document.getElementById('flow-arrow-styles')) return;
  const style = document.createElement('style');
  style.id = 'flow-arrow-styles';
  style.textContent = `
    .flow-arrow {
      animation-name: flowArrowMove;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      offset-rotate: auto;
      offset-anchor: 9px 5px;
      pointer-events: none;
    }
    @keyframes flowArrowMove {
      from { offset-distance: 0%; }
      to   { offset-distance: 100%; }
    }
  `;
  document.head.appendChild(style);
})();

const SVG_NS = 'http://www.w3.org/2000/svg';

// Вытянутый пятиугольник: левая часть — прямоугольная (ровный срез),
// правая — треугольная (остриё). offset-rotate:auto довернёт фигуру по
// направлению движения, поэтому форма задана «остриём вправо». Размер
// масштабируется под величину потока (см. arrowScaleFor) — базовые
// пропорции 18×10, центр (и офсет-якорь) всегда на половине ширины/высоты.
function arrowPolygonPoints(scale) {
  const rectX = 10 * scale;
  const tipX = 18 * scale;
  const h = 10 * scale;
  return `0,0 ${rectX},0 ${tipX},${h / 2} ${rectX},${h} 0,${h}`;
}

// Активные штрихи текущего года: {latlngs, elements[]} — нужно, чтобы
// пересчитать offset-path при зуме/панораме и убрать их при паузе или
// перерисовке (это «сырые» SVG-элементы рядом с линиями, не объекты
// Leaflet, поэтому flowLayer.clearLayers() их не затрагивает).
let activeFlowArrows = [];

function clearFlowArrows() {
  for (const entry of activeFlowArrows) {
    for (const el of entry.elements) el.remove();
  }
  activeFlowArrows = [];
}

function routePixelPath(latlngs) {
  const points = latlngs.map(ll => map.latLngToLayerPoint(ll));
  let d = `M${points[0].x},${points[0].y}`;
  let length = 0;

  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x},${points[i].y}`;
    length += points[i - 1].distanceTo(points[i]);
  }

  return {d, length};
}

// Создаёт штрихи для одного маршрута и вешает на них CSS-анимацию
// движения вдоль offset-path. Количество и длительность подобраны так,
// чтобы расстояние между штрихами и их скорость (px/сек экрана) были
// примерно одинаковыми у всех маршрутов, независимо от длины. Размер
// штрихов (scale) — свой у каждого маршрута, по величине его потока.
function addFlowArrows(latlngs, container, scale) {
  const {d, length} = routePixelPath(latlngs);
  if (length <= 0) return;

  const count = Math.max(
    CONFIG.arrowMinCount,
    Math.min(CONFIG.arrowMaxCount, Math.round(length / CONFIG.arrowSpacing))
  );
  // Минимальная длительность — чтобы короткие маршруты (мало узлов) не
  // пробегались почти мгновенно на общей для всех px/сек-скорости.
  const duration = Math.max(
    CONFIG.arrowMinDuration,
    length / CONFIG.arrowSpeed[state.speedIndex]
  );
  const points = arrowPolygonPoints(scale);
  const anchor = `${9 * scale}px ${5 * scale}px`;
  const elements = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElementNS(SVG_NS, 'polygon');
    el.setAttribute('points', points);
    el.setAttribute('fill', CONFIG.colors.flow);
    el.setAttribute('fill-opacity', CONFIG.flowArrowOpacity);
    el.setAttribute('class', 'flow-arrow');
    el.style.offsetPath = `path('${d}')`;
    el.style.offsetAnchor = anchor;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${-(i / count) * duration}s`;
    container.appendChild(el);
    elements.push(el);
  }

  activeFlowArrows.push({latlngs, elements});
}

// Пересчитывает offset-path у всех активных штрихов после того, как
// Leaflet пересчитал пиксельные координаты (конец зума/панорамы) —
// иначе штрихи останутся «приклеены» к старой, уже не видимой линии.
function layoutFlowArrows() {
  for (const entry of activeFlowArrows) {
    const {d} = routePixelPath(entry.latlngs);
    for (const el of entry.elements) {
      el.style.offsetPath = `path('${d}')`;
    }
  }
}

map.on('zoomend moveend', layoutFlowArrows);

// Отдельная декоративная анимация — кораблик, идущий по одному конкретному
// заданному маршруту узлов (не связан с данными потока/года). Использует
// тот же механизм offset-path и тот же activeFlowArrows/layoutFlowArrows,
// что и обычные штрихи-пятиугольники, — просто добавляет в них ещё одну
// «фигуру» другой формы, не меняя логику остальных маршрутов.
(function injectFlowShipStyles() {
  if (document.getElementById('flow-ship-styles')) return;
  const style = document.createElement('style');
  style.id = 'flow-ship-styles';
  style.textContent = `
    .flow-ship {
      animation-name: flowArrowMove;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      offset-rotate: auto;
      offset-anchor: 11px 8px;
      pointer-events: none;
    }
    .ship-smoke {
      animation-name: shipSmoke;
      animation-timing-function: ease-out;
      animation-iteration-count: infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes shipSmoke {
      0%   { transform: translate(0, 0) scale(0.6); opacity: 0.55; }
      100% { transform: translate(1.5px, -9px) scale(1.6); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();

// Список узлов маршрута-декорации (парсится один раз при загрузке).
const SHIP_ROUTE_NODES = (
  'N189;N192;N193;N194;N195;N196;N197;N198;N199;N200;N201;N202;N203;N204;' +
  'N205;N206;N207;N208;N209;N210;N211;N212;N213;N214;N215;N216;N217;N218;' +
  'N219;N220;N221;N222;N223;N224;N225;N900;N901;N902;N903;N904;N905;N906;' +
  'N907;N908;N909;N910;N911;N912;N913;N914;N915;N916;N917;N918;N919;N920;' +
  'N921;N922;N923'
).split(';').map(s => s.trim()).filter(Boolean);

// Рёбра маршрута кораблика (в обе стороны) — по ним обычные штрихи
// рисоваться не должны, чтобы не накладываться на анимацию кораблика.
const SHIP_ROUTE_EDGES = new Set();
for (let i = 0; i < SHIP_ROUTE_NODES.length - 1; i++) {
  const a = SHIP_ROUTE_NODES[i];
  const b = SHIP_ROUTE_NODES[i + 1];
  SHIP_ROUTE_EDGES.add(`${a}>${b}`);
  SHIP_ROUTE_EDGES.add(`${b}>${a}`);
}

// Режет цепочку узлов на непрерывные отрезки по признаку «лежит ребро на
// пути кораблика или нет» — так штрихи можно погасить именно там, где
// реально идёт кораблик, а не на всём объединённом отрезке целиком
// (иначе гасло и то, что до/после пути кораблика, но входит в ту же
// цепочку от развилки до развилки).
function splitByShipRoute(nodes) {
  const segments = [];
  let current = [nodes[0]];
  let currentOnShip = null;

  for (let i = 0; i < nodes.length - 1; i++) {
    const onShip = SHIP_ROUTE_EDGES.has(`${nodes[i]}>${nodes[i + 1]}`);
    if (currentOnShip === null) currentOnShip = onShip;

    if (onShip !== currentOnShip) {
      segments.push({nodes: current, onShip: currentOnShip});
      current = [nodes[i]];
      currentOnShip = onShip;
    }

    current.push(nodes[i + 1]);
  }

  segments.push({nodes: current, onShip: currentOnShip});
  return segments;
}

// Силуэт пароходика: корпус + рубка + ДВЕ трубы с дымовыми полосами и
// анимированным дымом, «носом» вправо (offset-rotate:auto довернёт его по
// направлению движения на каждом изгибе маршрута).
function createShipElement() {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'flow-ship');

  const hull = document.createElementNS(SVG_NS, 'polygon');
  hull.setAttribute('points', '0,9 18,9 22,11 18,13 2,13');
  hull.setAttribute('fill', '#3d4450');
  g.appendChild(hull);

  const cabin = document.createElementNS(SVG_NS, 'rect');
  cabin.setAttribute('x', '4');
  cabin.setAttribute('y', '6');
  cabin.setAttribute('width', '11');
  cabin.setAttribute('height', '3');
  cabin.setAttribute('fill', '#e9edf0');
  cabin.setAttribute('stroke', '#b8bfc6');
  cabin.setAttribute('stroke-width', '0.5');
  g.appendChild(cabin);

  // Две трубы рядом, у каждой — своя дымовая полоса и свой дымок.
  const funnelX = [6, 11];

  funnelX.forEach((x, i) => {
    const funnel = document.createElementNS(SVG_NS, 'rect');
    funnel.setAttribute('x', String(x));
    funnel.setAttribute('y', '0');
    funnel.setAttribute('width', '2.4');
    funnel.setAttribute('height', '6');
    funnel.setAttribute('fill', '#b5332e');
    g.appendChild(funnel);

    const band = document.createElementNS(SVG_NS, 'rect');
    band.setAttribute('x', String(x - 0.3));
    band.setAttribute('y', '0');
    band.setAttribute('width', '3');
    band.setAttribute('height', '1.2');
    band.setAttribute('fill', '#20232a');
    g.appendChild(band);

    const smoke = document.createElementNS(SVG_NS, 'circle');
    smoke.setAttribute('cx', String(x + 1.2));
    smoke.setAttribute('cy', '-0.5');
    smoke.setAttribute('r', '1.6');
    smoke.setAttribute('fill', '#c7cdd3');
    smoke.setAttribute('class', 'ship-smoke');
    smoke.style.animationDuration = '1.5s';
    smoke.style.animationDelay = `${i * -0.75}s`;
    g.appendChild(smoke);
  });

  return g;
}

// Добавляет кораблики на заданный маршрут (latlngs) — количество и
// скорость берутся из CONFIG.shipCount/shipSpeed, не из толщины потока.
function addShipMarkers(latlngs, container) {
  const {d, length} = routePixelPath(latlngs);
  if (length <= 0) return;

  const count = CONFIG.shipCount;
  const duration = length / CONFIG.shipSpeed[state.speedIndex];
  const elements = [];

  for (let i = 0; i < count; i++) {
    const el = createShipElement();
    el.style.offsetPath = `path('${d}')`;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${-(i / count) * duration}s`;
    container.appendChild(el);
    elements.push(el);
  }

  activeFlowArrows.push({latlngs, elements});
}

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


let FLOW_MAX_BY_YEAR={};
function rebuildFlowMaxByYear(){
  FLOW_MAX_BY_YEAR={};
  (CONFIG.years||[]).forEach(year=>{
    let max=0;
    if(typeof flowValues!=='undefined' && flowValues[year]){
      Object.values(flowValues[year]).forEach(v=>{const n=Number(v)||0;if(n>max)max=n;});
    }
    FLOW_MAX_BY_YEAR[year]=max;
  });
}
function getFlowYearMaximum(year){
  if(!Object.keys(FLOW_MAX_BY_YEAR).length)rebuildFlowMaxByYear();
  return FLOW_MAX_BY_YEAR[year]||0;
}
function weightFor(value,max,year=state.currentYear){
  if(!value||value<=0)return 1.5;
  const minWeight=1.5,maxWeight=15;
  const reference1908=getFlowYearMaximum(1908);
  const reference=Math.max(reference1908,max||0);
  const ratio=reference>0?Math.max(0,Math.min(1,Number(value)/reference)):0;
  const t=Math.sqrt(ratio);
  return minWeight+(maxWeight-minWeight)*t;
}

// Масштаб штриха-пятиугольника по величине потока — та же логика (и та же
// опорная величина 1908 года), что раньше использовалась для толщины линии.
function arrowScaleFor(value,max,year=state.currentYear){
  if(!value||value<=0)return 0.35;
  const minScale=0.35,maxScale=2.2;
  const reference1908=getFlowYearMaximum(1908);
  const reference=Math.max(reference1908,max||0);
  const ratio=reference>0?Math.max(0,Math.min(1,Number(value)/reference)):0;
  const t=Math.sqrt(ratio);
  return minScale+(maxScale-minScale)*t;
}


// Строит непрерывные цепочки узлов между «развилками» — точками слияния
// или разделения потока (а не между соседними узлами). Узел считается
// развилкой, если у него не ровно один вход и не ровно один выход
// (исток, сток, слияние или разделение). Внутри цепочки (там, где у
// каждого узла ровно один вход и один выход) толщина не меняется —
// меняться она может только на самой развилке:
//  - при слиянии (несколько входов сводятся в одно продолжение) —
//    толщина новой цепочки берётся как сумма величин слившихся потоков;
//  - при разделении (несколько исходящих рёбер) — у каждой новой
//    цепочки своя толщина, по величине именно этого ответвления.
function buildJunctionRoutes(flow) {
  const outEdges = new Map();
  const inValues = new Map();

  for (const [key, value] of flow) {
    if (!value || value <= 0) continue;
    const split = key.indexOf('>');
    if (split < 0) continue;
    const a = key.slice(0, split);
    const b = key.slice(split + 1);

    if (!outEdges.has(a)) outEdges.set(a, []);
    outEdges.get(a).push({to: b, value});

    if (!inValues.has(b)) inValues.set(b, []);
    inValues.get(b).push(value);
  }

  const outDegree = node => (outEdges.get(node) || []).length;
  const inDegree = node => (inValues.get(node) || []).length;
  const inSum = node =>
    (inValues.get(node) || []).reduce((sum, v) => sum + v, 0);
  const isJunction = node => inDegree(node) !== 1 || outDegree(node) !== 1;

  const junctions = new Set();
  for (const node of new Set([...outEdges.keys(), ...inValues.keys()])) {
    if (isJunction(node)) junctions.add(node);
  }

  const routes = [];
  const usedEdges = new Set();

  for (const start of junctions) {
    for (const edge of outEdges.get(start) || []) {
      const edgeKey = `${start}>${edge.to}`;
      if (usedEdges.has(edgeKey)) continue;

      // Толщина всей цепочки до следующей развилки.
      const chainValue = (outDegree(start) === 1 && inDegree(start) >= 2)
        ? inSum(start)   // слияние: сумма величин слившихся потоков
        : edge.value;    // исток/разделение: собственная величина ветви

      const nodes = [start, edge.to];
      usedEdges.add(edgeKey);

      let current = edge.to;
      const guard = new Set([edgeKey]);

      while (!isJunction(current)) {
        const nextEdges = outEdges.get(current) || [];
        if (!nextEdges.length) break;

        const nextEdge = nextEdges[0];
        const nextKey = `${current}>${nextEdge.to}`;

        if (guard.has(nextKey)) break; // защита от зацикливания
        guard.add(nextKey);
        usedEdges.add(nextKey);

        nodes.push(nextEdge.to);
        current = nextEdge.to;
      }

      routes.push({nodes, value: chainValue});
    }
  }

  return routes;
}

function namesForNodes(nodes) {
  const names = new Set();

  for (const node of nodes) {
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

function renderYear(year, animate = state.playing) {
  state.currentYear = Number(year);
  document.getElementById('yearLabel').textContent = year;

  updateYearInfo();
  updateYearArrowButtons();

  document.querySelectorAll('.years button').forEach(btn => {
    btn.classList.toggle(
      'active',
      Number(btn.dataset.year) === state.currentYear
    );
  });

  flowLayer.clearLayers();
  clearFlowArrows();

  const { flow } = calculateFlows(state.currentYear);
  const values = [...flow.values()].filter(v => v > 0);
  const max = Math.max(...values, 1);

  // Каждая цепочка — от развилки (слияния/разделения/истока) до следующей
  // развилки — рисуется одной линией с единой толщиной. Толщина меняется
  // именно на развилках: при слиянии становится больше (сумма слившихся
  // потоков), при разделении — своя у каждого нового ответвления. Сама
  // линия сплошная; движение показывают отдельные штрихи-пятиугольники,
  // бегущие вдоль неё через CSS offset-path.
  const routes = buildJunctionRoutes(flow);

  for (const route of routes) {
    if (!route.nodes || route.nodes.length < 2) continue;

    const coordinates = [];

    for (const nodeId of route.nodes) {
      const node = state.nodes.get(nodeId);
      if (!node) continue;
      coordinates.push([node.lat, node.lon]);
    }

    if (coordinates.length < 2) continue;

    // Линия невидима (opacity:0) — она нужна только как область наведения
    // для попапа с названиями регионов; саму толщину/величину потока
    // теперь показывает размер штрихов-пятиугольников, а не линия.
    const path = L.polyline(coordinates, {
      weight: weightFor(route.value, max),
      color: CONFIG.colors.flow,
      opacity: 0,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: true
    });

    const names = namesForNodes(route.nodes);

    if (names.length) {
      path.bindPopup(
        `<div class="region-popup">${names.map(escapeHtml).join('<br>')}</div>`,
        {closeButton: true}
      );
    }

    path.addTo(flowLayer);

    // Там, где отрезок проходит по рёбрам маршрута кораблика, обычные
    // штрихи не рисуем (чтобы анимации не накладывались друг на друга) —
    // но ТОЛЬКО на этой части: если один и тот же объединённый отрезок
    // «от развилки до развилки» частично идёт по пути кораблика, а
    // частично нет (например, N703→N189→N192→…), штрихи остаются на
    // части до/после пути кораблика.
    if (animate) {
      const scale = arrowScaleFor(route.value, max);
      const el = path.getElement();

      if (el && el.parentNode) {
        const segments = splitByShipRoute(route.nodes);

        for (const segment of segments) {
          if (segment.onShip || segment.nodes.length < 2) continue;

          const segCoords = [];
          for (const nodeId of segment.nodes) {
            const node = state.nodes.get(nodeId);
            if (!node) continue;
            segCoords.push(L.latLng(node.lat, node.lon));
          }

          if (segCoords.length >= 2) {
            addFlowArrows(segCoords, el.parentNode, scale);
          }
        }
      }
    }
  }

  // Декоративный маршрут кораблика — отдельно от расчёта потоков, не
  // зависит от данных по году. Рисуется только пока идёт анимация и
  // только в 1896–1900 годах включительно.
  const shipYearsActive = state.currentYear >= 1896 && state.currentYear <= 1900;
  if (animate && shipYearsActive) {
    const shipCoordinates = [];

    for (const nodeId of SHIP_ROUTE_NODES) {
      const node = state.nodes.get(nodeId);
      if (!node) continue;
      shipCoordinates.push([node.lat, node.lon]);
    }

    if (shipCoordinates.length >= 2) {
      const shipGuide = L.polyline(shipCoordinates, {
        weight: 1,
        opacity: 0,
        interactive: false
      });

      shipGuide.addTo(flowLayer);

      const el = shipGuide.getElement();
      if (el && el.parentNode) {
        const latlngs = shipCoordinates.map(([lat, lon]) => L.latLng(lat, lon));
        addShipMarkers(latlngs, el.parentNode);
      }
    }
  }

  state.flowsVisible = true;
  if (!map.hasLayer(flowLayer)) flowLayer.addTo(map);

  document.getElementById('status').textContent = '';

  const tablePanel = document.getElementById('tablePanel');
  if (tablePanel && !tablePanel.classList.contains('hidden')) {
    const title = document.getElementById('tableTitle');
    const kind = title ? title.dataset.kind : '';
    if (kind) showTable(kind);
  }

  const chartsPanel = document.getElementById('chartsPanel');
  if (chartsPanel && !chartsPanel.classList.contains('hidden')) {
    showChart(state.chartKind);
    updateChartTotal();
  }

  if (state.mapKind) applyMapTheme(state.mapKind);
}


function buildYearButtons() {
  const box=document.getElementById('yearButtons');
  box.innerHTML='';
  CONFIG.years.forEach(year=>{
    const btn=document.createElement('button');
    btn.textContent=year; btn.dataset.year=year;
    btn.onclick=()=>{
      const wasPlaying=state.playing;

      // Перестраиваем маршруты, НЕ снимая flowLayer с карты заранее —
      // иначе у новых линий ещё нет DOM-элемента (getElement()===null) и
      // штрихи/кораблики создать не на чем (анимация пропадала при смене года).
      renderYear(year, wasPlaying);

      if(wasPlaying){
        state.playing=true;
        updateAnimationButton();
      } else {
        state.playing=false;
        state.flowsVisible=false;
        if(map.hasLayer(flowLayer)) map.removeLayer(flowLayer);
        updateAnimationButton();
      }
    };
    box.appendChild(btn);
  });
  updateYearArrowButtons();
}


function pauseAnimation() {
  state.playing=false;
  if(state.timer)clearInterval(state.timer);
  state.timer=null;
  clearFlowArrows();
  state.flowsVisible=false;
  if(map.hasLayer(flowLayer))map.removeLayer(flowLayer);
  updateAnimationButton();
}


function startAnimation() {
  state.flowsVisible=true;
  if(!map.hasLayer(flowLayer))flowLayer.addTo(map);
  state.playing=true;
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
  // Перестраиваем маршруты, НЕ снимая flowLayer с карты заранее — иначе
  // у новых линий ещё нет DOM-элемента и штрихи/кораблики создать не на
  // чем (анимация пропадала при смене года).
  renderYear(ys[ni], wasPlaying);

  if(wasPlaying){
    state.playing=true;
    updateAnimationButton();
  } else {
    state.playing=false;
    state.flowsVisible=false;
    if(map.hasLayer(flowLayer)) map.removeLayer(flowLayer);
    updateAnimationButton();
  }
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

// ============================================================
// ЦВЕТА ТЕМАТИЧЕСКИХ КАРТ
// ============================================================

// Красные оттенки — карта "ИСХОД"
const FROM_COLORS = [
  'rgba(255, 220, 220, 0.95)', // 1-й диапазон
  'rgba(255, 175, 175, 0.95)', // 2-й
  'rgba(255, 125, 125, 0.95)', // 3-й
  'rgba(230, 60, 60, 0.95)',   // 4-й
  'rgba(180, 0, 0, 0.95)'      // 5-й
];

// Зелёные оттенки — карта "ВОДВОРЕНИЕ"
const TO_COLORS = [
  'rgba(215, 245, 220, 0.95)', // 1-й диапазон
  'rgba(165, 230, 175, 0.95)', // 2-й
  'rgba(105, 205, 125, 0.95)', // 3-й
  'rgba(40, 160, 65, 0.95)',   // 4-й
  'rgba(0, 105, 35, 0.95)'     // 5-й
];

function colorScale(kind, t) {
  const strength = Math.max(0, Math.min(1, t));

  // Определяем номер диапазона 0–4
  const index = Math.min(
    4,
    Math.floor(strength * 5)
  );

  if (kind === 'from') {
    return FROM_COLORS[index];
  }

  return TO_COLORS[index];
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
  const box=document.getElementById('mapLegend');
  if(!box)return;
  const title=kind==='from'?'Число переселенцев — исход':'Число переселенцев — водворение';
  if(!max||max<=0){
    box.innerHTML=`<div class="map-legend-title">${title}</div><div>Нет ненулевых значений для выбранного года.</div><div class="year-info">${yearTotalText()}</div>`;
    return;
  }
  const bands=[[0,.2],[.2,.4],[.4,.6],[.6,.8],[.8,1]];
  const rows=bands.map(([lo,hi],i)=>{
    const low=i===0?1:Math.floor(max*lo)+1;
    const high=i===4?Math.round(max):Math.floor(max*hi);
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

  const top = list.slice(0, 12);
  const rest = list.slice(12).reduce((sum, r) => sum + r.value, 0);
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
      layout: {
        padding: {top: 0, right: 0, bottom: 0, left: 0}
      },
      plugins: {
        legend: {
          display: true,
          position: 'right',
          align: 'center',
          labels: {
            generateLabels: chart => chart.data.labels.map((label, i) => ({
      text: legendLabels[i],
      fillStyle: chart.data.datasets[0].backgroundColor[i],
      strokeStyle: '#ffffff',
      lineWidth: 1,
      hidden: false,
      index: i
    })),

    padding: 5,
    boxWidth: 12,
    boxHeight: 12,

    font: {
      size: 12
    }
  }
},
        title: {
          display: true,
          text: `${kind === 'from' ? 'Исход' : 'Водворение'} — ${state.currentYear}`,
          padding: {top: 4, bottom: 4}
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
  else { renderYear(state.currentYear, true); startAnimation(); }
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

// Кнопка донатов: по клику копирует номер карты в буфер обмена.
// ЗАМЕНИТЕ на реальный номер карты — сейчас здесь плейсхолдер.
const DONATE_CARD_NUMBER = '0000 0000 0000 0000';

(function setupDonateButton() {
  const btn = document.getElementById('donateBtn');
  if (!btn) return;

  const defaultLabel = btn.textContent;
  let resetTimer = null;

  btn.addEventListener('click', async () => {
    const digitsOnly = DONATE_CARD_NUMBER.replace(/\s+/g, '');

    try {
      await navigator.clipboard.writeText(digitsOnly);
    } catch (err) {
      window.prompt('Номер карты для доната:', DONATE_CARD_NUMBER);
      return;
    }

    btn.textContent = `Скопировано: ${DONATE_CARD_NUMBER}`;
    btn.classList.add('copied');
    btn.title = DONATE_CARD_NUMBER;

    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      btn.textContent = defaultLabel;
      btn.classList.remove('copied');
    }, 5000);
  });
})();

init();
