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

    /* Исходящие — КРАСНЫЕ */
    outgoingColor: "#d32f2f",

    /* Входящие — СИНИЕ */
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
            [
                type,
                from,
                to
            ].join("|");


        if (!segmentMap[key]) {

            segmentMap[key] = {

                from,
                to,

                value: 0,

                type,

                names: new Set()

            };

        }


        segmentMap[key].value +=
            value /
            denominator;


        if (name) {

            segmentMap[key].names.add(
                name
            );

        }

    }

}


/* ============================================================
   33. МАРШРУТЫ ОТ EDGE
   ============================================================ */

function getRoutesFromEdge(edge) {

    edge =
        clean(edge);


    if (!edge) {
        return [];
    }


    const cacheKey =
        "FROM|" + edge;


    if (
        routeCache[cacheKey]
    ) {

        return routeCache[
            cacheKey
        ];

    }


    const startNode =
        edge;


    if (!nodes[startNode]) {

        routeCache[cacheKey] =
            [];

        return [];

    }


    const destinations =
        destinationByEdge[edge] || [];


    const results = [];


    /*
     * Ищем пути от исходного EDGE
     * до EDGE назначения.
     */

    destinations.forEach(
        function (destination) {

            const paths =
                findAllForwardPaths(
                    startNode,
                    destination.edge
                );


            paths.forEach(
                function (path) {

                    results.push({

                        path,

                        destinations: [
                            destination
                        ]

                    });

                }
            );

        }
    );


    /*
     * Если конечных регионов на этом EDGE
     * нет, ищем все доступные выходы.
     */

    if (!destinations.length) {

        const paths =
            findForwardPathsToAnyDestination(
                startNode
            );


        paths.forEach(
            function (path) {

                results.push({

                    path,

                    destinations: []

                });

            }
        );

    }


    routeCache[cacheKey] =
        results;


    return results;

}


/* ============================================================
   34. МАРШРУТЫ К EDGE
   ============================================================ */

function getRoutesToEdge(edge) {

    edge =
        clean(edge);


    if (!edge) {
        return [];
    }


    const cacheKey =
        "TO|" + edge;


    if (
        routeCache[cacheKey]
    ) {

        return routeCache[
            cacheKey
        ];

    }


    const startNodes =
        Object.keys(sourceByEdge);


    const results = [];


    startNodes.forEach(
        function (sourceEdge) {

            const paths =
                findAllForwardPaths(
                    sourceEdge,
                    edge
                );


            paths.forEach(
                function (path) {

                    results.push(path);

                }
            );

        }
    );


    routeCache[cacheKey] =
        results;


    return results;

}


/* ============================================================
   35. ПРЯМОЙ ПОИСК ПУТИ
   ============================================================ */

function findAllForwardPaths(
    start,
    target
) {

    start =
        clean(start);

    target =
        clean(target);


    if (
        !start ||
        !target ||
        !nodes[start] ||
        !nodes[target]
    ) {
        return [];
    }


    if (start === target) {

        return [
            [start]
        ];

    }


    const results = [];

    const visited =
        new Set([
            start
        ]);


    function dfs(
        current,
        path
    ) {

        if (
            path.length >
            Object.keys(nodes).length
        ) {
            return;
        }


        const nextNodes =
            graph[current] || [];


        for (
            const next of nextNodes
        ) {

            if (
                visited.has(next)
            ) {
                continue;
            }


            const nextPath =
                [
                    ...path,
                    next
                ];


            if (
                next === target
            ) {

                results.push(
                    nextPath
                );

                continue;

            }


            visited.add(next);

            dfs(
                next,
                nextPath
            );

            visited.delete(next);

        }

    }


    dfs(
        start,
        [start]
    );


    return results;

}


/* ============================================================
   36. ПУТИ ДО ЛЮБОГО НАЗНАЧЕНИЯ
   ============================================================ */

function findForwardPathsToAnyDestination(
    start
) {

    const results = [];

    const destinationEdges =
        new Set(
            Object.keys(
                destinationByEdge
            )
        );


    const visited =
        new Set([
            start
        ]);


    function dfs(
        current,
        path
    ) {

        if (
            path.length >
            Object.keys(nodes).length
        ) {
            return;
        }


        if (
            destinationEdges.has(
                current
            ) &&
            path.length > 1
        ) {

            results.push(
                path
            );

        }


        const nextNodes =
            graph[current] || [];


        for (
            const next of nextNodes
        ) {

            if (
                visited.has(next)
            ) {
                continue;
            }


            visited.add(next);

            dfs(
                next,
                [
                    ...path,
                    next
                ]
            );

            visited.delete(next);

        }

    }


    dfs(
        start,
        [start]
    );


    return results;

}


/* ============================================================
   37. РЕГИОНЫ
   ============================================================ */

function drawRegions() {

    regionsLayer.clearLayers();

    regionLayers = {};


    Object.keys(regions)
        .forEach(
            function (name) {

                const region =
                    regions[name];


                const layer =
                    L.geoJSON(
                        region.feature,
                        {

                            style:
                                function () {

                                    return {

                                        color:
                                            SETTINGS.regionBorderColor,

                                        weight: 1,

                                        fillColor:
                                            SETTINGS.regionFillColor,

                                        fillOpacity:
                                            SETTINGS.regionFillOpacity

                                    };

                                },

                            onEachFeature:
                                function (
                                    feature,
                                    layer
                                ) {

                                    layer.on({

                                        mouseover:
                                            function () {

                                                updateRegionHover(
                                                    name
                                                );

                                            },

                                        mouseout:
                                            function () {

                                                clearRegionHover();

                                            },

                                        click:
                                            function (
                                                event
                                            ) {

                                                L.DomEvent.stopPropagation(
                                                    event
                                                );

                                                selectRegion(
                                                    name
                                                );

                                            }

                                    });

                                }

                        }
                    );


                layer.addTo(
                    regionsLayer
                );


                regionLayers[name] =
                    layer;

            }
        );

}


/* ============================================================
   38. HOVER РЕГИОНА
   ============================================================ */

function updateRegionHover(
    name
) {

    const source =
        migrationFrom.find(
            item =>
                normalizeName(
                    item.origin
                ) ===
                normalizeName(name)
        );


    const destination =
        migrationTo.find(
            item =>
                normalizeName(
                    item.destination
                ) ===
                normalizeName(name)
        );


    let text =
        `<strong>${escapeHTML(name)}</strong>`;


    if (source) {

        text +=
            `<br>Исход: ${formatNumber(
                source.values[currentYear] || 0
            )}`;

    }


    if (destination) {

        text +=
            `<br>Прибытие: ${formatNumber(
                destination.values[currentYear] || 0
            )}`;

    }


    const layer =
        regionLayers[name];


    if (layer) {

        layer.bindTooltip(
            text,
            {
                sticky: true,
                direction: "top"
            }
        );

        layer.openTooltip();

    }

}


/* ============================================================
   39. ОЧИСТКА HOVER
   ============================================================ */

function clearRegionHover() {

    Object.values(
        regionLayers
    ).forEach(
        function (layer) {

            try {

                layer.closeTooltip();

            }
            catch (error) {}

        }
    );

}


/* ============================================================
   40. ВЫБОР РЕГИОНА
   ============================================================ */

function selectRegion(
    name
) {

    selectedRegion =
        name;


    const source =
        migrationFrom.some(
            item =>
                normalizeName(
                    item.origin
                ) ===
                normalizeName(name)
        );


    const destination =
        migrationTo.some(
            item =>
                normalizeName(
                    item.destination
                ) ===
                normalizeName(name)
        );


    if (source) {

        selectedRegionRole =
            "source";

        selectedSourceNames =
            new Set([
                name
            ]);

    }
    else if (destination) {

        selectedRegionRole =
            "destination";

        selectedDestinationNames =
            new Set([
                name
            ]);

    }
    else {

        selectedRegionRole =
            null;

    }


    updateRegionStyles();

}


/* ============================================================
   41. СТИЛИ ВЫДЕЛЕНИЯ
   ============================================================ */

function updateRegionStyles() {

    Object.keys(
        regionLayers
    ).forEach(
        function (name) {

            const layer =
                regionLayers[name];


            let fillColor =
                SETTINGS.regionFillColor;

            let fillOpacity =
                SETTINGS.regionFillOpacity;


            if (
                selectedSourceNames.has(
                    name
                )
            ) {

                fillColor =
                    SETTINGS.selectedSourceColor;

                fillOpacity =
                    SETTINGS.selectedSourceOpacity;

            }


            if (
                selectedDestinationNames.has(
                    name
                )
            ) {

                fillColor =
                    SETTINGS.selectedDestinationColor;

                fillOpacity =
                    SETTINGS.selectedDestinationOpacity;

            }


            layer.setStyle({

                color:
                    SETTINGS.regionBorderColor,

                weight: 1,

                fillColor,

                fillOpacity

            });

        }
    );

}


/* ============================================================
   42. ОЧИСТКА ВЫДЕЛЕНИЯ
   ============================================================ */

function clearRegionSelection() {

    selectedRegion =
        null;

    selectedRegionRole =
        null;

    selectedSourceNames.clear();

    selectedDestinationNames.clear();

    updateRegionStyles();

}


/* ============================================================
   43. ПОТОКИ
   ============================================================ */

function drawFlows() {

    flowsLayer.clearLayers();

    clearAnimationStrokes();


    drawSegmentCollection(
        outgoingSegments
    );


    drawSegmentCollection(
        incomingSegments
    );


    if (animationRunning) {

        createAnimationStrokes();

    }

}


/* ============================================================
   44. ОТРИСОВКА СЕГМЕНТОВ
   ============================================================ */

function drawSegmentCollection(
    segments
) {

    segments.forEach(
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


            if (
                !points ||
                points.length < 2
            ) {
                return;
            }


            /*
             * НИКАКОГО ГРАДИЕНТА.
             *
             * Исходящие всегда красные.
             * Входящие всегда синие.
             */

            const color =
                segment.type === "outgoing"
                    ? SETTINGS.outgoingColor
                    : SETTINGS.incomingColor;


            const width =
                getFlowWidth(
                    segment.value
                );


            const line =
                L.polyline(
                    points,
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

                        interactive:
                            false

                    }
                );


            line.addTo(
                flowsLayer
            );

        }
    );

}


/* ============================================================
   45. ТОЧКА УЗЛА
   ============================================================ */

function getNodePoint(
    nodeId
) {

    const node =
        nodes[nodeId];


    if (!node) {
        return null;
    }


    return [
        node.lat,
        node.lon
    ];

}


/* ============================================================
   46. ПЛАВНАЯ ЛИНИЯ
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


    const dx =
        lon2 - lon1;

    const dy =
        lat2 - lat1;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (distance === 0) {

        return [
            from,
            to
        ];

    }


    const normalX =
        -dy / distance;

    const normalY =
        dx / distance;


    const offset =
        distance *
        SETTINGS.curveFactor;


    const control = [

        (
            lat1 +
            lat2
        ) / 2 +
        normalY * offset,

        (
            lon1 +
            lon2
        ) / 2 +
        normalX * offset

    ];


    const points = [];


    for (
        let i = 0;
        i <= SETTINGS.curveSteps;
        i++
    ) {

        const t =
            i /
            SETTINGS.curveSteps;


        const oneMinus =
            1 - t;


        const lat =
            oneMinus *
            oneMinus *
            lat1 +

            2 *
            oneMinus *
            t *
            control[0] +

            t *
            t *
            lat2;


        const lon =
            oneMinus *
            oneMinus *
            lon1 +

            2 *
            oneMinus *
            t *
            control[1] +

            t *
            t *
            lon2;


        points.push([
            lat,
            lon
        ]);

    }


    return points;

}


/* ============================================================
   47. ТОЛЩИНА ПОТОКА
   ============================================================ */

function getFlowWidth(
    value
) {

    const number =
        Math.max(
            0,
            Number(value) || 0
        );


    if (number <= 0) {
        return SETTINGS.minFlowWidth;
    }


    /*
     * Логарифмическое масштабирование:
     * небольшие потоки остаются видимыми,
     * большие не перекрывают всю карту.
     */

    const log =
        Math.log10(
            number + 1
        );


    const maxLog =
        Math.log10(
            100000 + 1
        );


    const normalized =
        Math.min(
            1,
            log / maxLog
        );


    return (
        SETTINGS.minFlowWidth +
        normalized *
        (
            SETTINGS.maxFlowWidth -
            SETTINGS.minFlowWidth
        )
    );

}


/* ============================================================
   48. ЦВЕТ ПО НАПРАВЛЕНИЮ
   ============================================================ */

function getFlowColor(
    type
) {

    return type === "outgoing"
        ? SETTINGS.outgoingColor
        : SETTINGS.incomingColor;

}


/* ============================================================
   49. АНИМАЦИЯ — ЗАПУСК
   ============================================================ */

function startFlowAnimation() {

    animationRunning =
        true;


    if (!animationStrokes.length) {

        createAnimationStrokes();

    }


    if (!animationFrame) {

        animationFrame =
            requestAnimationFrame(
                animateFlowStrokes
            );

    }


    updateAnimationButton();

}


/* ============================================================
   50. АНИМАЦИЯ — ОСТАНОВКА
   ============================================================ */

function stopFlowAnimation() {

    animationRunning =
        false;


    if (animationFrame) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame =
            null;

    }


    clearAnimationStrokes();

    updateAnimationButton();

}


/* ============================================================
   51. СОЗДАНИЕ АНИМАЦИОННЫХ ШТРИХОВ
   ============================================================ */

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


            for (
                let i = 0;
                i < count;
                i++
            ) {

                const initialProgress =
                    i /
                    count;


                /*
                 * Один фиксированный цвет
                 * на весь анимационный штрих.
                 */

                const color =
                    segment.type === "outgoing"
                        ? SETTINGS.outgoingColor
                        : SETTINGS.incomingColor;


                const marker =
                    L.polyline(
                        [
                            points[0],
                            points[0]
                        ],
                        {

                            color,

                            weight:
                                SETTINGS.animationWidth,

                            opacity:
                                SETTINGS.animationOpacity,

                            lineCap:
                                "round",

                            lineJoin:
                                "round",

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
                        segment.type

                });

            }

        }
    );

}


/* ============================================================
   52. КОЛИЧЕСТВО ШТРИХОВ
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
   53. СКОРОСТЬ
   ============================================================ */

function getStrokeSpeed(
    value
) {

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
   54. ОЧИСТКА АНИМАЦИИ
   ============================================================ */

function clearAnimationStrokes() {

    animationLayer.clearLayers();

    animationStrokes = [];

}


/* ============================================================
   55. ЦИКЛ АНИМАЦИИ
   ============================================================ */

function animateFlowStrokes(
    timestamp
) {

    if (!animationRunning) {

        animationFrame =
            null;

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

            }

        }
    );


    animationFrame =
        requestAnimationFrame(
            animateFlowStrokes
        );

}


/* ============================================================
   56. ТОЧКА НА КРИВОЙ
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
   57. КНОПКА АНИМАЦИИ
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
   58. ТАБЛИЦЫ
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
   59. ТАБЛИЦЫ
   ============================================================ */

function updateTables() {

    if (!tablesVisible) {
        return;
    }


    createSourceTable();

    createDestinationTable();

}


/* ============================================================
   60. ТАБЛИЦА ИСХОДА
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
   61. ТАБЛИЦА ПРИБЫТИЯ
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
   62. МАСШТАБ
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
   63. СЛУЖЕБНЫЕ ФУНКЦИИ
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
   64. ОШИБКА
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
