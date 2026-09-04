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
// data/EDGES.csv
// Каждая строка:
// N301;N310;N311;N312
//
// означает:
// N301 → N310 → N311 → N312
//
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
// 2. НАСТРОЙКИ КАРТЫ
// ============================================================

const SETTINGS = {

    flowColor: "#c62828",

    flowOpacity: 0.65,

    minFlowWidth: 1.2,

    maxFlowWidth: 30,

    nodeRadius: 3,

    curveFactor: 0.06,

    curveSteps: 12,

    regionColor: "#777",

    regionFillColor: "#eeeeee",

    regionFillOpacity: 0.18

};


// ============================================================
// 3. ГОДЫ
// ============================================================

(function injectYearControlStyles() {

    if (document.getElementById("migrationYearStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "migrationYearStyles";

    style.textContent = `

        #yearControls {

            position: fixed;

            left: 50%;

            bottom: 18px;

            transform: translateX(-50%);

            z-index: 1000;

            background: rgba(255,255,255,0.96);

            padding: 10px 14px 9px;

            border-radius: 10px;

            box-shadow:
                0 2px 12px rgba(0,0,0,0.22);

            font-family: Arial, sans-serif;

            min-width:
                min(760px, calc(100vw - 36px));

            box-sizing: border-box;

        }


        .yearControlsTitle {

            text-align: center;

            font-size: 13px;

            font-weight: 600;

            margin-bottom: 7px;

        }


        .yearButtonsRow {

            display: flex;

            flex-wrap: wrap;

            justify-content: center;

            gap: 4px;

        }


        .yearButton {

            border: 1px solid #bbb;

            background: #fff;

            color: #333;

            border-radius: 5px;

            padding: 4px 7px;

            font-size: 12px;

            cursor: pointer;

            transition:
                all 0.12s ease;

        }


        .yearButton:hover {

            background: #f0f0f0;

        }


        .yearButton.active {

            background: #333;

            color: #fff;

            border-color: #333;

        }


        .yearSliderWrap {

            padding: 5px 4px 0;

        }


        .yearSlider {

            width: 100%;

            display: block;

            cursor: pointer;

        }


        .yearSliderLabels {

            display: flex;

            justify-content: space-between;

            font-size: 10px;

            color: #666;

            padding: 1px 2px 0;

        }


        @media (max-width: 700px) {

            #yearControls {

                bottom: 8px;

                padding: 8px;

                min-width:
                    calc(100vw - 16px);

            }


            .yearButton {

                padding: 3px 5px;

                font-size: 11px;

            }

        }

    `;

    document.head.appendChild(style);

})();


const YEARS = [];


for (
    let year = 1896;
    year <= 1916;
    year++
) {

    YEARS.push(year);

}


let currentYear = 1896;


// ============================================================
// 4. ГЛОБАЛЬНЫЕ ДАННЫЕ
// ============================================================

let migrationFrom = [];

let migrationTo = [];

let nodes = {};

let regions = {};

let rawEdges = [];

let graph = {};

let destinationByEdge = {};

let segments = [];

let routeCache = {};


// ============================================================
// 5. КАРТА
// ============================================================

const map = L.map(
    "map",
    {
        zoomControl: true
    }
);


L.tileLayer(

    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    {

        attribution:
            "&copy; OpenStreetMap contributors"

    }

).addTo(map);


map.setView(
    [55, 70],
    4
);


// ============================================================
// 6. СЛОИ
// ============================================================

const regionsLayer =
    L.layerGroup().addTo(map);


const flowsLayer =
    L.layerGroup().addTo(map);


// Технические узлы НЕ показываем

const nodesLayer =
    L.layerGroup();


const animationLayer =
    L.layerGroup().addTo(map);


// ============================================================
// 7. ЗАПУСК
// ============================================================

loadEverything();


// ============================================================
// 8. ЗАГРУЗКА ВСЕХ ДАННЫХ
// ============================================================

async function loadEverything() {

    try {

        console.clear();

        console.log(
            "========================================"
        );

        console.log(
            "ЗАГРУЗКА КАРТЫ МИГРАЦИЙ"
        );

        console.log(
            "========================================"
        );


        const [

            fromData,

            toData,

            nodeData,

            edgeText,

            geojson

        ] = await Promise.all([

            loadFirstAvailableCSV(
                FILES.migrationFrom
            ),

            loadFirstAvailableCSV(
                FILES.migrationTo
            ),

            loadFirstAvailableCSV(
                FILES.nodes
            ),

            loadFirstAvailableText(
                FILES.edges
            ),

            loadFirstAvailableJSON(
                FILES.geojson
            )

        ]);


        prepareMigrationFrom(
            fromData
        );


        prepareMigrationTo(
            toData
        );


        prepareNodes(
            nodeData
        );


        prepareRegions(
            geojson
        );


        prepareGraph(
            edgeText
        );


        prepareDestinationEdges();


        createYearButtons();


        drawRegions();


        renderYear(
            currentYear
        );


        fitMap();


        console.log(
            "Карта успешно загружена"
        );


        console.log(
            "Текущий год:",
            currentYear
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Ошибка загрузки:\n\n" +
            error.message
        );

    }

}


// ============================================================
// 9. ЗАГРУЗКА CSV
// ============================================================

async function loadFirstAvailableCSV(paths) {

    const text =
        await loadFirstAvailableText(paths);


    return parseCSV(text);

}


// ============================================================
// 10. ЗАГРУЗКА ТЕКСТА
// ============================================================

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

            lastError = error;

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
// 11. ЗАГРУЗКА JSON
// ============================================================

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

            lastError = error;

        }

    }


    throw new Error(
        "Не удалось загрузить GeoJSON"
    );

}


// ============================================================
// 12. ПАРСЕР CSV
// ============================================================

function parseCSV(text) {

    text =
        String(text)
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


    if (lines.length === 0) {

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
            (
                header,
                index
            ) => {

                row[header] =
                    clean(
                        values[index] ?? ""
                    );

            }
        );


        result.push(row);

    }


    return result;

}


// ============================================================
// 13. ПАРСЕР СТРОКИ CSV
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

        const char = line[i];


        if (char === '"') {

            quoted = !quoted;

        }

        else if (
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


// ============================================================
// 14. MIGRATION_FROM
// ============================================================

function prepareMigrationFrom(data) {

    migrationFrom = [];


    data.forEach(row => {

        const origin =
            clean(row.Origin);


        const edge =
            clean(row.EDGE);


        if (
            !origin ||
            !edge
        ) {

            return;

        }


        const values =
            getYearValues(row);


        migrationFrom.push({

            origin,

            edge,

            values

        });

    });


    console.log(
        "Источников:",
        migrationFrom.length
    );

}


// ============================================================
// 15. MIGRATION_TO
// ============================================================

function prepareMigrationTo(data) {

    migrationTo = [];


    data.forEach(row => {

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


        const values =
            getYearValues(row);


        migrationTo.push({

            destination,

            edge,

            values

        });

    });


    console.log(
        "Конечных пунктов:",
        migrationTo.length
    );

}


// ============================================================
// 16. ГОДОВЫЕ ЗНАЧЕНИЯ
// ============================================================

function getYearValues(row) {

    const values = {};


    YEARS.forEach(year => {

        const column =
            `year_${year}`;


        values[year] =
            parseNumber(
                row[column]
            ) || 0;

    });


    return values;

}


// ============================================================
// 17. NODES
// ============================================================
//
// Поддерживаются:
//
// NODE;LONG;LAT
//
// и:
//
// id;lat;lon
//
// ============================================================

function prepareNodes(data) {

    nodes = {};


    data.forEach(row => {

        const id =
            clean(

                row.NODE ||

                row.id ||

                row.Id ||

                row.ID

            );


        if (
            !id ||
            id === "Nnull"
        ) {

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
            isNaN(lat) ||
            isNaN(lon)
        ) {

            console.warn(
                "Некорректный узел:",
                id,
                row
            );

            return;

        }


        nodes[id] = {

            id,

            lat,

            lon

        };

    });


    console.log(
        "Узлов:",
        Object.keys(nodes).length
    );

}


// ============================================================
// 18. GEOJSON
// ============================================================

function prepareRegions(geojson) {

    regions = {};


    geojson.features.forEach(feature => {

        const properties =
            feature.properties || {};


        const name =
            clean(

                properties.prov_ENG ||

                properties.name ||

                properties.NAME

            );


        if (!name) {

            return;

        }


        regions[name] = {

            name,

            feature

        };

    });


    console.log(
        "Регионов:",
        Object.keys(regions).length
    );

}


// ============================================================
// 19. ПОСТРОЕНИЕ ГРАФА EDGES
// ============================================================
//
// Каждая строка:
//
// N301;N310;N311
//
// превращается в:
//
// N301 → N310
// N310 → N311
//
// ============================================================

function prepareGraph(text) {

    graph = {};

    rawEdges = [];

    routeCache = {};


    text =
        String(text)
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


    lines.forEach(line => {

        const values =
            parseCSVLine(line)
            .map(clean)
            .filter(
                value =>
                    value !== ""
            );


        if (
            values.length >= 2 &&
            values[0].toLowerCase() !== "from"
        ) {

            for (
                let i = 0;
                i < values.length - 1;
                i++
            ) {

                addGraphEdge(
                    values[i],
                    values[i + 1]
                );

            }

        }

    });


    console.log(
        "Связей в графе:",
        rawEdges.length
    );

}


// ============================================================
// 20. ДОБАВЛЕНИЕ СВЯЗИ
// ============================================================

function addGraphEdge(from, to) {

    if (!graph[from]) {

        graph[from] = [];

    }


    if (
        !graph[from].includes(to)
    ) {

        graph[from].push(to);


        rawEdges.push({

            from,

            to

        });

    }

}


// ============================================================
// 21. КОНЕЧНЫЕ УЗЛЫ
// ============================================================
//
// migration_to:
//
// Томская;N178
//
// означает:
//
// ... → N178 → Томская
//
// ============================================================

function prepareDestinationEdges() {

    destinationByEdge = {};


    migrationTo.forEach(item => {

        destinationByEdge[item.edge] = item;

    });


}


// ============================================================
// 22. КНОПКИ ГОДОВ + ПОЛЗУНОК
// ============================================================

function createYearButtons() {

    let container =
        document.getElementById(
            "yearControls"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "yearControls";

        document.body.appendChild(
            container
        );

    }


    container.innerHTML = "";


    // --------------------------------------------------------
    // Заголовок
    // --------------------------------------------------------

    const buttonsTitle =
        document.createElement("div");


    buttonsTitle.className =
        "yearControlsTitle";


    buttonsTitle.textContent =
        "Год";


    container.appendChild(
        buttonsTitle
    );


    // --------------------------------------------------------
    // Кнопки
    // --------------------------------------------------------

    const buttonsRow =
        document.createElement("div");


    buttonsRow.className =
        "yearButtonsRow";


    container.appendChild(
        buttonsRow
    );


    YEARS.forEach(year => {

        const button =
            document.createElement("button");


        button.className =
            "yearButton";


        button.dataset.year =
            year;


        button.textContent =
            year;


        button.type =
            "button";


        button.addEventListener(
            "click",
            () => {

                setYear(year);

            }
        );


        buttonsRow.appendChild(
            button
        );

    });


    // --------------------------------------------------------
    // Ползунок
    // --------------------------------------------------------

    const sliderWrap =
        document.createElement("div");


    sliderWrap.className =
        "yearSliderWrap";


    const slider =
        document.createElement("input");


    slider.id =
        "yearSlider";


    slider.type =
        "range";


    slider.min =
        YEARS[0];


    slider.max =
        YEARS[YEARS.length - 1];


    slider.step =
        1;


    slider.value =
        currentYear;


    slider.className =
        "yearSlider";


    slider.addEventListener(
        "input",
        () => {

            setYear(
                Number(slider.value)
            );

        }
    );


    sliderWrap.appendChild(
        slider
    );


    container.appendChild(
        sliderWrap
    );


    // --------------------------------------------------------
    // Подписи
    // --------------------------------------------------------

    const sliderLabels =
        document.createElement("div");


    sliderLabels.className =
        "yearSliderLabels";


    sliderLabels.innerHTML =

        `<span>${YEARS[0]}</span>` +

        `<span>${YEARS[YEARS.length - 1]}</span>`;


    container.appendChild(
        sliderLabels
    );


    updateYearControls();

}


// ============================================================
// 23. УСТАНОВКА ГОДА
// ============================================================

function setYear(year) {

    year =
        Number(year);


    if (
        !YEARS.includes(year)
    ) {

        return;

    }


    renderYear(year);

}


// ============================================================
// 24. ОБНОВЛЕНИЕ ЭЛЕМЕНТОВ ГОДА
// ============================================================

function updateYearControls() {

    document
        .querySelectorAll(".yearButton")
        .forEach(button => {

            button.classList.toggle(

                "active",

                Number(
                    button.dataset.year
                ) === currentYear

            );

        });


    const slider =
        document.getElementById(
            "yearSlider"
        );


    if (slider) {

        slider.value =
            currentYear;

    }


    const currentYearElement =
        document.getElementById(
            "currentYear"
        );


    if (currentYearElement) {

        currentYearElement.textContent =
            currentYear;

    }

}


// ============================================================
// 25. СМЕНА ГОДА
// ============================================================

function renderYear(year) {

    currentYear =
        Number(year);


    // Останавливаем анимацию
    // перед перерисовкой.

    stopFlowAnimation();


    console.log(
        "========================================"
    );


    console.log(
        "ГОД:",
        currentYear
    );


    // Перерисовываем регионы,
    // чтобы tooltip содержал данные
    // именно выбранного года.

    drawRegions();


    // Рассчитываем маршруты.

    calculateSegmentsForYear(
        currentYear
    );


    // Рисуем потоки.

    drawFlows();


    // Обновляем кнопки и ползунок.

    updateYearControls();


    console.log(
        "Сегментов:",
        segments.length
    );

}


// ============================================================
// СОВМЕСТИМОСТЬ СО СТАРЫМ КОДОМ
// ============================================================

function updateYearButtons() {

    updateYearControls();

}


function updateYearTitle() {

    const element =
        document.getElementById(
            "currentYear"
        );


    if (element) {

        element.textContent =
            currentYear;

    }

}


// ============================================================
// 26. РАСЧЁТ СЕГМЕНТОВ ЗА ГОД
// ============================================================

function calculateSegmentsForYear(year) {

    const segmentMap = {};


    // --------------------------------------------------------
    // Для каждого источника
    // --------------------------------------------------------

    migrationFrom.forEach(source => {

        const sourceValue =
            source.values[year] || 0;


        if (
            sourceValue <= 0
        ) {

            return;

        }


        // ----------------------------------------------------
        // Ищем все конечные направления
        // ----------------------------------------------------

        const routes =
            getRoutesFromSourceEdge(
                source.edge
            );


        if (
            routes.length === 0
        ) {

            console.warn(

                "Нет маршрута:",

                source.origin,

                source.edge

            );


            return;

        }


        // ----------------------------------------------------
        // Распределяем источник
        // ----------------------------------------------------

        const weightedRoutes =
            getWeightedRoutes(
                routes,
                year
            );


        // ----------------------------------------------------
        // Добавляем потоки
        // ----------------------------------------------------

        weightedRoutes.forEach(route => {

            const flow =
                sourceValue *
                route.weight;


            addRouteFlow(

                segmentMap,

                route.path,

                flow,

                source.origin,

                route.destination

            );

        });

    });


    segments =
        Object.values(
            segmentMap
        );


    console.log(
        "Итоговых сегментов:",
        segments.length
    );

}


// ============================================================
// 27. ПОИСК МАРШРУТОВ ОТ EDGE ИСТОЧНИКА
// ============================================================

function getRoutesFromSourceEdge(startEdge) {

    if (
        routeCache[startEdge]
    ) {

        return routeCache[startEdge];

    }


    const routes = [];


    walkGraphToDestinations(

        startEdge,

        [startEdge],

        new Set(),

        routes

    );


    routeCache[startEdge] =
        routes;


    return routes;

}


// ============================================================
// 28. ОБХОД ГРАФА
// ============================================================

function walkGraphToDestinations(

    current,

    path,

    visited,

    routes

) {

    // --------------------------------------------------------
    // Защита от циклов
    // --------------------------------------------------------

    if (
        visited.has(current)
    ) {

        return;

    }


    const newVisited =
        new Set(visited);


    newVisited.add(current);


    // --------------------------------------------------------
    // Если это конечный EDGE
    // --------------------------------------------------------

    if (
        destinationByEdge[current]
    ) {

        const destination =
            destinationByEdge[current];


        routes.push({

            destination:
                destination.destination,

            destinationEdge:
                current,

            path:
                [...path]

        });


        return;

    }


    // --------------------------------------------------------
    // Идём дальше
    // --------------------------------------------------------

    const outgoing =
        graph[current] || [];


    outgoing.forEach(next => {

        walkGraphToDestinations(

            next,

            [
                ...path,
                next
            ],

            newVisited,

            routes

        );

    });

}


// ============================================================
// 29. ВЕСА КОНЕЧНЫХ НАПРАВЛЕНИЙ
// ============================================================
//
// Если доступны:
//
// Томская     75419
// Енисейская  20195
//
// то поток источника распределяется
// пропорционально этим значениям.
//
// ============================================================

function getWeightedRoutes(
    routes,
    year
) {

    const routesWithValues =
        routes.map(route => {

            const destination =
                destinationByEdge[
                    route.destinationEdge
                ];


            const value =
                destination
                    ? (
                        destination.values[year] || 0
                    )
                    : 0;


            return {

                ...route,

                destinationValue:
                    value

            };

        });


    const total =
        routesWithValues.reduce(

            (
                sum,
                route
            ) =>

                sum +
                route.destinationValue,

            0

        );


    // --------------------------------------------------------
    // Есть значения назначения
    // --------------------------------------------------------

    if (
        total > 0
    ) {

        return routesWithValues.map(
            route => ({

                ...route,

                weight:
                    route.destinationValue /
                    total

            })
        );

    }


    // --------------------------------------------------------
    // Если все значения 0 —
    // распределяем поровну
    // --------------------------------------------------------

    const equalWeight =
        1 /
        routesWithValues.length;


    return routesWithValues.map(
        route => ({

            ...route,

            weight:
                equalWeight

        })
    );

}


// ============================================================
// 30. ДОБАВЛЕНИЕ ПОТОКА НА СЕГМЕНТ
// ============================================================

function addRouteFlow(

    segmentMap,

    path,

    flow,

    origin,

    destination

) {

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
            `${from}||${to}`;


        if (
            !segmentMap[key]
        ) {

            segmentMap[key] = {

                from,

                to,

                value: 0,

                origins: {},

                destinations: {}

            };

        }


        segmentMap[key].value +=
            flow;


        if (
            !segmentMap[key]
                .origins[origin]
        ) {

            segmentMap[key]
                .origins[origin] = 0;

        }


        segmentMap[key]
            .origins[origin] +=
            flow;


        if (
            !segmentMap[key]
                .destinations[destination]
        ) {

            segmentMap[key]
                .destinations[destination] = 0;

        }


        segmentMap[key]
            .destinations[destination] +=
            flow;

    }

}


// ============================================================
// 31. РИСОВАНИЕ РЕГИОНОВ
// ============================================================
//
// ВАЖНО:
//
// Здесь НЕ используются рассчитанные segments.
//
// Tooltip берёт значения непосредственно:
//
// migration_from.csv
// migration_to.csv
//
// за выбранный год.
//
// ============================================================

function drawRegions() {

    regionsLayer.clearLayers();


    const fromValues = {};

    const toValues = {};


    migrationFrom.forEach(item => {

        fromValues[item.origin] =
            item.values[currentYear] || 0;

    });


    migrationTo.forEach(item => {

        toValues[item.destination] =
            item.values[currentYear] || 0;

    });


    Object.values(regions)
        .forEach(region => {

            const layer =
                L.geoJSON(

                    region.feature,

                    {

                        style: {

                            color:
                                SETTINGS.regionColor,

                            weight:
                                0.8,

                            fillColor:
                                SETTINGS.regionFillColor,

                            fillOpacity:
                                SETTINGS.regionFillOpacity

                        }

                    }

                );


            const hasFrom =
                Object.prototype.hasOwnProperty.call(

                    fromValues,

                    region.name

                );


            const hasTo =
                Object.prototype.hasOwnProperty.call(

                    toValues,

                    region.name

                );


            let html =

                `<b>${escapeHTML(
                    region.name
                )}</b>`;


            if (hasFrom) {

                html +=

                    `<br>Исходящие: <b>` +

                    `${formatNumber(
                        fromValues[region.name]
                    )}` +

                    `</b>`;

            }


            if (hasTo) {

                html +=

                    `<br>Прибывшие: <b>` +

                    `${formatNumber(
                        toValues[region.name]
                    )}` +

                    `</b>`;

            }


            if (
                !hasFrom &&
                !hasTo
            ) {

                html +=

                    `<br>Нет данных за ` +

                    `${currentYear}`;

            }


            layer.bindTooltip(

                html,

                {

                    sticky: true,

                    direction: "auto",

                    opacity: 0.95

                }

            );


            layer.on(
                "mouseover",
                () => {

                    layer.setStyle({

                        weight: 1.5,

                        fillOpacity: 0.28

                    });

                }
            );


            layer.on(
                "mouseout",
                () => {

                    layer.setStyle({

                        weight: 0.8,

                        fillOpacity:
                            SETTINGS.regionFillOpacity

                    });

                }
            );


            layer.addTo(
                regionsLayer
            );

        });

}


// ============================================================
// 32. УЗЛЫ НЕ РИСУЕМ
// ============================================================

function drawNodes() {

    nodesLayer.clearLayers();

}


// ============================================================
// 33. РИСОВАНИЕ ПОТОКОВ
// ============================================================

function drawFlows() {

    flowsLayer.clearLayers();


    if (
        segments.length === 0
    ) {

        console.warn(
            "Нет сегментов для года",
            currentYear
        );


        return;

    }


    segments.forEach(segment => {

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

                "→",

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
                        SETTINGS.flowColor,

                    weight:
                        getFlowWidth(
                            segment.value
                        ),

                    opacity:
                        SETTINGS.flowOpacity,

                    lineCap:
                        "round",

                    lineJoin:
                        "round"

                }

            );


        line.bindTooltip(

            `<b>${escapeHTML(
                segment.from
            )} → ${escapeHTML(
                segment.to
            )}</b><br>` +

            `${formatNumber(
                segment.value
            )} переселенцев<br>` +

            `Год: ${currentYear}`,

            {

                sticky: true

            }

        );


        line.on(
            "click",
            () => {

                showSegmentInfo(
                    segment
                );

            }
        );


        line.addTo(
            flowsLayer
        );

    });

}


// ============================================================
// 34. КООРДИНАТЫ УЗЛА
// ============================================================

function getNodePoint(id) {

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
// 35. ТОЛЩИНА ПОТОКА
// ============================================================

function getFlowWidth(value) {

    if (
        value <= 0
    ) {

        return SETTINGS.minFlowWidth;

    }


    const width =

        SETTINGS.minFlowWidth +

        Math.log10(
            value + 1
        ) * 3.5;


    return Math.min(

        SETTINGS.maxFlowWidth,

        width

    );

}


// ============================================================
// 36. ПЛАВНАЯ ЛИНИЯ
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
            )

            +

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

            2 *
            mt *
            t *
            controlLat +

            t * t * lat2,

            mt * mt * lon1 +

            2 *
            mt *
            t *
            controlLon +

            t * t * lon2

        ]);

    }


    return points;

}


// ============================================================
// 37. ИНФОРМАЦИЯ О СЕГМЕНТЕ
// ============================================================

function showSegmentInfo(segment) {

    const info =
        document.getElementById(
            "info"
        );


    if (!info) {

        return;

    }


    const origins =
        Object.entries(
            segment.origins
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
            10
        );


    const destinations =
        Object.entries(
            segment.destinations
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
            10
        );


    let originsHTML = "";


    let destinationsHTML = "";


    origins.forEach(item => {

        originsHTML +=

            `<div>` +

            `${escapeHTML(
                item[0]
            )}: ` +

            `<b>${formatNumber(
                item[1]
            )}</b>` +

            `</div>`;

    });


    destinations.forEach(item => {

        destinationsHTML +=

            `<div>` +

            `${escapeHTML(
                item[0]
            )}: ` +

            `<b>${formatNumber(
                item[1]
            )}</b>` +

            `</div>`;

    });


    info.innerHTML =

        `<h3>${currentYear}</h3>` +

        `<p>` +

        `<b>${escapeHTML(
            segment.from
        )}</b>` +

        ` → ` +

        `<b>${escapeHTML(
            segment.to
        )}</b>` +

        `</p>` +

        `<p>` +

        `Всего: ` +

        `<b>${formatNumber(
            segment.value
        )}</b>` +

        ` переселенцев` +

        `</p>` +

        `<hr>` +

        `<b>Основные источники:</b>` +

        originsHTML +

        `<hr>` +

        `<b>Основные направления:</b>` +

        destinationsHTML;

}


// ============================================================
// 38. АНИМАЦИЯ ШТРИХАМИ
// ============================================================

let animationRunning = false;


let animationFrame = null;


let animationStrokes = [];


const ANIMATION_SETTINGS = {

    speed: 0.00018,

    strokeLength: 0.05,

    minStrokes: 1,

    maxStrokes: 7,

    width: 3,

    opacity: 0.95,

    color: "#ffffff"

};


// ============================================================
// 39. ЗАПУСК АНИМАЦИИ
// ============================================================

function startFlowAnimation() {

    if (
        animationRunning
    ) {

        return;

    }


    animationRunning = true;


    createAnimationStrokes();


    animationFrame =
        requestAnimationFrame(
            animateFlowStrokes
        );


    updateAnimationButton();

}


// ============================================================
// 40. ОСТАНОВКА АНИМАЦИИ
// ============================================================

function stopFlowAnimation() {

    animationRunning = false;


    if (
        animationFrame
    ) {

        cancelAnimationFrame(
            animationFrame
        );


        animationFrame = null;

    }


    clearAnimationStrokes();


    updateAnimationButton();

}


// ============================================================
// 41. СОЗДАНИЕ ШТРИХОВ
// ============================================================

function createAnimationStrokes() {

    clearAnimationStrokes();


    segments.forEach(segment => {

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
                            ANIMATION_SETTINGS.color,

                        weight:
                            ANIMATION_SETTINGS.width,

                        opacity:
                            ANIMATION_SETTINGS.opacity,

                        lineCap:
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
                    i / count,

                speed:
                    getStrokeSpeed(
                        segment.value
                    ),

                marker

            });

        }

    });

}


// ============================================================
// 42. КОЛИЧЕСТВО ШТРИХОВ
// ============================================================

function getStrokeCount(value) {

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
// 43. СКОРОСТЬ ШТРИХА
// ============================================================

function getStrokeSpeed(value) {

    const multiplier =

        0.8 +

        Math.min(

            1.2,

            Math.log10(
                value + 1
            ) / 6

        );


    return (

        ANIMATION_SETTINGS.speed *

        multiplier

    );

}


// ============================================================
// 44. ОЧИСТКА ШТРИХОВ
// ============================================================

function clearAnimationStrokes() {

    animationLayer.clearLayers();

    animationStrokes = [];

}


// ============================================================
// 45. АНИМАЦИЯ
// ============================================================

function animateFlowStrokes() {

    if (
        !animationRunning
    ) {

        return;

    }


    animationStrokes.forEach(stroke => {

        stroke.progress +=

            stroke.speed *
            16;


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

    });


    animationFrame =
        requestAnimationFrame(
            animateFlowStrokes
        );

}


// ============================================================
// 46. ТОЧКА НА ПУТИ
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
        (
            points.length - 1
        );


    const index =
        Math.floor(
            position
        );


    const local =
        position - index;


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


// ============================================================
// 47. КНОПКА АНИМАЦИИ
// ============================================================

function updateAnimationButton() {

    const button =
        document.getElementById(
            "animationToggle"
        );


    if (
        !button
    ) {

        return;

    }


    button.textContent =

        animationRunning

            ? "⏸ Остановить потоки"

            : "▶ Запустить потоки";

}


// ============================================================
// 48. ОБРАБОТЧИК АНИМАЦИИ
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const button =
            document.getElementById(
                "animationToggle"
            );


        if (
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            () => {

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


        updateAnimationButton();

    }
);


// ============================================================
// 49. МАСШТАБ КАРТЫ
// ============================================================

function fitMap() {

    const bounds =
        regionsLayer.getBounds();


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


// ============================================================
// 50. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

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


    return isNaN(number)
        ? 0
        : number;

}


function parseCoordinate(value) {

    return parseFloat(

        String(
            value ?? ""
        )
        .replace(
            /,$/,
            ""
        )
        .replace(
            ",",
            "."
        )

    );

}


function formatNumber(value) {

    return Math.round(
        value
    ).toLocaleString(
        "ru-RU"
    );

}


function escapeHTML(text) {

    return String(text)

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
