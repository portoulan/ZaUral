// ============================================================
// ИНТЕРАКТИВНАЯ КАРТА МИГРАЦИЙ ПО ГОДАМ
// ============================================================
//
// ФАЙЛЫ:
//
// data/migration_from.csv
// Origin;EDGE;year_1896;...;year_1916
//
// data/migration_to.csv
// Destinatoin;EDGE;year_1896;...;year_1916
//
// data/NODES.csv
// NODE;LONG;LAT
//
// или:
// id;lat;lon
//
// data/EDGES.csv
//
// Каждая строка EDGES задаёт последовательность узлов:
//
// N301;N310
// N302;N530;N531;N532;N338
//
// превращается в:
//
// N301 → N310
// N302 → N530 → N531 → N532 → N338
//
// Названия регионов в конце строк EDGES игнорируются.
// ============================================================


// ============================================================
// 1. ФАЙЛЫ
// ============================================================

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


// ============================================================
// 2. НАСТРОЙКИ
// ============================================================

const SETTINGS = {

    // Исходящие потоки
    outgoingColor: "#c62828",

    // Входящие потоки
    incomingColor: "#1565c0",

    // Прозрачность обычных потоков
    flowOpacity: 0.68,

    // Минимальная толщина
    minFlowWidth: 1.2,

    // Максимальная толщина
    maxFlowWidth: 28,

    // Кривизна линий
    curveFactor: 0.035,

    // Количество точек кривой
    curveSteps: 10,

    // Цвет границ регионов
    regionColor: "#777777",

    // Заливка регионов
    regionFillColor: "#eeeeee",

    // Прозрачность регионов
    regionFillOpacity: 0.18,

    // Толщина границ
    regionWeight: 0.8,

    // Цвет выбранного региона
    selectedRegionColor: "#555555",

    // Зум карты при загрузке
    initialCenter: [55, 70],

    initialZoom: 4

};


// ============================================================
// 3. ГОДЫ
// ============================================================

const YEARS = [];

for (let year = 1896; year <= 1916; year++) {
    YEARS.push(year);
}

let currentYear = 1896;


// ============================================================
// 4. ГЛОБАЛЬНЫЕ ДАННЫЕ
// ============================================================

let migrationFrom = [];

let migrationTo = [];

let nodes = {};

let graph = {};

let geojsonData = null;

let regions = {};

let destinationByEdge = {};

let sourceByEdge = {};


// Все направления из одного стартового узла
let routeCache = {};


// Сегменты карты
let outgoingSegments = [];

let incomingSegments = [];


// ============================================================
// 5. СОСТОЯНИЕ ИНТЕРФЕЙСА
// ============================================================

let animationRunning = false;

let animationFrame = null;

let animationStrokes = [];

let tablesVisible = false;


// ============================================================
// 6. СОЗДАЁМ КАРТУ
// ============================================================

const map = L.map("map", {
    zoomControl: true,
    preferCanvas: true
});


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


map.setView(
    SETTINGS.initialCenter,
    SETTINGS.initialZoom
);


// ============================================================
// 7. СЛОИ
// ============================================================

// Границы регионов
const regionsLayer =
    L.layerGroup().addTo(map);


// Обычные потоки
const flowsLayer =
    L.layerGroup().addTo(map);


// Анимированные штрихи
const animationLayer =
    L.layerGroup().addTo(map);


// ============================================================
// 8. CSS
// ============================================================

injectStyles();


// ============================================================
// 9. ЗАПУСК
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        createInterface();

        loadEverything();

    }
);


// ============================================================
// 10. CSS
// ============================================================

function injectStyles() {

    if (
        document.getElementById(
            "migrationMapStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "migrationMapStyles";


    style.textContent = `

        #migration-controls {

            position: fixed;

            left: 50%;

            bottom: 16px;

            transform: translateX(-50%);

            z-index: 1000;

            background:
                rgba(255,255,255,0.96);

            border-radius: 12px;

            box-shadow:
                0 3px 18px
                rgba(0,0,0,0.25);

            padding: 10px 14px;

            font-family:
                Arial,
                sans-serif;

            width:
                min(1000px, calc(100vw - 30px));

            box-sizing:
                border-box;

        }


        .migration-toolbar {

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            gap: 6px;

            flex-wrap:
                wrap;

        }


        .migration-toolbar button {

            border:
                1px solid #cccccc;

            background:
                #ffffff;

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
                #f2f2f2;

        }


        #yearButtons {

            display:
                flex;

            flex-wrap:
                wrap;

            justify-content:
                center;

            gap:
                3px;

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
                #333333 !important;

            color:
                white !important;

            border-color:
                #333333 !important;

        }


        .year-slider-container {

            margin-top:
                8px;

            display:
                flex;

            align-items:
                center;

            gap:
                8px;

        }


        #yearSlider {

            flex:
                1;

            cursor:
                pointer;

        }


        #yearLabel {

            min-width:
                42px;

            text-align:
                center;

            font-size:
                16px;

        }


        .tables-container {

            display:
                flex;

            gap:
                20px;

            margin-top:
                12px;

            max-height:
                45vh;

            overflow:
                auto;

            border-top:
                1px solid #ddd;

            padding-top:
                10px;

        }


        .table-column {

            flex:
                1;

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


        .migration-table th {

            position:
                sticky;

            top:
                0;

            background:
                #eeeeee;

            text-align:
                left;

        }


        .migration-table th,
        .migration-table td {

            border:
                1px solid #ddd;

            padding:
                4px 6px;

        }


        .migration-table td:last-child,
        .migration-table th:last-child {

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
                900;

            background:
                rgba(255,255,255,0.95);

            padding:
                10px 12px;

            border-radius:
                8px;

            box-shadow:
                0 2px 10px
                rgba(0,0,0,0.18);

            font-family:
                Arial,
                sans-serif;

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
                28px;

            height:
                4px;

            border-radius:
                4px;

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


// ============================================================
// 11. ИНТЕРФЕЙС
// ============================================================

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

            <span>
                1896
            </span>

            <input
                id="yearSlider"
                type="range"
                min="1896"
                max="1916"
                step="1"
                value="1896"
            >

            <span>
                1916
            </span>

            <strong id="yearLabel">
                1896
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


    // --------------------------------------------------------
    // Кнопки годов
    // --------------------------------------------------------

    const yearButtons =
        document.getElementById(
            "yearButtons"
        );


    YEARS.forEach(
        function (year) {

            const button =
                document.createElement(
                    "button"
                );

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


    // --------------------------------------------------------
    // Предыдущий год
    // --------------------------------------------------------

    document
        .getElementById("prevYearBtn")
        .addEventListener(
            "click",
            function () {

                const index =
                    YEARS.indexOf(
                        currentYear
                    );

                if (index > 0) {

                    setYear(
                        YEARS[index - 1]
                    );

                }

            }
        );


    // --------------------------------------------------------
    // Следующий год
    // --------------------------------------------------------

    document
        .getElementById("nextYearBtn")
        .addEventListener(
            "click",
            function () {

                const index =
                    YEARS.indexOf(
                        currentYear
                    );

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


    // --------------------------------------------------------
    // Ползунок
    // --------------------------------------------------------

    document
        .getElementById("yearSlider")
        .addEventListener(
            "input",
            function (event) {

                setYear(
                    Number(
                        event.target.value
                    )
                );

            }
        );


    // --------------------------------------------------------
    // Анимация
    // --------------------------------------------------------

    document
        .getElementById("animationToggle")
        .addEventListener(
            "click",
            function () {

                if (
                    animationRunning
                ) {

                    stopFlowAnimation();

                }
                else {

                    startFlowAnimation();

                }

            }
        );


    // --------------------------------------------------------
    // Таблицы
    // --------------------------------------------------------

    document
        .getElementById("tablesToggle")
        .addEventListener(
            "click",
            function () {

                toggleTables();

            }
        );


    // --------------------------------------------------------
    // Легенда
    // --------------------------------------------------------

    createLegend();

}


// ============================================================
// 12. ЛЕГЕНДА
// ============================================================

function createLegend() {

    const legend =
        document.createElement("div");

    legend.className =
        "flowLegend";


    legend.innerHTML = `

        <div class="legendItem">

            <span
                class="legendLine legendOutgoing"
            ></span>

            <span>
                Исходящие потоки
            </span>

        </div>


        <div class="legendItem">

            <span
                class="legendLine legendIncoming"
            ></span>

            <span>
                Входящие потоки
            </span>

        </div>

    `;


    document.body.appendChild(
        legend
    );

}


// ============================================================
// 13. ЗАГРУЗКА ВСЕХ ДАННЫХ
// ============================================================

async function loadEverything() {

    try {

        console.log(
            "Загрузка данных..."
        );


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


        // ----------------------------------------------------
        // Парсим
        // ----------------------------------------------------

        migrationFrom =
            parseMigrationFrom(
                fromText
            );


        migrationTo =
            parseMigrationTo(
                toText
            );


        prepareNodes(
            parseCSV(
                nodesText
            )
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


        console.log(
            "migration_from:",
            migrationFrom.length
        );

        console.log(
            "migration_to:",
            migrationTo.length
        );

        console.log(
            "nodes:",
            Object.keys(nodes).length
        );

        console.log(
            "graph nodes:",
            Object.keys(graph).length
        );


        // ----------------------------------------------------
        // Регионы
        // ----------------------------------------------------

        drawRegions();


        // ----------------------------------------------------
        // Первый год
        // ----------------------------------------------------

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


// ============================================================
// 14. ЗАГРУЗКА ТЕКСТА
// ============================================================

async function loadFirstAvailableText(
    paths
) {

    let lastError = null;


    for (
        const path of paths
    ) {

        try {

            const response =
                await fetch(path);


            if (
                response.ok
            ) {

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


// ============================================================
// 15. ЗАГРУЗКА JSON
// ============================================================

async function loadFirstAvailableJSON(
    paths
) {

    let lastError = null;


    for (
        const path of paths
    ) {

        try {

            const response =
                await fetch(path);


            if (
                response.ok
            ) {

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
        "Не удалось загрузить data.geojson"
    );

}


// ============================================================
// 16. CSV
// ============================================================

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


    if (
        lines.length === 0
    ) {

        return [];

    }


    const headers =
        parseCSVLine(
            lines[0]
        )
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
            function (
                header,
                index
            ) {

                row[header] =
                    clean(
                        values[index] || ""
                    );

            }
        );


        result.push(
            row
        );

    }


    return result;

}


// ============================================================
// 17. CSV СТРОКА
// ============================================================

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


        if (
            char === '"'
        ) {

            quoted =
                !quoted;

            continue;

        }


        if (
            char === ";" &&
            !quoted
        ) {

            result.push(
                current
            );

            current = "";

        }
        else {

            current += char;

        }

    }


    result.push(
        current
    );


    return result;

}


// ============================================================
// 18. MIGRATION FROM
// ============================================================

function parseMigrationFrom(text) {

    const data =
        parseCSV(text);


    const result = [];


    data.forEach(
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

                origin:
                    origin,

                edge:
                    edge,

                values:
                    values

            });

        }
    );


    return result;

}


// ============================================================
// 19. MIGRATION TO
// ============================================================

function parseMigrationTo(text) {

    const data =
        parseCSV(text);


    const result = [];


    data.forEach(
        function (row) {

            const destination =
                clean(
                    row.Destination ||
                    row.Destinatoin ||
                    row.destination ||
                    row.destinatoin
                );


            const edge =
                clean(
                    row.EDGE
                );


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

                destination:
                    destination,

                edge:
                    edge,

                values:
                    values

            });

        }
    );


    return result;

}


// ============================================================
// 20. NODES
// ============================================================

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


            let lon =
                parseCoordinate(
                    row.LONG ??
                    row.lon ??
                    row.LON
                );


            let lat =
                parseCoordinate(
                    row.LAT ??
                    row.lat
                );


            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon)
            ) {

                console.warn(
                    "Некорректные координаты:",
                    id,
                    row
                );

                return;

            }


            nodes[id] = {

                id:
                    id,

                lat:
                    lat,

                lon:
                    lon

            };

        }
    );


    console.log(
        "Загружено узлов:",
        Object.keys(nodes).length
    );

}


// ============================================================
// 21. GEOJSON
// ============================================================

function prepareRegions(
    geojson
) {

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
                feature.properties ||
                {};


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

                name:
                    name,

                feature:
                    feature

            };

        }
    );


    console.log(
        "Регионов GeoJSON:",
        Object.keys(regions).length
    );

}


// ============================================================
// 22. ПОСТРОЕНИЕ ГРАФА
// ============================================================
//
// ВАЖНО:
//
// Мы берём из EDGES только значения,
// начинающиеся с N:
//
// N301;N310;...;Тургайская
//
// превращается в:
//
// N301 → N310 → ...
//
// Тургайская игнорируется.
//
// ============================================================

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
                parseCSVLine(
                    line
                )
                .map(clean);


            // Только узлы N...
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

                const from =
                    nodeValues[i];

                const to =
                    nodeValues[i + 1];


                addGraphEdge(
                    from,
                    to
                );

            }

        }
    );


    console.log(
        "Узлов графа:",
        Object.keys(graph).length
    );

}


// ============================================================
// 23. ДОБАВЛЕНИЕ РЕБРА
// ============================================================

function addGraphEdge(
    from,
    to
) {

    if (!graph[from]) {

        graph[from] = [];

    }


    if (
        !graph[from].includes(to)
    ) {

        graph[from].push(to);

    }

}


// ============================================================
// 24. ФИНАЛЬНЫЕ EDGE
// ============================================================

function prepareDestinationEdges() {

    destinationByEdge = {};


    migrationTo.forEach(
        function (item) {

            if (
                !destinationByEdge[
                    item.edge
                ]
            ) {

                destinationByEdge[
                    item.edge
                ] = [];

            }


            destinationByEdge[
                item.edge
            ].push(item);

        }
    );

}


// ============================================================
// 25. ИСХОДНЫЕ EDGE
// ============================================================

function prepareSourceEdges() {

    sourceByEdge = {};


    migrationFrom.forEach(
        function (item) {

            if (
                !sourceByEdge[
                    item.edge
                ]
            ) {

                sourceByEdge[
                    item.edge
                ] = [];

            }


            sourceByEdge[
                item.edge
            ].push(item);

        }
    );

}


// ============================================================
// 26. ГОД
// ============================================================

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


    // ВАЖНО:
    //
    // здесь НЕ останавливаем анимацию.
    //
    // Штрихи будут автоматически
    // перестроены под новый год,
    // а animationRunning останется true.


    calculateSegmentsForYear(
        currentYear
    );


    drawFlows();


    updateYearInterface();


    updateTables();


    if (
        animationRunning
    ) {

        createAnimationStrokes();

    }

}


// ============================================================
// 27. ИНТЕРФЕЙС ГОДА
// ============================================================

function updateYearInterface() {

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


// ============================================================
// 28. РАСЧЁТ СЕГМЕНТОВ
// ============================================================
//
// Здесь принципиально:
//
// 1. Сначала строим исходящие потоки.
//
// 2. Затем строим входящие потоки.
//
// 3. Не смешиваем значения migration_from
//    и migration_to.
//
// 4. Не создаём искусственную OD-матрицу.
//
// ============================================================

function calculateSegmentsForYear(
    year
) {

    outgoingSegments =
        buildOutgoingSegments(
            year
        );


    incomingSegments =
        buildIncomingSegments(
            year
        );


    console.log(
        "Год:",
        year
    );


    console.log(
        "Исходящих сегментов:",
        outgoingSegments.length
    );


    console.log(
        "Входящих сегментов:",
        incomingSegments.length
    );

}


// ============================================================
// 29. ИСХОДЯЩИЕ ПОТОКИ
// ============================================================

function buildOutgoingSegments(
    year
) {

    const segmentMap = {};


    migrationFrom.forEach(
        function (source) {

            const value =
                source.values[year] || 0;


            if (
                value <= 0
            ) {
                return;
            }


            const routes =
                getRoutesFromEdge(
                    source.edge
                );


            if (
                routes.length === 0
            ) {

                console.warn(
                    "Нет маршрута для:",
                    source.origin,
                    source.edge
                );

                return;

            }


            // ------------------------------------------------
            // Определяем конечные направления,
            // достижимые от данного EDGE.
            //
            // Если есть данные migration_to,
            // распределяем поток пропорционально
            // фактическим объёмам назначения.
            // ------------------------------------------------

            const routeObjects = [];


            routes.forEach(
                function (route) {

                    route.destinations.forEach(
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

                                destinationValue:
                                    destinationValue

                            });

                        }
                    );

                }
            );


            if (
                routeObjects.length === 0
            ) {

                // Если конечного назначения
                // в migration_to нет,
                // показываем весь поток
                // по доступному маршруту.

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
                    function (
                        sum,
                        item
                    ) {

                        return (
                            sum +
                            item.destinationValue
                        );

                    },
                    0
                );


            if (
                totalDestination <= 0
            ) {

                // Нет данных по назначениям:
                // делим между маршрутами поровну.

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


// ============================================================
// 30. ВХОДЯЩИЕ ПОТОКИ
// ============================================================
//
// Входящий поток идёт:
//
// сеть узлов → EDGE назначения
//
// и определяется ТОЛЬКО
// migration_to.
//
// ============================================================

function buildIncomingSegments(
    year
) {

    const segmentMap = {};


    migrationTo.forEach(
        function (destination) {

            const value =
                destination.values[year] || 0;


            if (
                value <= 0
            ) {
                return;
            }


            const routes =
                getRoutesToEdge(
                    destination.edge
                );


            if (
                routes.length === 0
            ) {

                console.warn(
                    "Нет входящего маршрута:",
                    destination.destination,
                    destination.edge
                );

                return;

            }


            // ------------------------------------------------
            // Для входящего потока используем
            // все найденные входы в destination EDGE.
            //
            // Если несколько вариантов пути —
            // делим поток между ними.
            // ------------------------------------------------

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


// ============================================================
// 31. СЕГМЕНТ
// ============================================================

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


    for (
        let i = 0;
        i < path.length - 1;
        i++
    ) {

        const from =
            path[i];

        const to =
            path[i + 1];


        const key =
            `${type}|${from}|${to}`;


        if (
            !segmentMap[key]
        ) {

            segmentMap[key] = {

                from:
                    from,

                to:
                    to,

                value:
                    0,

                type:
                    type,

                names:
                    {}

            };

        }


        segmentMap[key].value +=
            value;


        if (
            !segmentMap[key]
                .names[name]
        ) {

            segmentMap[key]
                .names[name] = 0;

        }


        segmentMap[key]
            .names[name] += value;

    }

}


// ============================================================
// 32. МАРШРУТЫ ОТ EDGE
// ============================================================
//
// Возвращает все пути:
//
// N301 → ... → конечные EDGE
//
// При этом конечный EDGE НЕ останавливает
// обход автоматически.
//
// Это важно, потому что один и тот же узел
// может быть одновременно:
//
// - точкой назначения;
// - промежуточным узлом.
//
// ============================================================

function getRoutesFromEdge(
    startEdge
) {

    if (
        routeCache[
            "from:" + startEdge
        ]
    ) {

        return routeCache[
            "from:" + startEdge
        ];

    }


    const result = [];


    walkForward(
        startEdge,
        [startEdge],
        new Set(),
        result
    );


    routeCache[
        "from:" + startEdge
    ] = result;


    return result;

}


// ============================================================
// 33. ОБХОД ВПЕРЁД
// ============================================================

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


    nextVisited.add(
        current
    );


    // --------------------------------------------------------
    // Если текущий узел является EDGE назначения,
    // фиксируем маршрут.
    //
    // Но продолжаем обход,
    // если из него есть исходящие связи.
    // --------------------------------------------------------

    const destinations =
        destinationByEdge[
            current
        ] || [];


    if (
        destinations.length > 0
    ) {

        result.push({

            path:
                [...path],

            destinations:
                destinations

        });

    }


    const nextNodes =
        graph[current] || [];


    if (
        nextNodes.length === 0
    ) {

        return;

    }


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


// ============================================================
// 34. МАРШРУТЫ К EDGE НАЗНАЧЕНИЯ
// ============================================================
//
// Для каждого destination EDGE ищем все
// входящие пути.
//
// Например:
//
// N700 → ... → N189
//
// и:
//
// N189 → N192 → ... → N226
//
// позволяют построить:
//
// N700 → ... → N189 → ... → N226
//
// ============================================================

const reverseGraph = {};


function buildReverseGraph() {

    Object.keys(graph)
        .forEach(
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


// ============================================================
// 35. ПУТИ К EDGE
// ============================================================

function getRoutesToEdge(
    destinationEdge
) {

    const cacheKey =
        "to:" + destinationEdge;


    if (
        routeCache[cacheKey]
    ) {

        return routeCache[
            cacheKey
        ];

    }


    const paths = [];


    walkBackward(
        destinationEdge,
        [destinationEdge],
        new Set(),
        paths
    );


    const normalized =
        paths.map(
            function (path) {

                return [
                    ...path
                ].reverse();

            }
        );


    routeCache[
        cacheKey
    ] = normalized;


    return normalized;

}


// ============================================================
// 36. ОБХОД НАЗАД
// ============================================================

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


    nextVisited.add(
        current
    );


    const previous =
        reverseGraph[current] || [];


    if (
        previous.length === 0
    ) {

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


// ============================================================
// 37. РЕГИОНЫ НА КАРТЕ
// ============================================================

function drawRegions() {

    regionsLayer.clearLayers();


    Object.values(
        regions
    )
    .forEach(
        function (region) {

            const layer =
                L.geoJSON(
                    region.feature,
                    {

                        style: {

                            color:
                                SETTINGS.regionColor,

                            weight:
                                SETTINGS.regionWeight,

                            fillColor:
                                SETTINGS.regionFillColor,

                            fillOpacity:
                                SETTINGS.regionFillOpacity

                        }

                    }
                );


            layer.bindTooltip(
                function () {

                    return createRegionTooltip(
                        region.name
                    );

                },
                {
                    sticky: true
                }
            );


            layer.on(
                "mouseover",
                function () {

                    layer.setStyle({

                        weight: 1.4,

                        color:
                            SETTINGS.selectedRegionColor

                    });

                }
            );


            layer.on(
                "mouseout",
                function () {

                    layer.setStyle({

                        weight:
                            SETTINGS.regionWeight,

                        color:
                            SETTINGS.regionColor

                    });

                }
            );


            layer.addTo(
                regionsLayer
            );

        }
    );

}


// ============================================================
// 38. TOOLTIP РЕГИОНА
// ============================================================
//
// ВАЖНО:
//
// Здесь НЕ используются рассчитанные
// значения потоков.
//
// Только исходные данные:
//
// migration_from
// migration_to
//
// ============================================================

function createRegionTooltip(
    regionName
) {

    const sourceItems =
        migrationFrom.filter(
            function (item) {

                return (
                    normalizeName(
                        item.origin
                    ) ===
                    normalizeName(
                        regionName
                    )
                );

            }
        );


    const destinationItems =
        migrationTo.filter(
            function (item) {

                return (
                    normalizeName(
                        item.destination
                    ) ===
                    normalizeName(
                        regionName
                    )
                );

            }
        );


    let html =
        `<b>${escapeHTML(
            regionName
        )}</b>`;


    sourceItems.forEach(
        function (item) {

            html +=
                `<br>` +
                `Исходящие: ` +
                `<b>${formatNumber(
                    item.values[currentYear] || 0
                )}</b>`;

        }
    );


    destinationItems.forEach(
        function (item) {

            html +=
                `<br>` +
                `Переселившиеся: ` +
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
            `<br>Нет данных`;

    }


    return html;

}


// ============================================================
// 39. РИСОВАНИЕ ПОТОКОВ
// ============================================================

function drawFlows() {

    flowsLayer.clearLayers();


    drawSegmentCollection(
        outgoingSegments,
        SETTINGS.outgoingColor
    );


    drawSegmentCollection(
        incomingSegments,
        SETTINGS.incomingColor
    );


    // Если анимация уже включена,
    // создаём новые штрихи для нового года.

    if (
        animationRunning
    ) {

        createAnimationStrokes();

    }

}


// ============================================================
// 40. РИСОВАНИЕ ГРУППЫ СЕГМЕНТОВ
// ============================================================

function drawSegmentCollection(
    collection,
    color
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


            if (
                !from ||
                !to
            ) {

                console.warn(
                    "Нет координат:",
                    segment.from,
                    segment.to
                );

                return;

            }


            const points =
                createSmoothPath(
                    from,
                    to
                );


            const line =
                L.polyline(
                    points,
                    {

                        color:
                            color,

                        weight:
                            getFlowWidth(
                                segment.value
                            ),

                        opacity:
                            SETTINGS.flowOpacity,

                        lineCap:
                            "round",

                        lineJoin:
                            "round",

                        interactive:
                            true

                    }
                );


            const direction =
                segment.type ===
                "outgoing"
                    ? "Исходящий поток"
                    : "Входящий поток";


            const names =
                Object.entries(
                    segment.names || {}
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b[1] - a[1]
                )
                .slice(
                    0,
                    8
                );


            let namesHTML = "";


            names.forEach(
                function (item) {

                    namesHTML +=
                        `<br>` +
                        escapeHTML(
                            item[0]
                        ) +
                        `: ` +
                        `<b>` +
                        formatNumber(
                            item[1]
                        ) +
                        `</b>`;

                }
            );


            line.bindTooltip(
                `<b>${direction}</b>` +
                `<br>` +
                `${escapeHTML(
                    segment.from
                )} → ${escapeHTML(
                    segment.to
                )}` +
                `<br>` +
                `Поток: <b>${formatNumber(
                    segment.value
                )}</b>` +
                `<br>` +
                `Год: ${currentYear}` +
                (
                    namesHTML
                        ? `<hr>Основные регионы:` +
                          namesHTML
                        : ""
                ),
                {
                    sticky: true
                }
            );


            line.addTo(
                flowsLayer
            );

        }
    );

}


// ============================================================
// 41. КООРДИНАТЫ УЗЛА
// ============================================================

function getNodePoint(
    id
) {

    const node =
        nodes[id];


    if (!node) {
        return null;
    }


    return [
        node.lat,
        node.lon
    ];

}


// ============================================================
// 42. ТОЛЩИНА
// ============================================================

function getFlowWidth(
    value
) {

    if (
        value <= 0
    ) {

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


// ============================================================
// 43. ПЛАВНАЯ ЛИНИЯ
// ============================================================

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
        (lat1 + lat2) / 2;


    const midLon =
        (lon1 + lon2) / 2;


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


// ============================================================
// 44. АНИМАЦИЯ
// ============================================================
//
// Штрихи движутся по потокам.
// Исходящие — красные.
// Входящие — синие.
//
// ============================================================

const ANIMATION_SETTINGS = {

    // Скорость
    speed: 0.00022,

    // Длина штриха
    strokeLength: 0.055,

    // Минимальное количество штрихов
    minStrokes: 1,

    // Максимальное количество
    maxStrokes: 7,

    // Толщина штриха
    width: 3,

    // Прозрачность
    opacity: 0.9

};


// ============================================================
// 45. ЗАПУСК
// ============================================================

function startFlowAnimation() {

    if (
        animationRunning
    ) {
        return;
    }


    animationRunning =
        true;


    createAnimationStrokes();


    if (
        !animationFrame
    ) {

        animationFrame =
            requestAnimationFrame(
                animateFlowStrokes
            );

    }


    updateAnimationButton();

}


// ============================================================
// 46. ОСТАНОВКА
// ============================================================

function stopFlowAnimation() {

    animationRunning =
        false;


    if (
        animationFrame
    ) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame =
            null;

    }


    clearAnimationStrokes();


    updateAnimationButton();

}


// ============================================================
// 47. СОЗДАНИЕ ШТРИХОВ
// ============================================================

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


            if (
                !from ||
                !to
            ) {
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


            const color =
                segment.type ===
                "outgoing"
                    ? SETTINGS.outgoingColor
                    : SETTINGS.incomingColor;


            for (
                let i = 0;
                i < count;
                i++
            ) {

                const marker =
                    L.polyline(
                        [
                            points[0],
                            points[0]
                        ],
                        {

                            color:
                                color,

                            weight:
                                ANIMATION_SETTINGS.width,

                            opacity:
                                ANIMATION_SETTINGS.opacity,

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

                    points:
                        points,

                    progress:
                        i / count,

                    speed:
                        getStrokeSpeed(
                            segment.value
                        ),

                    marker:
                        marker

                });

            }

        }
    );

}


// ============================================================
// 48. КОЛИЧЕСТВО ШТРИХОВ
// ============================================================

function getStrokeCount(
    value
) {

    return Math.max(

        ANIMATION_SETTINGS.minStrokes,

        Math.min(

            ANIMATION_SETTINGS.maxStrokes,

            Math.round(
                Math.log10(
                    value + 1
                )
            )

        )

    );

}


// ============================================================
// 49. СКОРОСТЬ
// ============================================================

function getStrokeSpeed(
    value
) {

    const multiplier =
        0.8 +
        Math.min(
            1.4,
            Math.log10(
                value + 1
            ) / 5
        );


    return (
        ANIMATION_SETTINGS.speed *
        multiplier
    );

}


// ============================================================
// 50. ОЧИСТКА АНИМАЦИИ
// ============================================================

function clearAnimationStrokes() {

    animationLayer.clearLayers();

    animationStrokes = [];

}


// ============================================================
// 51. АНИМАЦИЯ
// ============================================================

function animateFlowStrokes(
    timestamp
) {

    if (
        !animationRunning
    ) {

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
                ANIMATION_SETTINGS.strokeLength;


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


// ============================================================
// 52. ТОЧКА НА ПУТИ
// ============================================================

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
        (points.length - 1);


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
        (p2[0] - p1[0]) *
        local,

        p1[1] +
        (p2[1] - p1[1]) *
        local

    ];

}


// ============================================================
// 53. КНОПКА АНИМАЦИИ
// ============================================================

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


// ============================================================
// 54. ТАБЛИЦЫ
// ============================================================

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


    if (
        tablesVisible
    ) {

        updateTables();

    }

}


// ============================================================
// 55. ОБНОВЛЕНИЕ ТАБЛИЦ
// ============================================================

function updateTables() {

    if (
        !tablesVisible
    ) {
        return;
    }


    createSourceTable();

    createDestinationTable();

}


// ============================================================
// 56. ТАБЛИЦА ИСХОДА
// ============================================================

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
            (
                a,
                b
            ) =>
                b.value - a.value
        );


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
                        Переселенцев
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


// ============================================================
// 57. ТАБЛИЦА НАЗНАЧЕНИЯ
// ============================================================

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
            (
                a,
                b
            ) =>
                b.value - a.value
        );


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
                        Переселенцев
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


// ============================================================
// 58. МАСШТАБ КАРТЫ
// ============================================================

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
                "Не удалось определить границы GeoJSON",
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


    if (
        points.length
    ) {

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


// ============================================================
// 59. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function clean(value) {

    return String(
        value ?? ""
    )
    .replace(/^\uFEFF/, "")
    .trim();

}


// ============================================================

function normalizeName(
    value
) {

    return clean(
        value
    )
    .toLowerCase()
    .replace(
        /\s+/g,
        " "
    );

}


// ============================================================

function parseNumber(
    value
) {

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


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


// ============================================================

function parseCoordinate(
    value
) {

    let text =
        String(
            value ?? ""
        )
        .trim();


    // Удаляем BOM
    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    // В твоём NODES иногда встречается
    // завершающая запятая:
    //
    // 48.612383370883187,
    //
    text =
        text.replace(
            /,+$/,
            ""
        );


    // Если используется десятичная запятая
    text =
        text.replace(
            ",",
            "."
        );


    return parseFloat(
        text
    );

}


// ============================================================

function formatNumber(
    value
) {

    return Math.round(
        Number(value) || 0
    ).toLocaleString(
        "ru-RU"
    );

}


// ============================================================

function escapeHTML(
    text
) {

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


// ============================================================
// 60. СООБЩЕНИЕ ОБ ОШИБКЕ
// ============================================================

function showError(
    message
) {

    const div =
        document.createElement(
            "div"
        );


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
        "#ffffff";

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
