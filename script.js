/* ============================================================
   ИНТЕРАКТИВНАЯ КАРТА МИГРАЦИЙ 1896–1916
   ============================================================

   ФАЙЛЫ:

   data/migration_from.csv
   Origin;EDGE;year_1896;...;year_1916

   data/migration_to.csv
   Destinatoin;EDGE;year_1896;...;year_1916

   data/NODES
   id;lat;lon

   data/EDGES
   from;to;to;to;...

   data/data.geojson

   ============================================================ */


/* ============================================================
   1. ФАЙЛЫ
   ============================================================ */

const FILES = {

    migrationFrom: [
        "data/migration_from.csv",
        "data/migration_from"
    ],

    migrationTo: [
        "data/migration_to.csv",
        "data/migration_to"
    ],

    nodes: [
        "data/NODES.csv",
        "data/NODES"
    ],

    edges: [
        "data/EDGES.csv",
        "data/EDGES"
    ],

    geojson: [
        "data/data.geojson"
    ]

};


/* ============================================================
   2. НАСТРОЙКИ
   ============================================================ */

const SETTINGS = {

    startYear: 1896,
    endYear: 1916,

    /* Исходящие */
    outgoingColor: "#d32f2f",

    /* Переходный */
    transitionColor: "#7b3f98",

    /* Входящие */
    incomingColor: "#1565c0",

    /* Потоки */
    flowOpacity: 0.68,

    minFlowWidth: 1.2,
    maxFlowWidth: 28,

    /* Плавность линий */
    curveFactor: 0.035,
    curveSteps: 12,

    /* Анимация */
    animationSpeed: 0.0018,
    strokeLength: 0.055,

    minStrokes: 1,
    maxStrokes: 8,

    animationWidth: 3,
    animationOpacity: 0.95,

    /* Регионы */
    regionBorderColor: "#777",
    regionFillColor: "#eeeeee",
    regionFillOpacity: 0.18,

    selectedSourceColor: "#d32f2f",
    selectedDestinationColor: "#1565c0",

    selectedSourceOpacity: 0.45,
    selectedDestinationOpacity: 0.40,

    initialCenter: [55, 70],
    initialZoom: 4

};


/* ============================================================
   3. ГОДЫ
   ============================================================ */

const YEARS = [];

for (
    let year = SETTINGS.startYear;
    year <= SETTINGS.endYear;
    year++
) {
    YEARS.push(year);
}

let currentYear = SETTINGS.startYear;


/* ============================================================
   4. ДАННЫЕ
   ============================================================ */

let migrationFrom = [];
let migrationTo = [];

let nodes = {};
let graph = {};
let reverseGraph = {};

let regions = {};
let geojsonData = null;

let destinationByEdge = {};
let sourceByEdge = {};

let routeCache = {};

let outgoingSegments = [];
let incomingSegments = [];


/* ============================================================
   5. СОСТОЯНИЕ
   ============================================================ */

let animationRunning = false;
let animationFrame = null;
let animationStrokes = [];

let selectedRegion = null;
let selectedRegionRole = null;

let selectedSourceNames = new Set();
let selectedDestinationNames = new Set();

let regionLayers = {};

let tablesVisible = false;


/* ============================================================
   6. КАРТА
   ============================================================ */

const map = L.map("map", {

    zoomControl: true,

    preferCanvas: true

});


L.tileLayer(

    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    {

        attribution:
            "&copy; OpenStreetMap contributors"

    }

).addTo(map);


map.setView(

    SETTINGS.initialCenter,

    SETTINGS.initialZoom

);


/* Клик по свободной карте снимает выделение */

map.on(

    "click",

    function () {

        clearRegionSelection();

    }

);


/* ============================================================
   7. СЛОИ
   ============================================================ */

const regionsLayer =
    L.layerGroup().addTo(map);

const flowsLayer =
    L.layerGroup().addTo(map);

const animationLayer =
    L.layerGroup().addTo(map);


/* ============================================================
   8. CSS
   ============================================================ */

injectStyles();


/* ============================================================
   9. ЗАПУСК
   ============================================================ */

document.addEventListener(

    "DOMContentLoaded",

    function () {

        createInterface();

        loadEverything();

    }

);


/* ============================================================
   10. СТИЛИ
   ============================================================ */

function injectStyles() {

    const style =
        document.createElement("style");

    style.id =
        "migration-map-styles";

    style.textContent = `

        #migration-controls {
            position: fixed;
            left: 50%;
            bottom: 15px;
            transform: translateX(-50%);
            z-index: 2000;

            width: min(1100px, calc(100vw - 30px));

            background: rgba(255,255,255,0.96);

            padding: 10px 14px;

            border-radius: 12px;

            box-shadow:
                0 3px 18px rgba(0,0,0,0.25);

            font-family:
                Arial, sans-serif;

            box-sizing: border-box;
        }

        .migration-toolbar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .migration-toolbar button {
            border: 1px solid #ccc;
            background: #fff;
            border-radius: 6px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 13px;
        }

        .migration-toolbar button:hover {
            background: #f1f1f1;
        }

        #yearButtons {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 3px;
        }

        .yearButton {
            min-width: 40px;
            padding: 5px 6px !important;
            font-size: 11px !important;
        }

        .yearButton.active {
            background: #333 !important;
            color: #fff !important;
            border-color: #333 !important;
        }

        .year-slider-container {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }

        #yearSlider {
            flex: 1;
            cursor: pointer;
        }

        #yearLabel {
            min-width: 45px;
            text-align: center;
            font-size: 16px;
        }

        .tables-container {
            display: flex;
            gap: 20px;
            margin-top: 12px;
            padding-top: 10px;

            border-top: 1px solid #ddd;

            max-height: 45vh;
            overflow: auto;
        }

        .table-column {
            flex: 1;
            min-width: 300px;
        }

        .table-column h3 {
            margin: 0 0 7px;
            font-size: 14px;
        }

        .migration-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }

        .migration-table th,
        .migration-table td {
            border: 1px solid #ddd;
            padding: 4px 6px;
        }

        .migration-table th {
            position: sticky;
            top: 0;
            background: #eee;
            text-align: left;
        }

        .migration-table th:last-child,
        .migration-table td:last-child {
            text-align: right;
        }

        .flowLegend {
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 1900;

            background: rgba(255,255,255,0.95);

            padding: 10px 12px;

            border-radius: 8px;

            box-shadow:
                0 2px 10px rgba(0,0,0,0.18);

            font-family:
                Arial, sans-serif;

            font-size: 12px;
        }

        .legendItem {
            display: flex;
            align-items: center;
            gap: 7px;
            margin: 4px 0;
        }

        .legendLine {
            width: 32px;
            height: 5px;
            border-radius: 5px;
        }

        .legendGradient {
            background:
                linear-gradient(
                    90deg,
                    ${SETTINGS.outgoingColor},
                    ${SETTINGS.transitionColor},
                    ${SETTINGS.incomingColor}
                );
        }

        .legendOutgoing {
            background:
                ${SETTINGS.outgoingColor};
        }

        .legendIncoming {
            background:
                ${SETTINGS.incomingColor};
        }

        @media (max-width: 700px) {

            .tables-container {
                flex-direction: column;
            }

            .table-column {
                min-width: auto;
            }

        }

    `;

    document.head.appendChild(style);

}


/* ============================================================
   11. ИНТЕРФЕЙС
   ============================================================ */

function createInterface() {

    let controls =
        document.getElementById(
            "migration-controls"
        );

    if (!controls) {

        controls =
            document.createElement("div");

        controls.id =
            "migration-controls";

        document.body.appendChild(
            controls
        );

    }


    controls.innerHTML = `

        <div class="migration-toolbar">

            <button id="prevYearBtn">
                ◀
            </button>

            <div id="yearButtons"></div>

            <button id="nextYearBtn">
                ▶
            </button>

            <button id="animationToggle">
                ▶ Запустить потоки
            </button>

            <button id="tablesToggle">
                Таблицы
            </button>

        </div>

        <div class="year-slider-container">

            <span>${SETTINGS.startYear}</span>

            <input
                id="yearSlider"
                type="range"
                min="${SETTINGS.startYear}"
                max="${SETTINGS.endYear}"
                step="1"
                value="${currentYear}"
            >

            <span>${SETTINGS.endYear}</span>

            <strong id="yearLabel">
                ${currentYear}
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


    const yearButtons =
        document.getElementById(
            "yearButtons"
        );


    YEARS.forEach(

        function (year) {

            const button =
                document.createElement("button");

            button.className =
                "yearButton";

            button.dataset.year =
                year;

            button.textContent =
                year;

            button.addEventListener(
                "click",
                function () {
                    setYear(year);
                }
            );

            yearButtons.appendChild(
                button
            );

        }

    );


    document
        .getElementById("prevYearBtn")
        .addEventListener(
            "click",
            function () {

                const index =
                    YEARS.indexOf(currentYear);

                if (index > 0) {

                    setYear(
                        YEARS[index - 1]
                    );

                }

            }
        );


    document
        .getElementById("nextYearBtn")
        .addEventListener(
            "click",
            function () {

                const index =
                    YEARS.indexOf(currentYear);

                if (
                    index <
                    YEARS.length - 1
                ) {

                    setYear(
                        YEARS[index + 1]
                    );

                }

            }
        );


    document
        .getElementById("yearSlider")
        .addEventListener(
            "input",
            function (event) {

                setYear(
                    Number(event.target.value)
                );

            }
        );


    document
        .getElementById("animationToggle")
        .addEventListener(
            "click",
            function () {

                if (animationRunning) {
                    stopFlowAnimation();
                }
                else {
                    startFlowAnimation();
                }

            }
        );


    document
        .getElementById("tablesToggle")
        .addEventListener(
            "click",
            toggleTables
        );


    createLegend();

}


/* ============================================================
   12. ЛЕГЕНДА
   ============================================================ */

function createLegend() {

    const old =
        document.querySelector(".flowLegend");

    if (old) {
        old.remove();
    }

    const legend =
        document.createElement("div");

    legend.className =
        "flowLegend";

    legend.innerHTML = `

        <div class="legendItem">
            <span class="legendLine legendGradient"></span>
            <span>Красный → синий</span>
        </div>

        <div class="legendItem">
            <span class="legendLine legendOutgoing"></span>
            <span>Исходящие</span>
        </div>

        <div class="legendItem">
            <span class="legendLine legendIncoming"></span>
            <span>Прибытие</span>
        </div>

    `;

    document.body.appendChild(
        legend
    );

}


/* ============================================================
   13. ЗАГРУЗКА
   ============================================================ */

async function loadEverything() {

    try {

        const [
            fromText,
            toText,
            nodesText,
            edgesText,
            geojson
        ] = await Promise.all([

            loadFirstAvailableText(
                FILES.migrationFrom
            ),

            loadFirstAvailableText(
                FILES.migrationTo
            ),

            loadFirstAvailableText(
                FILES.nodes
            ),

            loadFirstAvailableText(
                FILES.edges
            ),

            loadFirstAvailableJSON(
                FILES.geojson
            )

        ]);


        migrationFrom =
            parseMigrationFrom(
                fromText
            );

        migrationTo =
            parseMigrationTo(
                toText
            );

        prepareNodes(
            parseCSV(nodesText)
        );

        geojsonData =
            geojson;

        prepareRegions(
            geojsonData
        );

        prepareGraph(
            edgesText
        );

        prepareDestinationEdges();

        prepareSourceEdges();

        buildReverseGraph();

        drawRegions();

        calculateSegmentsForYear(
            currentYear
        );

        drawFlows();

        updateYearInterface();

        updateTables();

        fitMapToRegions();

        console.log(
            "Карта успешно загружена"
        );

    }
    catch (error) {

        console.error(
            error
        );

        showError(
            error.message
        );

    }

}


/* ============================================================
   14. ЗАГРУЗКА ТЕКСТОВОГО ФАЙЛА
   ============================================================ */

async function loadFirstAvailableText(paths) {

    let lastError = null;

    for (const path of paths) {

        try {

            const response =
                await fetch(path);

            if (response.ok) {

                console.log(
                    "Загружен:",
                    path
                );

                return await response.text();

            }

            lastError =
                new Error(
                    `${path}: HTTP ${response.status}`
                );

        }
        catch (error) {

            lastError =
                error;

        }

    }

    throw new Error(

        "Не удалось загрузить файл:\n" +
        paths.join("\n") +
        "\n\n" +
        (
            lastError
                ? lastError.message
                : ""
        )

    );

}


/* ============================================================
   15. GEOJSON
   ============================================================ */

async function loadFirstAvailableJSON(paths) {

    let lastError = null;

    for (const path of paths) {

        try {

            const response =
                await fetch(path);

            if (response.ok) {
                return await response.json();
            }

            lastError =
                new Error(
                    `${path}: HTTP ${response.status}`
                );

        }
        catch (error) {

            lastError =
                error;

        }

    }

    throw new Error(
        "Не удалось загрузить data.geojson: " +
        (
            lastError
                ? lastError.message
                : ""
        )
    );

}


/* ============================================================
   16. CSV
   ============================================================ */

function parseCSV(text) {

    text =
        String(text || "")
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");


    const lines =
        text
        .split("\n")
        .filter(
            line =>
                line.trim() !== ""
        );


    if (!lines.length) {
        return [];
    }


    const headers =
        parseCSVLine(lines[0])
        .map(clean);


    const result = [];


    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const values =
            parseCSVLine(
                lines[i]
            );

        const row = {};


        headers.forEach(
            function (header, index) {

                if (!header) {
                    return;
                }

                row[header] =
                    clean(
                        values[index] || ""
                    );

            }
        );


        result.push(row);

    }


    return result;

}


/* ============================================================
   17. CSV-СТРОКА
   ============================================================ */

function parseCSVLine(line) {

    const result = [];

    let current = "";
    let quoted = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char =
            line[i];


        if (char === '"') {

            quoted =
                !quoted;

            continue;

        }


        if (
            char === ";" &&
            !quoted
        ) {

            result.push(current);

            current = "";

        }
        else {

            current += char;

        }

    }


    result.push(current);

    return result;

}


/* ============================================================
   18. MIGRATION FROM
   ============================================================ */

function parseMigrationFrom(text) {

    const rows =
        parseCSV(text);

    const result = [];


    rows.forEach(
        function (row) {

            const origin =
                clean(row.Origin);

            const edge =
                clean(row.EDGE);

            if (!origin || !edge) {
                return;
            }


            const values = {};


            YEARS.forEach(
                function (year) {

                    values[year] =
                        parseNumber(
                            row[
                                `year_${year}`
                            ]
                        );

                }
            );


            result.push({

                origin,
                edge,
                values

            });

        }
    );


    return result;

}


/* ============================================================
   19. MIGRATION TO
   ============================================================ */

function parseMigrationTo(text) {

    const rows =
        parseCSV(text);

    const result = [];


    rows.forEach(
        function (row) {

            const destination =
                clean(
                    row.Destination ||
                    row.Destinatoin ||
                    row.destination ||
                    row.destinatoin
                );

            const edge =
                clean(row.EDGE);

            if (
                !destination ||
                !edge
            ) {
                return;
            }


            const values = {};


            YEARS.forEach(
                function (year) {

                    values[year] =
                        parseNumber(
                            row[
                                `year_${year}`
                            ]
                        );

                }
            );


            result.push({

                destination,
                edge,
                values

            });

        }
    );


    return result;

}


/* ============================================================
   20. NODES
   ============================================================ */

function prepareNodes(data) {

    nodes = {};


    data.forEach(
        function (row) {

            const id =
                clean(
                    row.NODE ||
                    row.id ||
                    row.Id ||
                    row.ID
                );


            if (!id) {
                return;
            }


            let lat =
                parseCoordinate(
                    row.LAT ??
                    row.lat
                );

            let lon =
                parseCoordinate(
                    row.LONG ??
                    row.lon ??
                    row.LON
                );


            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon)
            ) {
                return;
            }


            nodes[id] = {

                id,
                lat,
                lon

            };

        }
    );


    console.log(
        "Узлов:",
        Object.keys(nodes).length
    );

}


/* ============================================================
   21. РЕГИОНЫ
   ============================================================ */

function prepareRegions(geojson) {

    regions = {};


    if (
        !geojson ||
        !Array.isArray(
            geojson.features
        )
    ) {
        return;
    }


    geojson.features.forEach(
        function (feature) {

            const properties =
                feature.properties || {};

            const name =
                clean(
                    properties.prov_ENG ||
                    properties.name ||
                    properties.NAME ||
                    properties.Name
                );


            if (!name) {
                return;
            }


            regions[name] = {

                name,
                feature

            };

        }
    );


    console.log(
        "Регионов:",
        Object.keys(regions).length
    );

}


/* ============================================================
   22. ГРАФ EDGES
   ============================================================ */

function prepareGraph(text) {

    graph = {};
    routeCache = {};

    text =
        String(text || "")
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");


    const lines =
        text
        .split("\n")
        .filter(
            line =>
                line.trim() !== ""
        );


    lines.forEach(
        function (line) {

            const values =
                parseCSVLine(line)
                .map(clean);


            /*
             * Берём только N-узлы.
             *
             * Поэтому строка:
             *
             * N1;N2;...;Тургайская
             *
             * превращается в:
             *
             * N1 → N2 → ...
             *
             * Название региона в конце игнорируется.
             */

            const nodeValues =
                values.filter(
                    value =>
                        /^N\d+$/i.test(value)
                );


            if (
                nodeValues.length < 2
            ) {
                return;
            }


            for (
                let i = 0;
                i < nodeValues.length - 1;
                i++
            ) {

                addGraphEdge(
                    nodeValues[i],
                    nodeValues[i + 1]
                );

            }

        }
    );


    console.log(
        "Узлов графа:",
        Object.keys(graph).length
    );

}


/* ============================================================
   23. РЕБРО
   ============================================================ */

function addGraphEdge(from, to) {

    if (!graph[from]) {
        graph[from] = [];
    }


    if (
        !graph[from].includes(to)
    ) {

        graph[from].push(to);

    }

}


/* ============================================================
   24. EDGE НАЗНАЧЕНИЯ
   ============================================================ */

function prepareDestinationEdges() {

    destinationByEdge = {};


    migrationTo.forEach(
        function (item) {

            if (
                !destinationByEdge[item.edge]
            ) {

                destinationByEdge[item.edge] =
                    [];

            }


            destinationByEdge[item.edge]
                .push(item);

        }
    );

}


/* ============================================================
   25. EDGE ИСХОДА
   ============================================================ */

function prepareSourceEdges() {

    sourceByEdge = {};


    migrationFrom.forEach(
        function (item) {

            if (
                !sourceByEdge[item.edge]
            ) {

                sourceByEdge[item.edge] =
                    [];

            }


            sourceByEdge[item.edge]
                .push(item);

        }
    );

}


/* ============================================================
   26. ОБРАТНЫЙ ГРАФ
   ============================================================ */

function buildReverseGraph() {

    reverseGraph = {};


    Object.keys(graph).forEach(
        function (from) {

            graph[from].forEach(
                function (to) {

                    if (
                        !reverseGraph[to]
                    ) {

                        reverseGraph[to] = [];

                    }


                    if (
                        !reverseGraph[to]
                            .includes(from)
                    ) {

                        reverseGraph[to]
                            .push(from);

                    }

                }
            );

        }
    );

}


/* ============================================================
   27. СМЕНА ГОДА
   ============================================================ */

function setYear(year) {

    year =
        Number(year);


    if (
        !YEARS.includes(year)
    ) {
        return;
    }


    currentYear =
        year;


    /*
     * ВАЖНО:
     *
     * Здесь анимация НЕ выключается.
     *
     * Если она была запущена,
     * после перерисовки она продолжается.
     */

    calculateSegmentsForYear(
        currentYear
    );

    drawFlows();

    updateYearInterface();

    updateTables();

}


/* ============================================================
   28. ИНТЕРФЕЙС ГОДА
   ============================================================ */

function updateYearInterface() {

    document
        .querySelectorAll(".yearButton")
        .forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    Number(
                        button.dataset.year
                    ) === currentYear
                );

            }
        );


    const slider =
        document.getElementById(
            "yearSlider"
        );

    if (slider) {
        slider.value =
            currentYear;
    }


    const label =
        document.getElementById(
            "yearLabel"
        );

    if (label) {
        label.textContent =
            currentYear;
    }

}


/* ============================================================
   29. РАСЧЁТ СЕГМЕНТОВ
   ============================================================ */

function calculateSegmentsForYear(year) {

    outgoingSegments =
        buildOutgoingSegments(year);

    incomingSegments =
        buildIncomingSegments(year);

}


/* ============================================================
   30. ИСХОДЯЩИЕ ПОТОКИ
   ============================================================ */

function buildOutgoingSegments(year) {

    const segmentMap = {};


    migrationFrom.forEach(
        function (source) {

            const value =
                source.values[year] || 0;


            if (value <= 0) {
                return;
            }


            const routes =
                getRoutesFromEdge(
                    source.edge
                );


            if (!routes.length) {

                console.warn(
                    "Нет маршрута:",
                    source.origin,
                    source.edge
                );

                return;

            }


            const routeObjects = [];


            routes.forEach(
                function (route) {

                    route.destinations
                        .forEach(
                            function (destination) {

                                const destinationValue =
                                    destination.values[
                                        year
                                    ] || 0;


                                routeObjects.push({

                                    path:
                                        route.path,

                                    destination:
                                        destination.destination,

                                    destinationEdge:
                                        destination.edge,

                                    destinationValue

                                });

                            }
                        );

                }
            );


            /*
             * Если соответствующих конечных
             * регионов нет, рисуем поток
             * по найденным маршрутам целиком.
             */

            if (!routeObjects.length) {

                routes.forEach(
                    function (route) {

                        addSegment(
                            segmentMap,
                            route.path,
                            value,
                            "outgoing",
                            source.origin
                        );

                    }
                );

                return;

            }


            const totalDestination =
                routeObjects.reduce(
                    function (sum, item) {

                        return (
                            sum +
                            item.destinationValue
                        );

                    },
                    0
                );


            /*
             * Если в migration_to для года
             * нет чисел — распределяем поток
             * равномерно между маршрутами.
             */

            if (totalDestination <= 0) {

                const share =
                    value /
                    routeObjects.length;


                routeObjects.forEach(
                    function (route) {

                        addSegment(
                            segmentMap,
                            route.path,
                            share,
                            "outgoing",
                            source.origin
                        );

                    }
                );

            }
            else {

                /*
                 * ВАЖНО:
                 *
                 * Сам поток берём из migration_from.
                 *
                 * migration_to используется
                 * только для определения направления
                 * и пропорции.
                 */

                routeObjects.forEach(
                    function (route) {

                        const share =
                            value *
                            (
                                route.destinationValue /
                                totalDestination
                            );


                        addSegment(
                            segmentMap,
                            route.path,
                            share,
                            "outgoing",
                            source.origin
                        );

                    }
                );

            }

        }
    );


    return Object.values(
        segmentMap
    );

}


/* ============================================================
   31. ВХОДЯЩИЕ ПОТОКИ
   ============================================================ */

function buildIncomingSegments(year) {

    const segmentMap = {};


    migrationTo.forEach(
        function (destination) {

            const value =
                destination.values[year] || 0;


            if (value <= 0) {
                return;
            }


            const routes =
                getRoutesToEdge(
                    destination.edge
                );


            if (!routes.length) {

                console.warn(
                    "Нет входящего маршрута:",
                    destination.destination,
                    destination.edge
                );

                return;

            }


            /*
             * Если существует несколько
             * возможных входов,
             * делим входящий поток между ними.
             */

            const share =
                value /
                routes.length;


            routes.forEach(
                function (path) {

                    addSegment(
                        segmentMap,
                        path,
                        share,
                        "incoming",
                        destination.destination
                    );

                }
            );

        }
    );


    return Object.values(
        segmentMap
    );

}


/* ============================================================
   32. ДОБАВЛЕНИЕ СЕГМЕНТА
   ============================================================ */

function addSegment(
    segmentMap,
    path,
    value,
    type,
    name
) {

    if (
        !path ||
        path.length < 2 ||
        value <= 0
    ) {
        return;
    }


    const denominator =
        path.length - 1;


    for (
        let i = 0;
        i < denominator;
        i++
    ) {

        const from =
            path[i];

        const to =
            path[i + 1];

        const key =
            `${type}|${from}|${to}`;


        if (!segmentMap[key]) {

            segmentMap[key] = {

                from,
                to,

                value: 0,

                type,

                names: {},

                progressStartWeighted: 0,
                progressEndWeighted: 0,
                progressWeight: 0

            };

        }


        segmentMap[key].value +=
            value;


        segmentMap[key].names[name] =
            (
                segmentMap[key].names[name] ||
                0
            ) + value;


        const progressStart =
            i / denominator;

        const progressEnd =
            (i + 1) /
            denominator;


        segmentMap[key]
            .progressStartWeighted +=
                progressStart * value;


        segmentMap[key]
            .progressEndWeighted +=
                progressEnd * value;


        segmentMap[key]
            .progressWeight +=
                value;

    }


    /*
     * Рассчитываем положение каждого
     * сегмента внутри полного маршрута.
     */

    for (
        let i = 0;
        i < denominator;
        i++
    ) {

        const key =
            `${type}|${path[i]}|${path[i + 1]}`;

        const segment =
            segmentMap[key];


        if (
            segment &&
            segment.progressWeight > 0
        ) {

            segment.progressStart =
                segment.progressStartWeighted /
                segment.progressWeight;

            segment.progressEnd =
                segment.progressEndWeighted /
                segment.progressWeight;

        }

    }

}


/* ============================================================
   33. ПУТИ ОТ EDGE ИСХОДА
   ============================================================ */

function getRoutesFromEdge(startEdge) {

    const key =
        "FROM|" + startEdge;


    if (routeCache[key]) {
        return routeCache[key];
    }


    const result = [];


    walkForward(
        startEdge,
        [startEdge],
        new Set(),
        result
    );


    routeCache[key] =
        result;


    return result;

}


/* ============================================================
   34. ОБХОД ВПЕРЁД
   ============================================================ */

function walkForward(
    current,
    path,
    visited,
    result
) {

    if (
        visited.has(current)
    ) {
        return;
    }


    const nextVisited =
        new Set(visited);

    nextVisited.add(current);


    /*
     * Если узел является EDGE назначения,
     * запоминаем маршрут.
     *
     * Но НЕ останавливаем обход.
     *
     * Это критично для N189/N190,
     * которые могут быть промежуточными узлами.
     */

    const destinations =
        destinationByEdge[current] || [];


    if (destinations.length) {

        result.push({

            path: [...path],

            destinations

        });

    }


    const nextNodes =
        graph[current] || [];


    nextNodes.forEach(
        function (next) {

            walkForward(
                next,

                [
                    ...path,
                    next
                ],

                nextVisited,

                result
            );

        }
    );

}


/* ============================================================
   35. ПУТИ К EDGE НАЗНАЧЕНИЯ
   ============================================================ */

function getRoutesToEdge(destinationEdge) {

    const key =
        "TO|" + destinationEdge;


    if (routeCache[key]) {
        return routeCache[key];
    }


    const paths = [];


    walkBackward(
        destinationEdge,
        [destinationEdge],
        new Set(),
        paths
    );


    const result =
        paths.map(
            function (path) {

                return [
                    ...path
                ].reverse();

            }
        );


    routeCache[key] =
        result;


    return result;

}


/* ============================================================
   36. ОБХОД НАЗАД
   ============================================================ */

function walkBackward(
    current,
    path,
    visited,
    result
) {

    if (
        visited.has(current)
    ) {
        return;
    }


    const nextVisited =
        new Set(visited);

    nextVisited.add(current);


    const previous =
        reverseGraph[current] || [];


    if (!previous.length) {

        result.push(
            [...path]
        );

        return;

    }


    previous.forEach(
        function (previousNode) {

            walkBackward(

                previousNode,

                [
                    ...path,
                    previousNode
                ],

                nextVisited,

                result

            );

        }
    );

}


/* ============================================================
   37. РЕГИОНЫ
   ============================================================ */

function drawRegions() {

    regionsLayer.clearLayers();

    regionLayers = {};


    Object.values(regions)
        .forEach(
            function (region) {

                /*
                 * ВАЖНО:
                 *
                 * Никаких N-узлов здесь нет.
                 *
                 * Мы рисуем только GeoJSON-регионы.
                 */

                const layer =
                    L.geoJSON(
                        region.feature,
                        {

                            style:
                                getRegionStyle(
                                    region.name
                                )

                        }
                    );


                /*
                 * Tooltip только у региона.
                 *
                 * На потоки tooltip не ставится.
                 */

                layer.bindTooltip(
                    function () {

                        return createRegionTooltip(
                            region.name
                        );

                    },
                    {
                        sticky: true,
                        direction: "top"
                    }
                );


                layer.on(
                    "mouseover",
                    function () {

                        const style =
                            getRegionStyle(
                                region.name
                            );

                        layer.setStyle({

                            ...style,

                            weight:
                                style.weight + 0.8

                        });

                    }
                );


                layer.on(
                    "mouseout",
                    function () {

                        layer.setStyle(
                            getRegionStyle(
                                region.name
                            )
                        );

                    }
                );


                layer.on(
                    "click",
                    function (event) {

                        L.DomEvent
                            .stopPropagation(
                                event
                            );

                        selectRegion(
                            region.name
                        );

                    }
                );


                regionLayers[
                    region.name
                ] = layer;


                layer.addTo(
                    regionsLayer
                );

            }
        );

}


/* ============================================================
   38. ДАННЫЕ РЕГИОНА
   ============================================================ */

function getRegionYearValues(
    regionName
) {

    const normalized =
        normalizeName(
            regionName
        );


    const sourceValue =
        migrationFrom
            .filter(
                item =>
                    normalizeName(
                        item.origin
                    ) === normalized
            )
            .reduce(
                function (sum, item) {

                    return (
                        sum +
                        (
                            item.values[
                                currentYear
                            ] || 0
                        )
                    );

                },
                0
            );


    const destinationValue =
        migrationTo
            .filter(
                item =>
                    normalizeName(
                        item.destination
                    ) === normalized
            )
            .reduce(
                function (sum, item) {

                    return (
                        sum +
                        (
                            item.values[
                                currentYear
                            ] || 0
                        )
                    );

                },
                0
            );


    return {

        sourceValue,
        destinationValue

    };

}


/* ============================================================
   39. РОЛЬ РЕГИОНА
   ============================================================ */

function getRegionRole(
    regionName
) {

    const values =
        getRegionYearValues(
            regionName
        );


    if (
        values.sourceValue > 0 &&
        values.destinationValue > 0
    ) {
        return "both";
    }


    if (
        values.sourceValue > 0
    ) {
        return "source";
    }


    if (
        values.destinationValue > 0
    ) {
        return "destination";
    }


    return "none";

}


/* ============================================================
   40. КЛИК ПО РЕГИОНУ
   ============================================================ */

function selectRegion(
    regionName
) {

    /*
     * Повторный клик снимает выделение.
     */

    if (
        selectedRegion === regionName
    ) {

        clearRegionSelection();

        return;

    }


    selectedRegion =
        regionName;

    selectedRegionRole =
        getRegionRole(
            regionName
        );


    selectedSourceNames =
        new Set();

    selectedDestinationNames =
        new Set();


    const normalized =
        normalizeName(
            regionName
        );


    /*
     * ВЫБРАН РЕГИОН ИСХОДА
     */

    if (
        selectedRegionRole === "source" ||
        selectedRegionRole === "both"
    ) {

        migrationFrom
            .filter(
                item =>
                    normalizeName(
                        item.origin
                    ) === normalized
            )
            .forEach(
                function (source) {

                    selectedSourceNames.add(
                        normalizeName(
                            source.origin
                        )
                    );


                    const routes =
                        getRoutesFromEdge(
                            source.edge
                        );


                    routes.forEach(
                        function (route) {

                            (
                                route.destinations ||
                                []
                            )
                            .forEach(
                                function (destination) {

                                    const value =
                                        destination
                                            .values[
                                                currentYear
                                            ] || 0;


                                    if (
                                        value > 0
                                    ) {

                                        selectedDestinationNames
                                            .add(
                                                normalizeName(
                                                    destination.destination
                                                )
                                            );

                                    }

                                }
                            );

                        }
                    );

                }
            );

    }


    /*
     * ВЫБРАН РЕГИОН НАЗНАЧЕНИЯ
     */

    if (
        selectedRegionRole === "destination" ||
        selectedRegionRole === "both"
    ) {

        migrationTo
            .filter(
                item =>
                    normalizeName(
                        item.destination
                    ) === normalized
            )
            .forEach(
                function (destination) {

                    selectedDestinationNames.add(
                        normalizeName(
                            destination.destination
                        )
                    );


                    migrationFrom.forEach(
                        function (source) {

                            const routes =
                                getRoutesFromEdge(
                                    source.edge
                                );


                            const reaches =
                                routes.some(
                                    function (route) {

                                        return (
                                            route.destinations ||
                                            []
                                        )
                                        .some(
                                            function (item) {

                                                return (
                                                    normalizeName(
                                                        item.destination
                                                    ) ===
                                                    normalized
                                                );

                                            }
                                        );

                                    }
                                );


                            if (reaches) {

                                selectedSourceNames.add(
                                    normalizeName(
                                        source.origin
                                    )
                                );

                            }

                        }
                    );

                }
            );

    }


    updateRegionStyles();

}


/* ============================================================
   41. СБРОС ВЫДЕЛЕНИЯ
   ============================================================ */

function clearRegionSelection() {

    selectedRegion = null;

    selectedRegionRole = null;

    selectedSourceNames =
        new Set();

    selectedDestinationNames =
        new Set();

    updateRegionStyles();

}


/* ============================================================
   42. СТИЛЬ РЕГИОНА
   ============================================================ */

function getRegionStyle(
    regionName
) {

    const style = {

        color:
            SETTINGS.regionBorderColor,

        weight:
            0.8,

        fillColor:
            SETTINGS.regionFillColor,

        fillOpacity:
            SETTINGS.regionFillOpacity

    };


    if (!selectedRegion) {
        return style;
    }


    const normalized =
        normalizeName(
            regionName
        );


    /*
     * Красный — исход.
     */

    if (
        selectedSourceNames.has(
            normalized
        )
    ) {

        style.color =
            SETTINGS.selectedSourceColor;

        style.fillColor =
            SETTINGS.selectedSourceColor;

        style.fillOpacity =
            SETTINGS.selectedSourceOpacity;

        style.weight = 1.8;

    }


    /*
     * Синий — прибытие.
     */

    if (
        selectedDestinationNames.has(
            normalized
        )
    ) {

        style.color =
            SETTINGS.selectedDestinationColor;

        style.fillColor =
            SETTINGS.selectedDestinationColor;

        style.fillOpacity =
            SETTINGS.selectedDestinationOpacity;

        style.weight = 1.8;

    }


    /*
     * Если регион одновременно
     * источник и назначение — фиолетовый.
     */

    if (
        selectedRegion === regionName &&
        selectedRegionRole === "both"
    ) {

        style.color =
            SETTINGS.transitionColor;

        style.fillColor =
            SETTINGS.transitionColor;

        style.fillOpacity = 0.48;

        style.weight = 2;

    }


    return style;

}


/* ============================================================
   43. ОБНОВЛЕНИЕ РЕГИОНОВ
   ============================================================ */

function updateRegionStyles() {

    Object.entries(
        regionLayers
    )
    .forEach(
        function ([name, layer]) {

            layer.setStyle(
                getRegionStyle(name)
            );

        }
    );

}


/* ============================================================
   44. TOOLTIP РЕГИОНА
   ============================================================ */

function createRegionTooltip(
    regionName
) {

    /*
     * ВАЖНО:
     *
     * Здесь НЕТ расчётных потоков.
     *
     * Показываем только данные
     * из migration_from / migration_to.
     */

    const sourceItems =
        migrationFrom.filter(
            item =>
                normalizeName(
                    item.origin
                ) ===
                normalizeName(
                    regionName
                )
        );


    const destinationItems =
        migrationTo.filter(
            item =>
                normalizeName(
                    item.destination
                ) ===
                normalizeName(
                    regionName
                )
        );


    let html =
        `<b>${escapeHTML(
            regionName
        )}</b>`;


    sourceItems.forEach(
        function (item) {

            html +=
                `<br>Исходящие: ` +
                `<b>${formatNumber(
                    item.values[currentYear] || 0
                )}</b>`;

        }
    );


    destinationItems.forEach(
        function (item) {

            html +=
                `<br>Переселившиеся: ` +
                `<b>${formatNumber(
                    item.values[currentYear] || 0
                )}</b>`;

        }
    );


    if (
        sourceItems.length === 0 &&
        destinationItems.length === 0
    ) {

        html +=
            "<br>Нет данных";

    }


    return html;

}


/* ============================================================
   45. РИСОВАНИЕ ПОТОКОВ
   ============================================================ */

function drawFlows() {

    flowsLayer.clearLayers();


    drawSegmentCollection(
        outgoingSegments
    );


    drawSegmentCollection(
        incomingSegments
    );


    /*
     * Если анимация уже включена,
     * полностью пересоздаём штрихи
     * для нового года.
     *
     * Сама animationRunning остаётся true.
     */

    if (animationRunning) {

        createAnimationStrokes();

    }

}


/* ============================================================
   46. РИСОВАНИЕ СЕГМЕНТОВ
   ============================================================ */

function drawSegmentCollection(
    collection
) {

    collection.forEach(
        function (segment) {

            const from =
                getNodePoint(
                    segment.from
                );

            const to =
                getNodePoint(
                    segment.to
                );


            if (!from || !to) {
                return;
            }


            const points =
                createSmoothPath(
                    from,
                    to
                );


            const width =
                getFlowWidth(
                    segment.value
                );


            const startT =
                Number.isFinite(
                    segment.progressStart
                )
                    ? segment.progressStart
                    : 0;


            const endT =
                Number.isFinite(
                    segment.progressEnd
                )
                    ? segment.progressEnd
                    : 1;


            /*
             * Делим каждый геометрический
             * сегмент на маленькие части.
             *
             * Благодаря этому получается
             * плавный переход цвета.
             */

            for (
                let i = 0;
                i < points.length - 1;
                i++
            ) {

                const localT =
                    (
                        i + 0.5
                    ) /
                    (
                        points.length - 1
                    );


                const routeT =
                    startT +
                    (
                        endT -
                        startT
                    ) *
                    localT;


                const color =
                    getFlowColor(
                        segment.type,
                        routeT
                    );


                const line =
                    L.polyline(
                        [
                            points[i],
                            points[i + 1]
                        ],
                        {

                            color,

                            weight:
                                width,

                            opacity:
                                SETTINGS.flowOpacity,

                            lineCap:
                                "round",

                            lineJoin:
                                "round",

                            /*
                             * Поток кликабельный,
                             * но НЕ имеет tooltip.
                             */

                            interactive:
                                true

                        }
                    );


                /*
                 * Никакого bindTooltip /
                 * bindPopup здесь нет.
                 */

                line.on(
                    "click",
                    function (event) {

                        L.DomEvent
                            .stopPropagation(
                                event
                            );

                    }
                );


                line.addTo(
                    flowsLayer
                );

            }

        }
    );

}


/* ============================================================
   47. ЦВЕТ ПОТОКА
   ============================================================ */

function getFlowColor(
    type,
    t
) {

    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );


    if (
        type === "outgoing"
    ) {

        /*
         * Исходящий:
         *
         * красный → фиолетовый
         */

        return interpolateColor(
            SETTINGS.outgoingColor,
            SETTINGS.transitionColor,
            t
        );

    }


    /*
     * Входящий:
     *
     * фиолетовый → синий
     */

    return interpolateColor(
        SETTINGS.transitionColor,
        SETTINGS.incomingColor,
        t
    );

}


/* ============================================================
   48. ИНТЕРПОЛЯЦИЯ ЦВЕТА
   ============================================================ */

function interpolateColor(
    color1,
    color2,
    t
) {

    const a =
        hexToRgb(color1);

    const b =
        hexToRgb(color2);


    return `rgb(
        ${Math.round(
            a.r +
            (b.r - a.r) * t
        )},
        ${Math.round(
            a.g +
            (b.g - a.g) * t
        )},
        ${Math.round(
            a.b +
            (b.b - a.b) * t
        )}
    )`;

}


function hexToRgb(hex) {

    const value =
        String(hex)
        .replace("#", "");


    const normalized =
        value.length === 3
            ? value
                .split("")
                .map(
                    x => x + x
                )
                .join("")
            : value;


    return {

        r:
            parseInt(
                normalized.substring(0, 2),
                16
            ),

        g:
            parseInt(
                normalized.substring(2, 4),
                16
            ),

        b:
            parseInt(
                normalized.substring(4, 6),
                16
            )

    };

}


/* ============================================================
   49. КООРДИНАТЫ УЗЛА
   ============================================================ */

function getNodePoint(id) {

    const node =
        nodes[id];


    if (!node) {
        return null;
    }


    /*
     * Leaflet:
     *
     * [latitude, longitude]
     */

    return [
        node.lat,
        node.lon
    ];

}


/* ============================================================
   50. ТОЛЩИНА ПОТОКА
   ============================================================ */

function getFlowWidth(
    value
) {

    if (value <= 0) {
        return SETTINGS.minFlowWidth;
    }


    const width =
        SETTINGS.minFlowWidth +
        Math.log10(
            value + 1
        ) *
        3.3;


    return Math.min(
        SETTINGS.maxFlowWidth,
        width
    );

}


/* ============================================================
   51. ПЛАВНАЯ КРИВАЯ
   ============================================================ */

function createSmoothPath(
    from,
    to
) {

    const lat1 =
        from[0];

    const lon1 =
        from[1];

    const lat2 =
        to[0];

    const lon2 =
        to[1];


    const midLat =
        (
            lat1 +
            lat2
        ) / 2;


    const midLon =
        (
            lon1 +
            lon2
        ) / 2;


    const distance =
        Math.sqrt(
            Math.pow(
                lat2 - lat1,
                2
            ) +
            Math.pow(
                lon2 - lon1,
                2
            )
        );


    /*
     * Контрольная точка
     * создаёт лёгкую дугу.
     */

    const controlLat =
        midLat +
        distance *
        SETTINGS.curveFactor;


    const controlLon =
        midLon;


    const points = [];


    for (
        let i = 0;
        i <= SETTINGS.curveSteps;
        i++
    ) {

        const t =
            i /
            SETTINGS.curveSteps;

        const mt =
            1 - t;


        points.push([

            mt * mt * lat1 +
            2 * mt * t * controlLat +
            t * t * lat2,

            mt * mt * lon1 +
            2 * mt * t * controlLon +
            t * t * lon2

        ]);

    }


    return points;

}


/* ============================================================
   52. АНИМАЦИЯ
   ============================================================ */

function startFlowAnimation() {

    if (animationRunning) {
        return;
    }


    animationRunning =
        true;


    createAnimationStrokes();


    if (!animationFrame) {

        animationFrame =
            requestAnimationFrame(
                animateFlowStrokes
            );

    }


    updateAnimationButton();

}


function stopFlowAnimation() {

    animationRunning =
        false;


    if (animationFrame) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;

    }


    clearAnimationStrokes();

    updateAnimationButton();

}


function createAnimationStrokes() {

    clearAnimationStrokes();


    const allSegments = [

        ...outgoingSegments,

        ...incomingSegments

    ];


    allSegments.forEach(
        function (segment) {

            const from =
                getNodePoint(
                    segment.from
                );

            const to =
                getNodePoint(
                    segment.to
                );


            if (!from || !to) {
                return;
            }


            const points =
                createSmoothPath(
                    from,
                    to
                );


            const count =
                getStrokeCount(
                    segment.value
                );


            const startT =
                Number.isFinite(
                    segment.progressStart
                )
                    ? segment.progressStart
                    : 0;


            const endT =
                Number.isFinite(
                    segment.progressEnd
                )
                    ? segment.progressEnd
                    : 1;


            for (
                let i = 0;
                i < count;
                i++
            ) {

                const initialProgress =
                    i / count;


                const marker =
                    L.polyline(
                        [
                            points[0],
                            points[0]
                        ],
                        {

                            color:
                                getFlowColor(
                                    segment.type,
                                    startT
                                ),

                            weight:
                                SETTINGS.animationWidth,

                            opacity:
                                SETTINGS.animationOpacity,

                            lineCap:
                                "round",

                            lineJoin:
                                "round",

                            /*
                             * Анимационные штрихи
                             * полностью неинтерактивны.
                             *
                             * Поэтому при наведении
                             * ничего не появляется.
                             */

                            interactive:
                                false

                        }
                    );


                marker.addTo(
                    animationLayer
                );


                animationStrokes.push({

                    points,

                    progress:
                        initialProgress,

                    speed:
                        getStrokeSpeed(
                            segment.value
                        ),

                    marker,

                    type:
                        segment.type,

                    progressStart:
                        startT,

                    progressEnd:
                        endT

                });

            }

        }
    );

}


/* ============================================================
   53. КОЛИЧЕСТВО ШТРИХОВ
   ============================================================ */

function getStrokeCount(
    value
) {

    return Math.max(

        SETTINGS.minStrokes,

        Math.min(

            SETTINGS.maxStrokes,

            Math.round(
                Math.log10(
                    value + 1
                )
            )

        )

    );

}


/* ============================================================
   54. СКОРОСТЬ
   ============================================================ */

function getStrokeSpeed(
    value
) {

    /*
     * Скорость увеличена.
     *
     * Большие потоки немного быстрее,
     * чтобы движение было заметнее.
     */

    const multiplier =
        0.9 +
        Math.min(
            1.8,
            Math.log10(
                value + 1
            ) / 4
        );


    return (
        SETTINGS.animationSpeed *
        multiplier
    );

}


/* ============================================================
   55. ОЧИСТКА АНИМАЦИИ
   ============================================================ */

function clearAnimationStrokes() {

    animationLayer.clearLayers();

    animationStrokes = [];

}


/* ============================================================
   56. ЦИКЛ АНИМАЦИИ
   ============================================================ */

function animateFlowStrokes(
    timestamp
) {

    if (!animationRunning) {

        animationFrame = null;

        return;

    }


    animationStrokes.forEach(
        function (stroke) {

            stroke.progress +=
                stroke.speed;


            if (
                stroke.progress >= 1
            ) {

                stroke.progress -= 1;

            }


            let startProgress =
                stroke.progress -
                SETTINGS.strokeLength;


            if (
                startProgress < 0
            ) {

                startProgress += 1;

            }


            const start =
                getPositionOnPath(
                    stroke.points,
                    startProgress
                );


            const end =
                getPositionOnPath(
                    stroke.points,
                    stroke.progress
                );


            if (
                start &&
                end
            ) {

                stroke.marker.setLatLngs([
                    start,
                    end
                ]);


                const t =
                    stroke.progressStart +
                    (
                        stroke.progressEnd -
                        stroke.progressStart
                    ) *
                    stroke.progress;


                stroke.marker.setStyle({

                    color:
                        getFlowColor(
                            stroke.type,
                            t
                        )

                });

            }

        }
    );


    animationFrame =
        requestAnimationFrame(
            animateFlowStrokes
        );

}


/* ============================================================
   57. ТОЧКА НА КРИВОЙ
   ============================================================ */

function getPositionOnPath(
    points,
    progress
) {

    if (
        !points ||
        points.length < 2
    ) {
        return null;
    }


    progress =
        Math.max(
            0,
            Math.min(
                1,
                progress
            )
        );


    const position =
        progress *
        (
            points.length - 1
        );


    const index =
        Math.floor(
            position
        );


    const local =
        position -
        index;


    const p1 =
        points[
            Math.min(
                index,
                points.length - 1
            )
        ];


    const p2 =
        points[
            Math.min(
                index + 1,
                points.length - 1
            )
        ];


    return [

        p1[0] +
        (
            p2[0] -
            p1[0]
        ) *
        local,

        p1[1] +
        (
            p2[1] -
            p1[1]
        ) *
        local

    ];

}


/* ============================================================
   58. КНОПКА АНИМАЦИИ
   ============================================================ */

function updateAnimationButton() {

    const button =
        document.getElementById(
            "animationToggle"
        );


    if (!button) {
        return;
    }


    button.textContent =
        animationRunning
            ? "⏸ Остановить потоки"
            : "▶ Запустить потоки";

}


/* ============================================================
   59. ТАБЛИЦЫ
   ============================================================ */

function toggleTables() {

    tablesVisible =
        !tablesVisible;


    const container =
        document.getElementById(
            "tablesContainer"
        );


    const button =
        document.getElementById(
            "tablesToggle"
        );


    if (!container) {
        return;
    }


    container.style.display =
        tablesVisible
            ? "flex"
            : "none";


    if (button) {

        button.textContent =
            tablesVisible
                ? "Скрыть таблицы"
                : "Таблицы";

    }


    if (tablesVisible) {

        updateTables();

    }

}


/* ============================================================
   60. ТАБЛИЦЫ
   ============================================================ */

function updateTables() {

    if (!tablesVisible) {
        return;
    }


    createSourceTable();

    createDestinationTable();

}


/* ============================================================
   61. ТАБЛИЦА ИСХОДА
   ============================================================ */

function createSourceTable() {

    const container =
        document.getElementById(
            "sourceTable"
        );


    if (!container) {
        return;
    }


    const rows =
        migrationFrom
            .map(
                function (item) {

                    return {

                        name:
                            item.origin,

                        value:
                            item.values[
                                currentYear
                            ] || 0

                    };

                }
            )
            .filter(
                item =>
                    item.value > 0
            )
            .sort(
                function (a, b) {

                    return (
                        b.value -
                        a.value
                    );

                }
            );


    let html = `

        <table class="migration-table">

            <thead>

                <tr>
                    <th>Регион</th>
                    <th>Переселенцев</th>
                </tr>

            </thead>

            <tbody>

    `;


    rows.forEach(
        function (row) {

            html += `

                <tr>

                    <td>
                        ${escapeHTML(
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


    container.innerHTML =
        html;

}


/* ============================================================
   62. ТАБЛИЦА ПРИБЫТИЯ
   ============================================================ */

function createDestinationTable() {

    const container =
        document.getElementById(
            "destinationTable"
        );


    if (!container) {
        return;
    }


    const rows =
        migrationTo
            .map(
                function (item) {

                    return {

                        name:
                            item.destination,

                        value:
                            item.values[
                                currentYear
                            ] || 0

                    };

                }
            )
            .filter(
                item =>
                    item.value > 0
            )
            .sort(
                function (a, b) {

                    return (
                        b.value -
                        a.value
                    );

                }
            );


    let html = `

        <table class="migration-table">

            <thead>

                <tr>
                    <th>Регион</th>
                    <th>Переселенцев</th>
                </tr>

            </thead>

            <tbody>

    `;


    rows.forEach(
        function (row) {

            html += `

                <tr>

                    <td>
                        ${escapeHTML(
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


    container.innerHTML =
        html;

}


/* ============================================================
   63. МАСШТАБ
   ============================================================ */

function fitMapToRegions() {

    if (
        geojsonData &&
        geojsonData.features &&
        geojsonData.features.length
    ) {

        try {

            const layer =
                L.geoJSON(
                    geojsonData
                );


            const bounds =
                layer.getBounds();


            if (
                bounds.isValid()
            ) {

                map.fitBounds(
                    bounds,
                    {
                        padding: [
                            20,
                            20
                        ]
                    }
                );

                return;

            }

        }
        catch (error) {

            console.warn(
                "Ошибка определения границ",
                error
            );

        }

    }


    const points =
        Object.values(nodes)
            .map(
                function (node) {

                    return [
                        node.lat,
                        node.lon
                    ];

                }
            );


    if (points.length) {

        map.fitBounds(
            points,
            {
                padding: [
                    30,
                    30
                ]
            }
        );

    }

}


/* ============================================================
   64. СЛУЖЕБНЫЕ ФУНКЦИИ
   ============================================================ */

function clean(value) {

    return String(
        value ?? ""
    )
    .replace(
        /^\uFEFF/,
        ""
    )
    .trim();

}


function normalizeName(value) {

    return clean(value)
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );

}


function parseNumber(value) {

    const text =
        String(
            value ?? ""
        )
        .replace(
            /\s/g,
            ""
        )
        .replace(
            ",",
            "."
        );


    const number =
        Number(text);


    return Number.isFinite(number)
        ? number
        : 0;

}


function parseCoordinate(value) {

    let text =
        String(
            value ?? ""
        )
        .trim();


    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    /*
     * Исправляет координаты вида:
     *
     * 48.612383370883187,
     */

    text =
        text.replace(
            /,+$/,
            ""
        );


    /*
     * На случай десятичной запятой.
     */

    text =
        text.replace(
            ",",
            "."
        );


    return parseFloat(text);

}


function formatNumber(value) {

    return Math.round(
        Number(value) || 0
    )
    .toLocaleString(
        "ru-RU"
    );

}


function escapeHTML(text) {

    return String(
        text ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* ============================================================
   65. ОШИБКА
   ============================================================ */

function showError(message) {

    const old =
        document.getElementById(
            "migration-error"
        );

    if (old) {
        old.remove();
    }


    const div =
        document.createElement(
            "div"
        );


    div.id =
        "migration-error";


    div.style.position =
        "fixed";

    div.style.left =
        "50%";

    div.style.top =
        "50%";

    div.style.transform =
        "translate(-50%, -50%)";

    div.style.zIndex =
        "9999";

    div.style.background =
        "#fff";

    div.style.padding =
        "25px";

    div.style.borderRadius =
        "10px";

    div.style.boxShadow =
        "0 3px 20px rgba(0,0,0,0.3)";

    div.style.maxWidth =
        "700px";

    div.style.fontFamily =
        "Arial, sans-serif";


    div.innerHTML = `

        <h3>
            Ошибка загрузки карты
        </h3>

        <pre
            style="
                white-space:pre-wrap;
                color:#a00;
            "
        >${escapeHTML(
            message
        )}</pre>

    `;


    document.body.appendChild(
        div
    );

}
