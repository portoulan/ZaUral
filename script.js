/* ============================================================
   КАРТА МИГРАЦИЙ 1896–1916
   ------------------------------------------------------------
   Файлы:

   data/
      migration_from.csv
      migration_to.csv
      EDGES
      NODES
      data.geojson

   migration_from:
      Origin;EDGE;year_1896;year_1897;...

   migration_to:
      Destinatoin;EDGE;year_1896;year_1897;...

   NODES:
      id;lat;lon

   EDGES:
      from;to;to;to;...

   ============================================================ */


/* ============================================================
   НАСТРОЙКИ
   ============================================================ */

const CONFIG = {

    DATA_PATH: "data/",

    FILE_MIGRATION_FROM: "migration_from",
    FILE_MIGRATION_TO: "migration_to",
    FILE_EDGES: "EDGES",
    FILE_NODES: "NODES",
    FILE_GEOJSON: "data.geojson",

    START_YEAR: 1896,
    END_YEAR: 1916,

    // Цвет исходящих потоков
    OUTGOING_COLOR: "#d62728",

    // Цвет входящих потоков
    INCOMING_COLOR: "#1f77b4",

    // Прозрачность обычных потоков
    FLOW_OPACITY: 0.70,

    // Максимальная толщина потока
    MAX_FLOW_WEIGHT: 14,

    // Минимальная толщина
    MIN_FLOW_WEIGHT: 1,

    // Скорость анимации
    ANIMATION_DURATION: 1200,

    // Показывать подписи годов
    SHOW_YEAR_LABEL: true
};


/* ============================================================
   ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
   ============================================================ */

let map;

let migrationFrom = [];
let migrationTo = [];

let nodes = {};
let graph = {};

let geojsonData = null;

let currentYear = CONFIG.START_YEAR;

let animationEnabled = false;

let animationTimer = null;

let flowLayer = null;
let regionLayer = null;

let tablesVisible = false;

let sourceTableContainer = null;
let destinationTableContainer = null;

let yearButtonsContainer = null;
let yearSlider = null;
let yearLabel = null;

let animationButton = null;
let tablesButton = null;


/* ============================================================
   ЗАПУСК
   ============================================================ */

document.addEventListener("DOMContentLoaded", async function () {

    try {

        createInterface();

        map = L.map("map", {
            zoomControl: true,
            preferCanvas: true
        });

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);


        console.log("========================================");
        console.log("Загрузка данных");
        console.log("========================================");


        await loadAllData();


        console.log("Данные загружены");

        console.log("migration_from:", migrationFrom.length);
        console.log("migration_to:", migrationTo.length);
        console.log("nodes:", Object.keys(nodes).length);
        console.log("graph:", Object.keys(graph).length);


        buildRegionLayer();

        drawFlows();

        setupMap();

        updateInterface();

    } catch (error) {

        console.error(error);

        showError(
            "Ошибка загрузки данных: " + error.message
        );
    }
});


/* ============================================================
   ИНТЕРФЕЙС
   ============================================================ */

function createInterface() {

    const controls = document.createElement("div");

    controls.id = "migration-controls";

    controls.innerHTML = `

        <div class="migration-toolbar">

            <button id="prevYearBtn">
                ◀
            </button>

            <div id="yearButtons"></div>

            <button id="nextYearBtn">
                ▶
            </button>

            <button id="animationBtn">
                Анимация: ВЫКЛ
            </button>

            <button id="tablesBtn">
                Таблицы
            </button>

        </div>

        <div class="year-slider-container">

            <span id="yearMin">
                ${CONFIG.START_YEAR}
            </span>

            <input
                id="yearSlider"
                type="range"
                min="${CONFIG.START_YEAR}"
                max="${CONFIG.END_YEAR}"
                step="1"
                value="${CONFIG.START_YEAR}"
            >

            <span id="yearMax">
                ${CONFIG.END_YEAR}
            </span>

            <strong id="yearLabel">
                ${CONFIG.START_YEAR}
            </strong>

        </div>

        <div
            id="tablesContainer"
            class="tables-container"
            style="display:none;"
        >

            <div class="table-column">

                <h3>
                    Регионы исхода
                </h3>

                <div id="sourceTable"></div>

            </div>

            <div class="table-column">

                <h3>
                    Регионы переселения
                </h3>

                <div id="destinationTable"></div>

            </div>

        </div>

    `;


    document.body.appendChild(controls);


    injectStyles();


    document
        .getElementById("prevYearBtn")
        .addEventListener("click", function () {

            setYear(currentYear - 1);

        });


    document
        .getElementById("nextYearBtn")
        .addEventListener("click", function () {

            setYear(currentYear + 1);

        });


    animationButton =
        document.getElementById("animationBtn");


    animationButton.addEventListener(
        "click",
        toggleAnimation
    );


    tablesButton =
        document.getElementById("tablesBtn");


    tablesButton.addEventListener(
        "click",
        toggleTables
    );


    yearSlider =
        document.getElementById("yearSlider");


    yearSlider.addEventListener(
        "input",
        function () {

            setYear(
                Number(this.value)
            );

        }
    );


    yearLabel =
        document.getElementById("yearLabel");


    yearButtonsContainer =
        document.getElementById("yearButtons");


    sourceTableContainer =
        document.getElementById("sourceTable");


    destinationTableContainer =
        document.getElementById("destinationTable");


    createYearButtons();
}


/* ============================================================
   СТИЛИ
   ============================================================ */

function injectStyles() {

    const style = document.createElement("style");

    style.textContent = `

        #migration-controls {

            position: fixed;

            top: 10px;
            left: 50%;

            transform: translateX(-50%);

            z-index: 2000;

            background: rgba(255,255,255,0.96);

            border-radius: 8px;

            box-shadow:
                0 2px 10px rgba(0,0,0,0.25);

            padding: 10px;

            font-family:
                Arial,
                sans-serif;

            max-width: calc(100vw - 30px);

        }


        .migration-toolbar {

            display: flex;

            align-items: center;

            gap: 5px;

            flex-wrap: wrap;

        }


        .migration-toolbar button {

            border: 1px solid #bbb;

            background: white;

            border-radius: 4px;

            padding: 6px 10px;

            cursor: pointer;

            font-size: 13px;

        }


        .migration-toolbar button:hover {

            background: #eee;

        }


        .migration-toolbar button.active {

            background: #333;

            color: white;

        }


        #yearButtons {

            display: flex;

            gap: 3px;

            flex-wrap: wrap;

        }


        #yearButtons button {

            min-width: 40px;

            padding: 5px 6px;

        }


        #yearButtons button.selected {

            background: #333;

            color: white;

        }


        .year-slider-container {

            display: flex;

            align-items: center;

            gap: 8px;

            margin-top: 8px;

        }


        #yearSlider {

            width: 420px;

        }


        #yearLabel {

            min-width: 42px;

            text-align: center;

            font-size: 16px;

        }


        .tables-container {

            display: flex;

            gap: 20px;

            max-height: 500px;

            overflow-y: auto;

            margin-top: 10px;

            border-top: 1px solid #ddd;

            padding-top: 10px;

        }


        .table-column {

            min-width: 350px;

        }


        .table-column h3 {

            margin: 0 0 8px 0;

            font-size: 15px;

        }


        .migration-table {

            border-collapse: collapse;

            width: 100%;

            font-size: 12px;

        }


        .migration-table th,
        .migration-table td {

            border: 1px solid #ccc;

            padding: 4px 6px;

            text-align: right;

        }


        .migration-table th:first-child,
        .migration-table td:first-child {

            text-align: left;

        }


        .migration-table th {

            background: #eee;

            position: sticky;

            top: 0;

        }


        .flow-tooltip {

            font-size: 13px;

            line-height: 1.5;

        }


        .legend {

            background: white;

            padding: 10px;

            border-radius: 5px;

            box-shadow:
                0 1px 5px rgba(0,0,0,0.25);

            line-height: 1.5;

        }


        .legend-line {

            display: inline-block;

            width: 30px;

            border-top: 4px solid;

            margin-right: 7px;

            vertical-align: middle;

        }


        @media (max-width: 900px) {

            #yearButtons {

                display: none;

            }

            #yearSlider {

                width: 220px;

            }

            .tables-container {

                flex-direction: column;

            }

        }

    `;

    document.head.appendChild(style);
}


/* ============================================================
   ГОДЫ
   ============================================================ */

function createYearButtons() {

    yearButtonsContainer.innerHTML = "";

    for (
        let year = CONFIG.START_YEAR;
        year <= CONFIG.END_YEAR;
        year++
    ) {

        const button =
            document.createElement("button");

        button.textContent = year;

        button.dataset.year = year;

        button.addEventListener(
            "click",
            function () {

                setYear(year);

            }
        );

        yearButtonsContainer.appendChild(button);
    }
}


/* ============================================================
   ПЕРЕКЛЮЧЕНИЕ ГОДА
   ============================================================ */

function setYear(year) {

    year = Math.max(
        CONFIG.START_YEAR,
        Math.min(CONFIG.END_YEAR, year)
    );


    currentYear = year;


    /*
       ВАЖНО:

       Здесь мы НЕ выключаем animationEnabled.

       Поэтому если анимация была включена,
       она продолжит работать после смены года.
    */


    updateInterface();

    drawFlows();

    if (tablesVisible) {

        updateTables();

    }

}


/* ============================================================
   ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
   ============================================================ */

function updateInterface() {

    if (yearSlider) {

        yearSlider.value = currentYear;

    }


    if (yearLabel) {

        yearLabel.textContent = currentYear;

    }


    document
        .querySelectorAll("#yearButtons button")
        .forEach(function (button) {

            button.classList.toggle(
                "selected",
                Number(button.dataset.year)
                    === currentYear
            );

        });


    if (animationButton) {

        animationButton.textContent =
            animationEnabled
                ? "Анимация: ВКЛ"
                : "Анимация: ВЫКЛ";

        animationButton.classList.toggle(
            "active",
            animationEnabled
        );

    }

}


/* ============================================================
   ЗАГРУЗКА ВСЕХ ДАННЫХ
   ============================================================ */

async function loadAllData() {

    const [
        fromText,
        toText,
        edgesText,
        nodesText,
        geojsonText
    ] = await Promise.all([

        loadText(
            CONFIG.DATA_PATH +
            CONFIG.FILE_MIGRATION_FROM
        ),

        loadText(
            CONFIG.DATA_PATH +
            CONFIG.FILE_MIGRATION_TO
        ),

        loadText(
            CONFIG.DATA_PATH +
            CONFIG.FILE_EDGES
        ),

        loadText(
            CONFIG.DATA_PATH +
            CONFIG.FILE_NODES
        ),

        loadText(
            CONFIG.DATA_PATH +
            CONFIG.FILE_GEOJSON
        )

    ]);


    migrationFrom =
        parseMigrationFrom(fromText);


    migrationTo =
        parseMigrationTo(toText);


    nodes =
        parseNodes(nodesText);


    graph =
        parseEdges(edgesText);


    geojsonData =
        JSON.parse(
            geojsonText
                .replace(/^\uFEFF/, "")
        );

}


/* ============================================================
   ЗАГРУЗКА ТЕКСТОВОГО ФАЙЛА
   ============================================================ */

async function loadText(url) {

    console.log(
        "Загрузка:",
        url
    );


    const response =
        await fetch(
            url + "?v=" + Date.now()
        );


    if (!response.ok) {

        throw new Error(
            "Не удалось загрузить " +
            url +
            ". HTTP " +
            response.status
        );

    }


    return await response.text();
}


/* ============================================================
   УНИВЕРСАЛЬНЫЙ SPLIT ПО ;
   ============================================================ */

function parseLine(line) {

    return line
        .replace(/^\uFEFF/, "")
        .split(";")
        .map(function (x) {

            return x
                .replace(/^\uFEFF/, "")
                .trim()
                .replace(/,+$/, "");

        });

}


/* ============================================================
   MIGRATION FROM
   ============================================================ */

function parseMigrationFrom(text) {

    const lines =
        text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter(function (line) {

                return line.trim() !== "";

            });


    const header =
        parseLine(lines[0]);


    const yearColumns = {};

    header.forEach(
        function (name, index) {

            if (
                /^year_\d{4}$/.test(name)
            ) {

                yearColumns[
                    Number(
                        name.substring(5)
                    )
                ] = index;

            }

        }
    );


    const result = [];


    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const cells =
            parseLine(lines[i]);


        const origin =
            cells[0];


        const edge =
            cells[1];


        if (!origin || !edge) {

            continue;

        }


        const years = {};


        Object.keys(yearColumns)
            .forEach(function (year) {

                const index =
                    yearColumns[year];


                let value =
                    Number(
                        cells[index]
                    );


                if (!Number.isFinite(value)) {

                    value = 0;

                }


                years[year] = value;

            });


        result.push({

            origin: origin,

            edge: edge,

            years: years

        });

    }


    return result;
}


/* ============================================================
   MIGRATION TO
   ============================================================ */

function parseMigrationTo(text) {

    const lines =
        text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter(function (line) {

                return line.trim() !== "";

            });


    const header =
        parseLine(lines[0]);


    const yearColumns = {};


    header.forEach(
        function (name, index) {

            if (
                /^year_\d{4}$/.test(name)
            ) {

                yearColumns[
                    Number(
                        name.substring(5)
                    )
                ] = index;

            }

        }
    );


    const result = [];


    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const cells =
            parseLine(lines[i]);


        const destination =
            cells[0];


        const edge =
            cells[1];


        if (!destination || !edge) {

            continue;

        }


        const years = {};


        Object.keys(yearColumns)
            .forEach(function (year) {

                const index =
                    yearColumns[year];


                let value =
                    Number(
                        cells[index]
                    );


                if (!Number.isFinite(value)) {

                    value = 0;

                }


                years[year] = value;

            });


        result.push({

            destination: destination,

            edge: edge,

            years: years

        });

    }


    return result;
}


/* ============================================================
   NODES
   ============================================================ */

function parseNodes(text) {

    const lines =
        text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter(function (line) {

                return line.trim() !== "";

            });


    const result = {};


    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const cells =
            parseLine(lines[i]);


        const id =
            cells[0];


        if (!id) {

            continue;

        }


        let lat =
            parseFloat(
                cells[1]
            );


        let lon =
            parseFloat(
                cells[2]
            );


        /*
           Иногда в NODES встречается запятая
           после координаты.
        */

        if (!Number.isFinite(lat) ||
            !Number.isFinite(lon)) {

            continue;

        }


        result[id] = {

            id: id,

            lat: lat,

            lon: lon

        };

    }


    return result;
}


/* ============================================================
   EDGES
   ============================================================

   Формат:

   N301;N310

   означает:

   N301 → N310


   Формат:

   N310;N407;N408;N409...

   означает:

   N310 →
       N407
       N408
       N409
       ...


   Строки с пустыми ячейками игнорируются.
   ============================================================ */

function parseEdges(text) {

    const lines =
        text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter(function (line) {

                return line.trim() !== "";

            });


    const result = {};


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const cells =
            parseLine(lines[i]);


        if (cells.length < 2) {

            continue;

        }


        const from =
            cells[0];


        if (!from) {

            continue;

        }


        /*
           Пропускаем заголовок
        */

        if (
            from.toLowerCase() === "from"
        ) {

            continue;

        }


        if (!result[from]) {

            result[from] = [];

        }


        for (
            let j = 1;
            j < cells.length;
            j++
        ) {

            const to =
                cells[j];


            if (!to) {

                continue;

            }


            if (
                !result[from].includes(to)
            ) {

                result[from].push(to);

            }

        }

    }


    return result;
}


/* ============================================================
   ГЕОГРАФИЧЕСКИЙ СЛОЙ РЕГИОНОВ
   ============================================================ */

function buildRegionLayer() {

    if (!geojsonData) {

        return;

    }


    regionLayer =
        L.geoJSON(
            geojsonData,
            {

                style: function () {

                    return {

                        color: "#666",

                        weight: 0.7,

                        fillOpacity: 0.05

                    };

                },


                onEachFeature:
                    function (
                        feature,
                        layer
                    ) {

                        const region =
                            getRegionName(feature);


                        if (!region) {

                            return;

                        }


                        layer.on(
                            "mouseover",
                            function (event) {

                                showRegionTooltip(
                                    event,
                                    region
                                );

                            }
                        );


                        layer.on(
                            "mouseout",
                            function () {

                                map.closeTooltip();

                            }
                        );


                        layer.on(
                            "mousemove",
                            function (event) {

                                updateRegionTooltipPosition(
                                    event
                                );

                            }
                        );

                    }

            }
        );


    regionLayer.addTo(map);

}


/* ============================================================
   НАЗВАНИЕ РЕГИОНА ИЗ GEOJSON
   ============================================================ */

function getRegionName(feature) {

    if (!feature ||
        !feature.properties) {

        return null;

    }


    return (
        feature.properties.prov_RUS ||
        feature.properties.PROV_RUS ||
        feature.properties.prov_ENG ||
        feature.properties.name ||
        feature.properties.NAME ||
        null
    );

}


/* ============================================================
   TOOLTIP РЕГИОНА
   ============================================================ */

function showRegionTooltip(
    event,
    region
) {

    const source =
        migrationFrom.find(
            function (item) {

                return (
                    normalizeName(item.origin)
                    === normalizeName(region)
                );

            }
        );


    const destination =
        migrationTo.find(
            function (item) {

                return (
                    normalizeName(item.destination)
                    === normalizeName(region)
                );

            }
        );


    const outgoing =
        source
            ? getYearValue(
                source,
                currentYear
            )
            : null;


    const incoming =
        destination
            ? getYearValue(
                destination,
                currentYear
            )
            : null;


    let html = `

        <div class="flow-tooltip">

            <strong>
                ${escapeHtml(region)}
            </strong>

    `;


    if (outgoing !== null) {

        html += `

            <br>
            Исходящие:
            <strong>
                ${formatNumber(outgoing)}
            </strong>

        `;

    }


    if (incoming !== null) {

        html += `

            <br>
            Переселившиеся:
            <strong>
                ${formatNumber(incoming)}
            </strong>

        `;

    }


    /*
       Если регион есть только в GeoJSON,
       но отсутствует в таблицах,
       ничего расчётного не показываем.
    */


    html += "</div>";


    map.openTooltip(
        html,
        event.latlng,
        {
            direction: "top",
            sticky: true
        }
    );

}


function updateRegionTooltipPosition(event) {

    if (map._tooltip) {

        map._tooltip.setLatLng(
            event.latlng
        );

    }

}


/* ============================================================
   НОРМАЛИЗАЦИЯ НАЗВАНИЙ
   ============================================================ */

function normalizeName(name) {

    return String(name || "")
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


/* ============================================================
   ПОЛУЧЕНИЕ ЗНАЧЕНИЯ ЗА ГОД
   ============================================================ */

function getYearValue(
    item,
    year
) {

    if (
        !item ||
        !item.years
    ) {

        return 0;

    }


    return Number(
        item.years[year] || 0
    );

}


/* ============================================================
   ФОРМАТИРОВАНИЕ ЧИСЕЛ
   ============================================================ */

function formatNumber(number) {

    return Number(
        number || 0
    ).toLocaleString("ru-RU");

}


/* ============================================================
   ПОИСК МАРШРУТА
   ============================================================ */

/*
   Основная функция маршрутизации.

   Например:

   N301
      ↓
   N310
      ↓
   N407
      ↓
   ...
      ↓
   N178

   или:

   N700
      ↓
   N701
      ↓
   ...
      ↓
   N189
      ↓
   N192
      ↓
   ...
      ↓
   N226
*/


function findRoute(start, end) {

    if (!start || !end) {

        return null;

    }


    if (start === end) {

        return [start];

    }


    const queue = [start];

    const visited = new Set([start]);

    const previous = {};


    while (queue.length > 0) {

        const current =
            queue.shift();


        const neighbours =
            graph[current] || [];


        for (
            let i = 0;
            i < neighbours.length;
            i++
        ) {

            const next =
                neighbours[i];


            if (
                visited.has(next)
            ) {

                continue;

            }


            visited.add(next);

            previous[next] =
                current;


            if (
                next === end
            ) {

                return reconstructPath(
                    previous,
                    start,
                    end
                );

            }


            queue.push(next);

        }

    }


    return null;
}


/* ============================================================
   ВОССТАНОВЛЕНИЕ МАРШРУТА
   ============================================================ */

function reconstructPath(
    previous,
    start,
    end
) {

    const path = [];

    let current = end;


    while (
        current !== undefined
    ) {

        path.unshift(current);


        if (
            current === start
        ) {

            return path;

        }


        current =
            previous[current];

    }


    return null;
}


/* ============================================================
   ПОИСК ВСЕХ МАРШРУТОВ
   ============================================================ */

function findAllRoutes() {

    const routes = [];


    /*
       Каждый регион исхода имеет EDGE.

       Каждый регион назначения имеет EDGE.

       Для каждой пары:

       source EDGE → destination EDGE

       ищем путь по графу.
    */


    migrationFrom.forEach(
        function (source) {

            const sourceValue =
                getYearValue(
                    source,
                    currentYear
                );


            if (sourceValue <= 0) {

                return;

            }


            migrationTo.forEach(
                function (destination) {

                    const destinationValue =
                        getYearValue(
                            destination,
                            currentYear
                        );


                    if (
                        destinationValue <= 0
                    ) {

                        return;

                    }


                    const path =
                        findRoute(
                            source.edge,
                            destination.edge
                        );


                    if (!path ||
                        path.length < 2) {

                        return;

                    }


                    routes.push({

                        source:
                            source.origin,

                        sourceEdge:
                            source.edge,

                        destination:
                            destination.destination,

                        destinationEdge:
                            destination.edge,

                        sourceValue:
                            sourceValue,

                        destinationValue:
                            destinationValue,

                        path:
                            path

                    });

                }
            );

        }
    );


    return routes;
}


/* ============================================================
   ПОСТРОЕНИЕ ЛИНИИ МАРШРУТА
   ============================================================ */

function routeToLatLngs(route) {

    const points = [];


    route.forEach(
        function (nodeId) {

            const node =
                nodes[nodeId];


            if (!node) {

                return;

            }


            points.push([

                node.lat,

                node.lon

            ]);

        }
    );


    return points;
}


/* ============================================================
   РАСЧЁТ ТОЛЩИНЫ
   ============================================================ */

function calculateWeight(value) {

    /*
       Логарифмическая шкала.

       Она позволяет одновременно
       показывать маленькие и очень
       большие потоки.
    */


    if (!value || value <= 0) {

        return 0;

    }


    const weight =
        Math.log10(value + 1) * 2.2;


    return Math.max(
        CONFIG.MIN_FLOW_WEIGHT,
        Math.min(
            CONFIG.MAX_FLOW_WEIGHT,
            weight
        )
    );

}


/* ============================================================
   РИСОВАНИЕ ПОТОКОВ
   ============================================================ */

function drawFlows() {

    /*
       Удаляем старые потоки,
       но НЕ отключаем анимацию.
    */

    if (flowLayer) {

        flowLayer.remove();

    }


    flowLayer =
        L.layerGroup();


    const routes =
        findAllRoutes();


    console.log(
        "========================================"
    );

    console.log(
        "Год:",
        currentYear
    );

    console.log(
        "Маршрутов:",
        routes.length
    );


    routes.forEach(
        function (route) {

            drawRoute(
                route
            );

        }
    );


    flowLayer.addTo(map);


    /*
       Если анимация уже была включена,
       запускаем её снова на НОВОМ слое.

       Сам флаг animationEnabled не меняется.
    */

    if (animationEnabled) {

        restartAnimation();

    }

}


/* ============================================================
   РИСОВАНИЕ ОДНОГО МАРШРУТА
   ============================================================ */

function drawRoute(route) {

    const points =
        routeToLatLngs(
            route.path
        );


    if (points.length < 2) {

        console.warn(
            "Нет координат для маршрута:",
            route
        );

        return;

    }


    /*
       Исходящий поток:

       от региона исхода
       до конечного региона.

       Цвет зависит от направления.
    */


    const outgoingWeight =
        calculateWeight(
            route.sourceValue
        );


    const incomingWeight =
        calculateWeight(
            route.destinationValue
        );


    /*
       Основная линия исходящего потока.
    */

    const outgoingLine =
        L.polyline(
            points,
            {

                color:
                    CONFIG.OUTGOING_COLOR,

                weight:
                    outgoingWeight,

                opacity:
                    CONFIG.FLOW_OPACITY,

                lineCap: "round",

                lineJoin: "round",

                className:
                    "migration-outgoing"

            }
        );


    /*
       Входящий поток рисуем поверх
       того же маршрута другим цветом.

       Чтобы не получить полное перекрытие,
       делаем его немного тоньше.
    */

    const incomingLine =
        L.polyline(
            points,
            {

                color:
                    CONFIG.INCOMING_COLOR,

                weight:
                    Math.max(
                        1,
                        incomingWeight * 0.55
                    ),

                opacity:
                    0.55,

                lineCap: "round",

                lineJoin: "round",

                className:
                    "migration-incoming"

            }
        );


    outgoingLine.bindTooltip(

        `

        <strong>
            ${escapeHtml(route.source)}
        </strong>

        → 

        <strong>
            ${escapeHtml(route.destination)}
        </strong>

        <br>

        Исходящие:
        ${formatNumber(route.sourceValue)}

        <br>

        Переселившиеся:
        ${formatNumber(route.destinationValue)}

        `,

        {

            sticky: true,

            direction: "top"

        }

    );


    outgoingLine.addTo(
        flowLayer
    );


    incomingLine.addTo(
        flowLayer
    );


    /*
       Сохраняем ссылки для анимации.
    */

    route._outgoingLine =
        outgoingLine;

    route._incomingLine =
        incomingLine;

}


/* ============================================================
   АНИМАЦИЯ
   ============================================================ */

function toggleAnimation() {

    animationEnabled =
        !animationEnabled;


    if (animationEnabled) {

        startAnimation();

    } else {

        stopAnimation();

    }


    updateInterface();

}


/* ============================================================
   ЗАПУСК АНИМАЦИИ
   ============================================================ */

function startAnimation() {

    stopAnimation();


    if (!flowLayer) {

        return;

    }


    /*
       Используем CSS-анимацию
       движущегося штриха.

       Она НЕ зависит от текущего года.

       При смене года drawFlows()
       создаёт новые линии,
       после чего animation
       запускается снова автоматически.
    */


    injectAnimationCSS();


    flowLayer.eachLayer(
        function (layer) {

            if (
                layer.options &&
                layer.options.className
            ) {

                if (
                    layer.options.className
                    .includes("migration-outgoing")
                ) {

                    layer.getElement();

                    if (layer._path) {

                        layer._path.classList.add(
                            "animated-flow-outgoing"
                        );

                    }

                }


                if (
                    layer.options.className
                    .includes("migration-incoming")
                ) {

                    layer.getElement();

                    if (layer._path) {

                        layer._path.classList.add(
                            "animated-flow-incoming"
                        );

                    }

                }

            }

        }
    );

}


/* ============================================================
   ОСТАНОВКА АНИМАЦИИ
   ============================================================ */

function stopAnimation() {

    if (!flowLayer) {

        return;

    }


    flowLayer.eachLayer(
        function (layer) {

            if (layer._path) {

                layer._path.classList.remove(
                    "animated-flow-outgoing"
                );

                layer._path.classList.remove(
                    "animated-flow-incoming"
                );

            }

        }
    );

}


/* ============================================================
   ПЕРЕЗАПУСК АНИМАЦИИ
   ============================================================ */

function restartAnimation() {

    if (!animationEnabled) {

        return;

    }


    requestAnimationFrame(
        function () {

            startAnimation();

        }
    );

}


/* ============================================================
   CSS АНИМАЦИИ
   ============================================================ */

function injectAnimationCSS() {

    if (
        document.getElementById(
            "migration-animation-css"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "migration-animation-css";


    style.textContent = `

        /*
           Исходящий поток —
           красные движущиеся штрихи.
        */

        .animated-flow-outgoing {

            stroke-dasharray:
                10 10;

            animation:
                migrationFlowForward
                1.2s linear infinite;

        }


        /*
           Входящий поток —
           синие движущиеся штрихи.

           Движение идёт в противоположную
           сторону.
        */

        .animated-flow-incoming {

            stroke-dasharray:
                7 12;

            animation:
                migrationFlowBackward
                1.0s linear infinite;

        }


        @keyframes migrationFlowForward {

            from {

                stroke-dashoffset: 0;

            }

            to {

                stroke-dashoffset: -40;

            }

        }


        @keyframes migrationFlowBackward {

            from {

                stroke-dashoffset: 0;

            }

            to {

                stroke-dashoffset: 40;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* ============================================================
   ТАБЛИЦЫ
   ============================================================ */

function toggleTables() {

    tablesVisible =
        !tablesVisible;


    const container =
        document.getElementById(
            "tablesContainer"
        );


    if (tablesVisible) {

        container.style.display =
            "flex";

        tablesButton.textContent =
            "Скрыть таблицы";

        updateTables();

    } else {

        container.style.display =
            "none";

        tablesButton.textContent =
            "Таблицы";

    }

}


/* ============================================================
   ОБНОВЛЕНИЕ ТАБЛИЦ
   ============================================================ */

function updateTables() {

    if (!tablesVisible) {

        return;

    }


    updateSourceTable();

    updateDestinationTable();

}


/* ============================================================
   ТАБЛИЦА ИСХОДА
   ============================================================ */

function updateSourceTable() {

    const rows =
        migrationFrom
            .map(function (item) {

                return {

                    name:
                        item.origin,

                    value:
                        getYearValue(
                            item,
                            currentYear
                        )

                };

            })
            .filter(function (item) {

                return item.value > 0;

            })
            .sort(function (a, b) {

                return b.value - a.value;

            });


    let html = `

        <table
            class="migration-table"
        >

            <thead>

                <tr>

                    <th>
                        Регион
                    </th>

                    <th>
                        ${currentYear}
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    rows.forEach(
        function (row) {

            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            row.name
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.value
                        )}
                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    sourceTableContainer.innerHTML =
        html;

}


/* ============================================================
   ТАБЛИЦА НАЗНАЧЕНИЯ
   ============================================================ */

function updateDestinationTable() {

    const rows =
        migrationTo
            .map(function (item) {

                return {

                    name:
                        item.destination,

                    value:
                        getYearValue(
                            item,
                            currentYear
                        )

                };

            })
            .filter(function (item) {

                return item.value > 0;

            })
            .sort(function (a, b) {

                return b.value - a.value;

            });


    let html = `

        <table
            class="migration-table"
        >

            <thead>

                <tr>

                    <th>
                        Регион
                    </th>

                    <th>
                        ${currentYear}
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    rows.forEach(
        function (row) {

            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            row.name
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.value
                        )}
                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    destinationTableContainer.innerHTML =
        html;

}


/* ============================================================
   ЛЕГЕНДА
   ============================================================ */

function addLegend() {

    const legend =
        L.control({
            position: "bottomright"
        });


    legend.onAdd =
        function () {

            const div =
                L.DomUtil.create(
                    "div",
                    "legend"
                );


            div.innerHTML = `

                <div>
                    <span
                        class="legend-line"
                        style="
                            border-color:
                            ${CONFIG.OUTGOING_COLOR};
                        "
                    ></span>

                    Исходящие потоки

                </div>

                <div>
                    <span
                        class="legend-line"
                        style="
                            border-color:
                            ${CONFIG.INCOMING_COLOR};
                        "
                    ></span>

                    Входящие потоки

                </div>

            `;


            return div;

        };


    legend.addTo(map);

}


/* ============================================================
   НАСТРОЙКА КАРТЫ
   ============================================================ */

function setupMap() {

    if (
        regionLayer &&
        regionLayer.getBounds().isValid()
    ) {

        map.fitBounds(
            regionLayer.getBounds(),
            {
                padding: [30, 30]
            }
        );

    }


    addLegend();

}


/* ============================================================
   ЭКРАН ОШИБКИ
   ============================================================ */

function showError(message) {

    let errorBox =
        document.getElementById(
            "migration-error"
        );


    if (!errorBox) {

        errorBox =
            document.createElement(
                "div"
            );

        errorBox.id =
            "migration-error";


        errorBox.style.position =
            "fixed";

        errorBox.style.left =
            "20px";

        errorBox.style.bottom =
            "20px";

        errorBox.style.zIndex =
            "9999";

        errorBox.style.background =
            "white";

        errorBox.style.color =
            "#b00020";

        errorBox.style.padding =
            "15px";

        errorBox.style.border =
            "1px solid #b00020";

        errorBox.style.borderRadius =
            "5px";

        errorBox.style.maxWidth =
            "500px";

        errorBox.style.fontFamily =
            "Arial";


        document.body.appendChild(
            errorBox
        );

    }


    errorBox.textContent =
        message;

}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ============================================================
   КОНЕЦ
   ============================================================ */

console.log(
    "Migration map script loaded"
);
