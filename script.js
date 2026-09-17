/* ============================================================
   ИНТЕРАКТИВНАЯ КАРТА МИГРАЦИЙ 1896–1916
   ============================================================

   ФАЙЛЫ:

   data/migration_from.csv
   Origin;EDGE;year_1896;...;year_1916

   data/migration_to.csv
   Destinatoin;EDGE;year_1896;...;year_1916

   data/NODES.csv
   id;lat;lon

   data/EDGES.csv
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

    /* --------------------------------------------------------
       АНИМАЦИЯ leaflet-ant-path
       -------------------------------------------------------- */

    antPathDelay: 75,

    antPathDashArray: [10, 22],

    antPathPulseColor: "#ffffff",

    antPathHardwareAccelerated: true,

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

let animationRunning = true;

/*
   Вместо старого requestAnimationFrame
   используем leaflet-ant-path.
*/
let antPaths = [];

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

            width: min(
                1100px,
                calc(100vw - 30px)
            );

            background:
                rgba(255,255,255,0.96);

            padding:
                10px 14px;

            border-radius: 12px;

            box-shadow:
                0 3px 18px rgba(0,0,0,0.25);

            font-family:
                Arial, sans-serif;

            box-sizing:
                border-box;

        }


        .migration-toolbar {

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 6px;

            flex-wrap: wrap;

        }


        .migration-toolbar button {

            border:
                1px solid #ccc;

            background:
                #fff;

            border-radius:
                6px;

            padding:
                6px 10px;

            cursor:
                pointer;

            font-size:
                13px;

        }


        .migration-toolbar button:hover {

            background:
                #f1f1f1;

        }


        #yearButtons {

            display: flex;

            flex-wrap: wrap;

            justify-content: center;

            gap: 3px;

        }


        .yearButton {

            min-width:
                40px;

            padding:
                5px 6px !important;

            font-size:
                11px !important;

        }


        .yearButton.active {

            background:
                #333 !important;

            color:
                #fff !important;

            border-color:
                #333 !important;

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

            min-width:
                45px;

            text-align:
                center;

            font-size:
                16px;

        }


        .tables-container {

            display: flex;

            gap: 20px;

            margin-top: 12px;

            padding-top: 10px;

            border-top:
                1px solid #ddd;

            max-height:
                45vh;

            overflow:
                auto;

        }


        .table-column {

            flex: 1;

            min-width:
                300px;

        }


        .table-column h3 {

            margin:
                0 0 7px;

            font-size:
                14px;

        }


        .migration-table {

            width:
                100%;

            border-collapse:
                collapse;

            font-size:
                11px;

        }


        .migration-table th,
        .migration-table td {

            border:
                1px solid #ddd;

            padding:
                4px 6px;

        }


        .migration-table th {

            position:
                sticky;

            top:
                0;

            background:
                #eee;

            text-align:
                left;

        }


        .migration-table th:last-child,
        .migration-table td:last-child {

            text-align:
                right;

        }


        .flowLegend {

            position:
                fixed;

            top:
                12px;

            right:
                12px;

            z-index:
                1900;

            background:
                rgba(255,255,255,0.95);

            padding:
                10px 12px;

            border-radius:
                8px;

            box-shadow:
                0 2px 10px rgba(0,0,0,0.18);

            font-family:
                Arial, sans-serif;

            font-size:
                12px;

        }


        .legendItem {

            display:
                flex;

            align-items:
                center;

            gap:
                7px;

            margin:
                4px 0;

        }


        .legendLine {

            width:
                32px;

            height:
                5px;

            border-radius:
                5px;

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

                flex-direction:
                    column;

            }


            .table-column {

                min-width:
                    auto;

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
                ❚❚ Остановить потоки
            </button>

            <button id="tablesToggle">
                Таблицы
            </button>

        </div>


        <div class="year-slider-container">

            <span>
                ${SETTINGS.startYear}
            </span>

            <input
                id="yearSlider"
                type="range"
                min="${SETTINGS.startYear}"
                max="${SETTINGS.endYear}"
                step="1"
                value="${currentYear}"
            >

            <span>
                ${SETTINGS.endYear}
            </span>

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
        document.querySelector(
            ".flowLegend"
        );


    if (old) {

        old.remove();

    }


    const legend =
        document.createElement("div");


    legend.className =
        "flowLegend";


    legend.innerHTML = `

        <div class="legendItem">

            <span
                class="legendLine legendGradient"
            ></span>

            <span>
                Красный → синий
            </span>

        </div>


        <div class="legendItem">

            <span
                class="legendLine legendOutgoing"
            ></span>

            <span>
                Исходящие
            </span>

        </div>


        <div class="legendItem">

            <span
                class="legendLine legendIncoming"
            ></span>

            <span>
                Прибытие
            </span>

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
            parseCSVLine(lines[i]);


        const row = {};


        headers.forEach(

            function (header, index) {

                row[header] =
                    clean(values[index]);

            }

        );


        result.push(row);

    }


    return result;

}


/* ============================================================
   17. РАЗБОР СТРОКИ CSV
   ============================================================ */

function parseCSVLine(line) {

    const result = [];

    let current = "";

    let inQuotes = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char =
            line[i];


        if (char === '"') {

            if (
                inQuotes &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            }

            else {

                inQuotes =
                    !inQuotes;

            }

        }

        else if (
            char === ";" &&
            !inQuotes
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
   18. ОЧИСТКА
   ============================================================ */

function clean(value) {

    return String(value ?? "")
        .replace(/^\uFEFF/, "")
        .trim();

}


/* ============================================================
   19. MIGRATION FROM
   ============================================================ */

function parseMigrationFrom(text) {

    const rows =
        parseCSV(text);


    return rows
        .map(

            function (row) {

                const origin =
                    clean(
                        row.Origin
                    );


                const edge =
                    clean(
                        row.EDGE
                    );


                if (
                    !origin ||
                    !edge
                ) {

                    return null;

                }


                const years = {};


                YEARS.forEach(

                    function (year) {

                        const key =
                            `year_${year}`;


                        years[year] =
                            parseNumber(
                                row[key]
                            );

                    }

                );


                return {

                    name:
                        removeCsvExtension(
                            origin
                        ),

                    edge,

                    years

                };

            }

        )
        .filter(Boolean);

}


/* ============================================================
   20. MIGRATION TO
   ============================================================ */

function parseMigrationTo(text) {

    const rows =
        parseCSV(text);


    return rows
        .map(

            function (row) {

                const destination =
                    clean(
                        row.Destinatoin ||
                        row.Destination ||
                        row.Destinition
                    );


                const edge =
                    clean(
                        row.EDGE
                    );


                if (
                    !destination ||
                    !edge
                ) {

                    return null;

                }


                const years = {};


                YEARS.forEach(

                    function (year) {

                        const key =
                            `year_${year}`;


                        years[year] =
                            parseNumber(
                                row[key]
                            );

                    }

                );


                return {

                    name:
                        removeCsvExtension(
                            destination
                        ),

                    edge,

                    years

                };

            }

        )
        .filter(Boolean);

}


/* ============================================================
   21. ЧИСЛА
   ============================================================ */

function parseNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(
            String(value)
                .replace(",", ".")
                .replace(/\s/g, "")
        );


    return Number.isFinite(number)
        ? number
        : 0;

}


/* ============================================================
   22. УДАЛЕНИЕ .CSV
   ============================================================ */

function removeCsvExtension(name) {

    return String(name || "")
        .replace(/\.csv$/i, "")
        .trim();

}


/* ============================================================
   23. NODES
   ============================================================ */

function prepareNodes(rows) {

    nodes = {};


    rows.forEach(

        function (row) {

            const id =
                clean(row.id);


            if (!id) {

                return;

            }


            const lat =
                parseNumber(
                    clean(row.lat)
                );


            const lon =
                parseNumber(
                    clean(row.lon)
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

}


/* ============================================================
   24. GEOJSON РЕГИОНЫ
   ============================================================ */

function prepareRegions(data) {

    regions = {};


    if (
        !data ||
        !Array.isArray(data.features)
    ) {

        return;

    }


    data.features.forEach(

        function (feature) {

            if (
                !feature ||
                !feature.properties
            ) {

                return;

            }


            const name =
                clean(
                    feature.properties.prov_ENG
                );


            if (!name) {

                return;

            }


            regions[name] =
                feature;

        }

    );

}


/* ============================================================
   25. ГРАФ
   ============================================================ */

function prepareGraph(text) {

    graph = {};


    const rows =
        parseCSV(text);


    rows.forEach(

        function (row) {

            const from =
                clean(
                    row.from ||
                    row.FROM ||
                    row.EDGE
                );


            if (!from) {

                return;

            }


            if (!graph[from]) {

                graph[from] = [];

            }


            Object.keys(row)
                .forEach(

                    function (key) {

                        if (
                            key === "from" ||
                            key === "FROM" ||
                            key === "EDGE"
                        ) {

                            return;

                        }


                        const to =
                            clean(row[key]);


                        if (
                            !to ||
                            to === from
                        ) {

                            return;

                        }


                        if (
                            !graph[from]
                                .includes(to)
                        ) {

                            graph[from]
                                .push(to);

                        }

                    }

                );

        }

    );

}


/* ============================================================
   26. ОБРАТНЫЙ ГРАФ
   ============================================================ */

function buildReverseGraph() {

    reverseGraph = {};


    Object.keys(graph)
        .forEach(

            function (from) {

                graph[from]
                    .forEach(

                        function (to) {

                            if (
                                !reverseGraph[to]
                            ) {

                                reverseGraph[to] =
                                    [];

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
   27. EDGE → DESTINATION
   ============================================================ */

function prepareDestinationEdges() {

    destinationByEdge = {};


    migrationTo.forEach(

        function (item) {

            destinationByEdge[
                item.edge
            ] = item.name;

        }

    );

}


/* ============================================================
   28. EDGE → SOURCE
   ============================================================ */

function prepareSourceEdges() {

    sourceByEdge = {};


    migrationFrom.forEach(

        function (item) {

            sourceByEdge[
                item.edge
            ] = item.name;

        }

    );

}


/* ============================================================
   29. РЕГИОНЫ
   ============================================================ */

function drawRegions() {

    regionsLayer.clearLayers();


    regionLayers = {};


    Object.keys(regions)
        .forEach(

            function (name) {

                const feature =
                    regions[name];


                const layer =
                    L.geoJSON(

                        feature,

                        {

                            style:
                                function () {

                                    return {

                                        color:
                                            SETTINGS.regionBorderColor,

                                        weight:
                                            0.8,

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

                                    layer.on(

                                        {

                                            mouseover:
                                                function () {

                                                    showRegionValue(
                                                        name
                                                    );

                                                },

                                            mouseout:
                                                function () {

                                                    hideRegionValue();

                                                },

                                            click:
                                                function (
                                                    event
                                                ) {

                                                    L.DomEvent
                                                        .stopPropagation(
                                                            event
                                                        );


                                                    selectRegion(
                                                        name
                                                    );

                                                }

                                        }

                                    );

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
   30. HOVER РЕГИОНА
   ============================================================ */

let regionHoverTooltip = null;


function showRegionValue(name) {

    const source =
        migrationFrom.find(
            item =>
                item.name === name
        );


    const destination =
        migrationTo.find(
            item =>
                item.name === name
        );


    let html =
        `<strong>${escapeHtml(name)}</strong>`;


    if (source) {

        html +=
            `<br>Исход: ${formatNumber(
                source.years[currentYear]
            )}`;

    }


    if (destination) {

        html +=
            `<br>Прибытие: ${formatNumber(
                destination.years[currentYear]
            )}`;

    }


    if (!regionHoverTooltip) {

        regionHoverTooltip =
            L.tooltip({

                sticky: true,

                direction: "top"

            });

    }


    regionHoverTooltip
        .setContent(html);


    if (
        !map.hasLayer(
            regionHoverTooltip
        )
    ) {

        regionHoverTooltip
            .addTo(map);

    }

}


/* ============================================================
   31. СКРЫТЬ HOVER
   ============================================================ */

function hideRegionValue() {

    if (
        regionHoverTooltip &&
        map.hasLayer(
            regionHoverTooltip
        )
    ) {

        map.removeLayer(
            regionHoverTooltip
        );

    }

}


/* ============================================================
   32. СЕГМЕНТЫ ЗА ГОД
   ============================================================ */

function calculateSegmentsForYear(year) {

    outgoingSegments = [];

    incomingSegments = [];


    routeCache = {};


    migrationFrom.forEach(

        function (source) {

            const value =
                source.years[year] || 0;


            if (value <= 0) {

                return;

            }


            const routes =
                findRoutesToDestinations(
                    source.edge
                );


            routes.forEach(

                function (route) {

                    const destinationName =
                        destinationByEdge[
                            route.destinationEdge
                        ];


                    if (!destinationName) {

                        return;

                    }


                    const destination =
                        migrationTo.find(

                            item =>
                                item.name ===
                                destinationName

                        );


                    if (!destination) {

                        return;

                    }


                    const destinationValue =
                        destination.years[year] ||
                        0;


                    if (
                        destinationValue <= 0
                    ) {

                        return;

                    }


                    const segmentValue =
                        Math.min(
                            value,
                            destinationValue
                        );


                    route.segments.forEach(

                        function (segment) {

                            outgoingSegments
                                .push({

                                    from:
                                        segment.from,

                                    to:
                                        segment.to,

                                    value:
                                        segmentValue,

                                    type:
                                        "outgoing",

                                    source:
                                        source.name,

                                    destination:
                                        destinationName,

                                    progress:
                                        segment.progress

                                });

                        }

                    );

                }

            );

        }

    );


    migrationTo.forEach(

        function (destination) {

            const value =
                destination.years[year] || 0;


            if (value <= 0) {

                return;

            }


            const sourceEdges =
                reverseGraph[
                    destination.edge
                ] || [];


            sourceEdges.forEach(

                function (sourceEdge) {

                    const sourceName =
                        sourceByEdge[
                            sourceEdge
                        ];


                    if (!sourceName) {

                        return;

                    }


                    const source =
                        migrationFrom.find(

                            item =>
                                item.name ===
                                sourceName

                        );


                    if (!source) {

                        return;

                    }


                    const sourceValue =
                        source.years[year] ||
                        0;


                    if (
                        sourceValue <= 0
                    ) {

                        return;

                    }


                    const segmentValue =
                        Math.min(
                            value,
                            sourceValue
                        );


                    const routes =
                        findRoutesToEdge(
                            sourceEdge,
                            destination.edge
                        );


                    routes.forEach(

                        function (route) {

                            route.segments
                                .forEach(

                                    function (segment) {

                                        incomingSegments
                                            .push({

                                                from:
                                                    segment.from,

                                                to:
                                                    segment.to,

                                                value:
                                                    segmentValue,

                                                type:
                                                    "incoming",

                                                source:
                                                    sourceName,

                                                destination:
                                                    destination.name,

                                                progress:
                                                    segment.progress

                                            });

                                    }

                                );

                        }

                    );

                }

            );

        }

    );

}


/* ============================================================
   33. ПОИСК МАРШРУТОВ
   ============================================================ */

function findRoutesToDestinations(startEdge) {

    const cacheKey =
        `dest:${startEdge}`;


    if (
        routeCache[cacheKey]
    ) {

        return routeCache[cacheKey];

    }


    const destinations =
        Object.keys(
            destinationByEdge
        );


    const result = [];


    destinations.forEach(

        function (destinationEdge) {

            const routes =
                findRoutesToEdge(
                    startEdge,
                    destinationEdge
                );


            routes.forEach(

                function (route) {

                    result.push({

                        destinationEdge,

                        segments:
                            route.segments

                    });

                }

            );

        }

    );


    routeCache[cacheKey] =
        result;


    return result;

}


/* ============================================================
   34. ПОИСК ПУТИ МЕЖДУ EDGE
   ============================================================ */

function findRoutesToEdge(
    startEdge,
    destinationEdge
) {

    const cacheKey =
        `${startEdge}->${destinationEdge}`;


    if (
        routeCache[cacheKey]
    ) {

        return routeCache[cacheKey];

    }


    if (
        startEdge ===
        destinationEdge
    ) {

        return [

            {

                segments: []

            }

        ];

    }


    const results = [];


    const visited =
        new Set();


    function dfs(
        current,
        path,
        depth
    ) {

        if (
            depth > 200
        ) {

            return;

        }


        if (
            current ===
            destinationEdge
        ) {

            results.push({

                segments:
                    path.map(

                        function (item, index) {

                            return {

                                from:
                                    item.from,

                                to:
                                    item.to,

                                progress:
                                    index /
                                    Math.max(
                                        1,
                                        path.length
                                    )

                            };

                        }

                    )

            });


            return;

        }


        if (
            visited.has(current)
        ) {

            return;

        }


        visited.add(current);


        const nextEdges =
            graph[current] || [];


        nextEdges.forEach(

            function (next) {

                if (
                    !nodes[next]
                ) {

                    return;

                }


                dfs(

                    next,

                    path.concat({

                        from:
                            current,

                        to:
                            next

                    }),

                    depth + 1

                );

            }

        );


        visited.delete(
            current
        );

    }


    dfs(
        startEdge,
        [],
        0
    );


    routeCache[cacheKey] =
        results;


    return results;

}


/* ============================================================
   35. DRAW FLOWS
   ============================================================ */

function drawFlows() {

    flowsLayer.clearLayers();

    clearAntPaths();


    const allSegments =
        outgoingSegments
            .concat(
                incomingSegments
            );


    const grouped =
        groupSegments(
            allSegments
        );


    grouped.forEach(

        function (collection) {

            drawSegmentCollection(
                collection
            );

        }

    );


    /*
       Создаём анимационные ant-path
       только если анимация включена.
    */

    if (animationRunning) {

        createAntPaths();

    }

}


/* ============================================================
   36. ГРУППИРОВКА СЕГМЕНТОВ
   ============================================================ */

function groupSegments(segments) {

    const groups = {};


    segments.forEach(

        function (segment) {

            const key =
                [

                    segment.source,

                    segment.destination,

                    segment.type

                ].join("|");


            if (!groups[key]) {

                groups[key] = {

                    source:
                        segment.source,

                    destination:
                        segment.destination,

                    type:
                        segment.type,

                    value:
                        segment.value,

                    segments:
                        []

                };

            }


            groups[key]
                .segments
                .push(segment);

        }

    );


    return Object.values(groups);

}


/* ============================================================
   37. ОТРИСОВКА ГРУППЫ
   ============================================================ */

function drawSegmentCollection(
    collection
) {

    collection.segments.forEach(

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


            const progress =
                segment.progress || 0;


            const color =
                getFlowColor(

                    collection.type,

                    progress

                );


            const width =
                getFlowWidth(
                    collection.value
                );


            const points =
                createSmoothPath(
                    from,
                    to
                );


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

            ).addTo(
                flowsLayer
            );

        }

    );

}


/* ============================================================
   38. LEAFLET-ANT-PATH
   ============================================================ */

function createAntPaths() {

    clearAntPaths();


    const allSegments =
        outgoingSegments
            .concat(
                incomingSegments
            );


    const grouped =
        groupSegments(
            allSegments
        );


    grouped.forEach(

        function (collection) {

            collection.segments
                .forEach(

                    function (segment) {

                        const from =
                            getNodePoint(
                                segment.from
                            );


                        const to =
                            getNodePoint(
                                segment.to
                            );


                        if (
                            !from ||
                            !to
                        ) {

                            return;

                        }


                        const progress =
                            segment.progress || 0;


                        const color =
                            getFlowColor(

                                collection.type,

                                progress

                            );


                        const width =
                            getFlowWidth(
                                collection.value
                            );


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
                           Основная анимационная линия.
                           leaflet-ant-path автоматически
                           двигает пунктир вдоль линии.
                        */

                        const antPath =
                            L.polyline.antPath(

                                points,

                                {

                                    delay:
                                        SETTINGS.antPathDelay,

                                    dashArray:
                                        SETTINGS.antPathDashArray,

                                    weight:
                                        Math.max(
                                            1.5,
                                            width * 0.62
                                        ),

                                    color,

                                    pulseColor:
                                        SETTINGS.antPathPulseColor,

                                    opacity:
                                        SETTINGS.animationOpacity,

                                    paused:
                                        !animationRunning,

                                    reverse:
                                        false,

                                    hardwareAccelerated:
                                        SETTINGS.antPathHardwareAccelerated,

                                    interactive:
                                        false

                                }

                            );


                        antPath.addTo(
                            animationLayer
                        );


                        antPaths.push(
                            antPath
                        );

                    }

                );

        }

    );

}


/* ============================================================
   39. ОЧИСТКА ANT-PATH
   ============================================================ */

function clearAntPaths() {

    antPaths.forEach(

        function (path) {

            try {

                path.pause();

            }

            catch (error) {

                /* ничего */

            }


            try {

                animationLayer.removeLayer(
                    path
                );

            }

            catch (error) {

                /* ничего */

            }

        }

    );


    antPaths = [];

}


/* ============================================================
   40. ЗАПУСК АНИМАЦИИ
   ============================================================ */

function startFlowAnimation() {

    animationRunning = true;


    if (!antPaths.length) {

        createAntPaths();

    }


    else {

        antPaths.forEach(

            function (path) {

                try {

                    path.resume();

                }

                catch (error) {

                    console.warn(
                        error
                    );

                }

            }

        );

    }


    updateAnimationButton();

}


/* ============================================================
   41. ОСТАНОВКА АНИМАЦИИ
   ============================================================ */

function stopFlowAnimation() {

    animationRunning = false;


    antPaths.forEach(

        function (path) {

            try {

                path.pause();

            }

            catch (error) {

                console.warn(
                    error
                );

            }

        }

    );


    updateAnimationButton();

}


/* ============================================================
   42. КНОПКА АНИМАЦИИ
   ============================================================ */

function updateAnimationButton() {

    const button =
        document.getElementById(
            "animationToggle"
        );


    if (!button) {

        return;

    }


    if (animationRunning) {

        button.textContent =
            "❚❚ Остановить потоки";

    }

    else {

        button.textContent =
            "▶ Запустить потоки";

    }

}


/* ============================================================
   43. ЦВЕТ ПОТОКА
   ============================================================ */

function getFlowColor(
    type,
    progress
) {

    if (
        type === "outgoing"
    ) {

        return interpolateColor(

            SETTINGS.outgoingColor,

            SETTINGS.transitionColor,

            progress

        );

    }


    if (
        type === "incoming"
    ) {

        return interpolateColor(

            SETTINGS.transitionColor,

            SETTINGS.incomingColor,

            progress

        );

    }


    return SETTINGS.transitionColor;

}


/* ============================================================
   44. ИНТЕРПОЛЯЦИЯ ЦВЕТА
   ============================================================ */

function interpolateColor(
    color1,
    color2,
    amount
) {

    amount =
        Math.max(
            0,
            Math.min(
                1,
                amount
            )
        );


    const c1 =
        hexToRgb(color1);


    const c2 =
        hexToRgb(color2);


    if (!c1 || !c2) {

        return color1;

    }


    const r =
        Math.round(
            c1.r +
            (
                c2.r - c1.r
            ) * amount
        );


    const g =
        Math.round(
            c1.g +
            (
                c2.g - c1.g
            ) * amount
        );


    const b =
        Math.round(
            c1.b +
            (
                c2.b - c1.b
            ) * amount
        );


    return `rgb(${r},${g},${b})`;

}


/* ============================================================
   45. HEX → RGB
   ============================================================ */

function hexToRgb(hex) {

    const value =
        String(hex)
            .replace("#", "");


    if (
        value.length !== 6
    ) {

        return null;

    }


    return {

        r:
            parseInt(
                value.substring(0, 2),
                16
            ),

        g:
            parseInt(
                value.substring(2, 4),
                16
            ),

        b:
            parseInt(
                value.substring(4, 6),
                16
            )

    };

}


/* ============================================================
   46. ТОЛЩИНА ПОТОКА
   ============================================================ */

function getFlowWidth(value) {

    const number =
        Math.max(
            0,
            Number(value) || 0
        );


    /*
       Логарифмическое масштабирование,
       чтобы большие потоки не "съедали"
       все остальные.
    */

    const maxValue =
        getMaxMigrationValue();


    if (
        maxValue <= 0
    ) {

        return SETTINGS.minFlowWidth;

    }


    const normalized =
        Math.log1p(number) /
        Math.log1p(maxValue);


    return (

        SETTINGS.minFlowWidth +

        (

            SETTINGS.maxFlowWidth -
            SETTINGS.minFlowWidth

        ) *

        normalized

    );

}


/* ============================================================
   47. МАКСИМАЛЬНАЯ МИГРАЦИЯ
   ============================================================ */

function getMaxMigrationValue() {

    let max = 0;


    migrationFrom.forEach(

        function (item) {

            YEARS.forEach(

                function (year) {

                    max =
                        Math.max(
                            max,
                            item.years[year] || 0
                        );

                }

            );

        }

    );


    migrationTo.forEach(

        function (item) {

            YEARS.forEach(

                function (year) {

                    max =
                        Math.max(
                            max,
                            item.years[year] || 0
                        );

                }

            );

        }

    );


    return max;

}


/* ============================================================
   48. ТОЧКА УЗЛА
   ============================================================ */

function getNodePoint(edge) {

    const node =
        nodes[edge];


    if (!node) {

        return null;

    }


    return [
        node.lat,
        node.lon
    ];

}


/* ============================================================
   49. ПЛАВНЫЙ ПУТЬ
   ============================================================ */

function createSmoothPath(
    from,
    to
) {

    if (
        !from ||
        !to
    ) {

        return [];

    }


    const lat1 =
        from[0];


    const lon1 =
        from[1];


    const lat2 =
        to[0];


    const lon2 =
        to[1];


    const dLat =
        lat2 - lat1;


    const dLon =
        lon2 - lon1;


    const distance =
        Math.sqrt(
            dLat * dLat +
            dLon * dLon
        );


    if (
        distance === 0
    ) {

        return [
            from,
            to
        ];

    }


    /*
       Перпендикуляр к направлению.
    */

    const nx =
        -dLat / distance;


    const ny =
        dLon / distance;


    const bend =
        distance *
        SETTINGS.curveFactor;


    const controlLat =
        (
            lat1 +
            lat2
        ) / 2 +
        nx * bend;


    const controlLon =
        (
            lon1 +
            lon2
        ) / 2 +
        ny * bend;


    const points = [];


    for (
        let i = 0;
        i <= SETTINGS.curveSteps;
        i++
    ) {

        const t =
            i /
            SETTINGS.curveSteps;


        const oneMinusT =
            1 - t;


        const lat =
            oneMinusT *
                oneMinusT *
                lat1 +

            2 *
                oneMinusT *
                t *
                controlLat +

            t *
                t *
                lat2;


        const lon =
            oneMinusT *
                oneMinusT *
                lon1 +

            2 *
                oneMinusT *
                t *
                controlLon +

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
   50. ВЫБОР РЕГИОНА
   ============================================================ */

function selectRegion(name) {

    selectedRegion =
        name;


    selectedSourceNames =
        new Set();


    selectedDestinationNames =
        new Set();


    const source =
        migrationFrom.find(
            item =>
                item.name === name
        );


    const destination =
        migrationTo.find(
            item =>
                item.name === name
        );


    if (source) {

        selectedRegionRole =
            "source";


        migrationFrom.forEach(

            function (item) {

                if (
                    item.years[currentYear] >
                    0
                ) {

                    selectedSourceNames
                        .add(item.name);

                }

            }

        );

    }


    else if (destination) {

        selectedRegionRole =
            "destination";


        migrationTo.forEach(

            function (item) {

                if (
                    item.years[currentYear] >
                    0
                ) {

                    selectedDestinationNames
                        .add(item.name);

                }

            }

        );

    }


    updateRegionStyles();

}


/* ============================================================
   51. СБРОС ВЫДЕЛЕНИЯ
   ============================================================ */

function clearRegionSelection() {

    selectedRegion =
        null;


    selectedRegionRole =
        null;


    selectedSourceNames =
        new Set();


    selectedDestinationNames =
        new Set();


    updateRegionStyles();

}


/* ============================================================
   52. СТИЛИ РЕГИОНОВ
   ============================================================ */

function updateRegionStyles() {

    Object.keys(regionLayers)
        .forEach(

            function (name) {

                const layer =
                    regionLayers[name];


                let fillColor =
                    SETTINGS.regionFillColor;


                let fillOpacity =
                    SETTINGS.regionFillOpacity;


                if (
                    selectedRegionRole ===
                    "source" &&
                    selectedSourceNames
                        .has(name)
                ) {

                    fillColor =
                        SETTINGS.selectedSourceColor;

                    fillOpacity =
                        SETTINGS.selectedSourceOpacity;

                }


                if (
                    selectedRegionRole ===
                    "destination" &&
                    selectedDestinationNames
                        .has(name)
                ) {

                    fillColor =
                        SETTINGS.selectedDestinationColor;

                    fillOpacity =
                        SETTINGS.selectedDestinationOpacity;

                }


                layer.setStyle({

                    color:
                        SETTINGS.regionBorderColor,

                    weight:
                        0.8,

                    fillColor,

                    fillOpacity

                });

            }

        );

}


/* ============================================================
   53. ГОД
   ============================================================ */

function setYear(year) {

    if (
        !YEARS.includes(year)
    ) {

        return;

    }


    currentYear =
        year;


    /*
       ВАЖНО:
       animationRunning НЕ меняем.

       Поэтому переключение года
       не выключает анимацию.
    */

    calculateSegmentsForYear(
        currentYear
    );


    drawFlows();


    updateYearInterface();


    updateTables();


    updateRegionStyles();

}


/* ============================================================
   54. ИНТЕРФЕЙС ГОДА
   ============================================================ */

function updateYearInterface() {

    const slider =
        document.getElementById(
            "yearSlider"
        );


    const label =
        document.getElementById(
            "yearLabel"
        );


    if (slider) {

        slider.value =
            currentYear;

    }


    if (label) {

        label.textContent =
            currentYear;

    }


    document
        .querySelectorAll(
            ".yearButton"
        )
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


    updateAnimationButton();

}


/* ============================================================
   55. ТАБЛИЦЫ
   ============================================================ */

function toggleTables() {

    tablesVisible =
        !tablesVisible;


    const container =
        document.getElementById(
            "tablesContainer"
        );


    if (!container) {

        return;

    }


    container.style.display =
        tablesVisible
            ? "flex"
            : "none";


    if (tablesVisible) {

        updateTables();

    }

}


/* ============================================================
   56. ОБНОВЛЕНИЕ ТАБЛИЦ
   ============================================================ */

function updateTables() {

    if (!tablesVisible) {

        return;

    }


    const sourceContainer =
        document.getElementById(
            "sourceTable"
        );


    const destinationContainer =
        document.getElementById(
            "destinationTable"
        );


    if (
        !sourceContainer ||
        !destinationContainer
    ) {

        return;

    }


    sourceContainer.innerHTML =
        createMigrationTable(
            migrationFrom,
            currentYear
        );


    destinationContainer.innerHTML =
        createMigrationTable(
            migrationTo,
            currentYear
        );

}


/* ============================================================
   57. HTML ТАБЛИЦЫ
   ============================================================ */

function createMigrationTable(
    data,
    year
) {

    if (!data.length) {

        return "<p>Нет данных</p>";

    }


    const rows =
        data
            .slice()
            .sort(

                function (a, b) {

                    return (

                        (
                            b.years[year] || 0
                        ) -

                        (
                            a.years[year] || 0
                        )

                    );

                }

            );


    let html = `

        <table class="migration-table">

            <thead>

                <tr>

                    <th>
                        Регион
                    </th>

                    <th>
                        ${year}
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    rows.forEach(

        function (item) {

            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            item.name
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            item.years[year]
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


    return html;

}


/* ============================================================
   58. ФОРМАТ ЧИСЛА
   ============================================================ */

function formatNumber(value) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "ru-RU"
    );

}


/* ============================================================
   59. ЭКРАНИРОВАНИЕ HTML
   ============================================================ */

function escapeHtml(value) {

    return String(value ?? "")
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
   60. FIT MAP
   ============================================================ */

function fitMapToRegions() {

    if (
        !geojsonData ||
        !geojsonData.features ||
        !geojsonData.features.length
    ) {

        return;

    }


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

                    padding:
                        [20, 20]

                }

            );

        }

    }

    catch (error) {

        console.warn(
            "Не удалось определить границы карты",
            error
        );

    }

}


/* ============================================================
   61. ОШИБКА
   ============================================================ */

function showError(message) {

    const old =
        document.getElementById(
            "migration-error"
        );


    if (old) {

        old.remove();

    }


    const error =
        document.createElement("div");


    error.id =
        "migration-error";


    error.style.position =
        "fixed";


    error.style.left =
        "50%";


    error.style.top =
        "50%";


    error.style.transform =
        "translate(-50%, -50%)";


    error.style.zIndex =
        "10000";


    error.style.background =
        "#fff";


    error.style.padding =
        "20px";


    error.style.borderRadius =
        "10px";


    error.style.boxShadow =
        "0 5px 25px rgba(0,0,0,.3)";


    error.style.maxWidth =
        "600px";


    error.style.fontFamily =
        "Arial, sans-serif";


    error.innerHTML = `

        <strong>
            Ошибка загрузки карты
        </strong>

        <pre style="
            white-space:pre-wrap;
            margin-top:10px;
        ">${escapeHtml(
            message
        )}</pre>

    `;


    document.body.appendChild(
        error
    );

}
