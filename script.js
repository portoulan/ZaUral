// ============================================================
// ИНТЕРАКТИВНАЯ КАРТА МИГРАЦИЙ
// ============================================================
//
// Структура файлов:
//
// /
// ├── index.html
// ├── style.css
// ├── script.js
// └── data/
//      ├── migration.csv
//      ├── NODES
//      ├── EDGES
//      └── data.geojson
//
// ============================================================


// ============================================================
// 1. НАСТРОЙКИ ФАЙЛОВ
// ============================================================
//
// Если у тебя NODES и EDGES имеют расширение .csv,
// скрипт автоматически попробует сначала .csv,
// затем вариант без расширения.
//

const FILES = {

    migration: [
        "data/migration.csv"
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
// 2. НАСТРОЙКИ ОТОБРАЖЕНИЯ
// ============================================================

const SETTINGS = {

    flowColor: "#c62828",

    flowOpacity: 0.68,

    minFlowWidth: 1.5,

    maxFlowWidth: 30,

    nodeRadius: 4,

    // Насколько изгибать линии
    curveFactor: 0.08,

    // Количество точек кривой
    curveSteps: 20

};


// ============================================================
// 3. ГЛОБАЛЬНЫЕ ДАННЫЕ
// ============================================================

let migrations = [];

let nodes = {};

let regions = {};

let rawRoutes = [];

let segments = [];


// ============================================================
// 4. СОЗДАНИЕ КАРТЫ
// ============================================================

const map = L.map("map", {

    zoomControl: true

});


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
// 5. СЛОИ
// ============================================================

const regionsLayer =
    L.layerGroup().addTo(map);


const flowsLayer =
    L.layerGroup().addTo(map);


const nodesLayer =
    L.layerGroup().addTo(map);


// ============================================================
// 6. ЗАПУСК
// ============================================================

loadEverything();


// ============================================================
// 7. ЗАГРУЗКА ВСЕХ ДАННЫХ
// ============================================================

async function loadEverything() {

    try {

        console.clear();

        console.log(
            "=========================================="
        );

        console.log(
            "ЗАПУСК КАРТЫ МИГРАЦИЙ"
        );

        console.log(
            "=========================================="
        );


        // ----------------------------------------------------
        // MIGRATION
        // ----------------------------------------------------

        const migrationData =
            await loadFirstAvailable(
                FILES.migration
            );


        // ----------------------------------------------------
        // NODES
        // ----------------------------------------------------

        const nodeData =
            await loadFirstAvailable(
                FILES.nodes
            );


        // ----------------------------------------------------
        // EDGES
        // ----------------------------------------------------

        const edgeText =
            await loadFirstAvailableText(
                FILES.edges
            );


        // ----------------------------------------------------
        // GEOJSON
        // ----------------------------------------------------

        const geojson =
            await loadFirstAvailableJSON(
                FILES.geojson
            );


        console.log(
            "Все файлы загружены"
        );


        // ----------------------------------------------------
        // Обработка
        // ----------------------------------------------------

        prepareMigrations(
            migrationData
        );


        prepareNodes(
            nodeData
        );


        prepareRegions(
            geojson
        );


        prepareRoutes(
            edgeText
        );


        // ----------------------------------------------------
        // Отображение
        // ----------------------------------------------------

        drawRegions();

        drawNodes();


        // ----------------------------------------------------
        // Расчёт потоков
        // ----------------------------------------------------

        calculateSegments();


        // ----------------------------------------------------
        // Отрисовка потоков
        // ----------------------------------------------------

        drawFlows();


        // ----------------------------------------------------
        // Масштаб
        // ----------------------------------------------------

        fitMap();


        // ----------------------------------------------------
        // Диагностика
        // ----------------------------------------------------

        checkGraph();


        console.log(
            "=========================================="
        );

        console.log(
            "КАРТА ГОТОВА"
        );

        console.log(
            "=========================================="
        );

    }

    catch (error) {

        console.error(
            "ОШИБКА:",
            error
        );


        alert(

            "Ошибка загрузки карты:\n\n" +

            error.message

        );

    }

}


// ============================================================
// 8. ЗАГРУЗКА ПЕРВОГО ДОСТУПНОГО ФАЙЛА
// ============================================================

async function loadFirstAvailable(
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

                const text =
                    await response.text();


                return parseCSV(
                    text
                );

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
// 9. ЗАГРУЗКА ТЕКСТА
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
        "Не удалось загрузить:\n" +
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
// 10. ЗАГРУЗКА JSON
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
        "Не удалось загрузить:\n" +
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
// 11. ПАРСЕР CSV
// ============================================================

function parseCSV(
    text
) {

    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    text =
        text
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            );


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
        .map(
            clean
        );


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
            (
                header,
                index
            ) => {

                row[header] =
                    values[index] !== undefined
                        ? clean(
                            values[index]
                        )
                        : "";

            }
        );


        result.push(
            row
        );

    }


    return result;

}


// ============================================================
// 12. ПАРСЕР EDGES
// ============================================================
//
// ВАЖНО:
//
// EDGES НЕ является обычной таблицей.
//
// Например:
//
// Бессарабская;N189
//
// Кубанская;N190
//
// N190;N191;N193
//
// N191;N193
//
// N189;N192;N193;...;N226;Приморская
//
// Каждая строка — отдельный маршрут/цепочка.
//
// Поэтому сохраняем каждую строку как массив объектов.
//

function parseEdges(
    text
) {

    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    text =
        text
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            );


    const lines =
        text
            .split("\n")
            .filter(
                line =>
                    line.trim() !== ""
            );


    const rows = [];


    // Первая строка:
    //
    // from;to;;;;;;;;;
    //
    // пропускается.

    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const values =
            parseCSVLine(
                lines[i]
            )
            .map(
                clean
            )
            .filter(
                value =>
                    value !== ""
            );


        if (
            values.length >= 2
        ) {

            rows.push(
                values
            );

        }

    }


    return rows;

}


// ============================================================
// 13. ПАРСЕР ОДНОЙ CSV-СТРОКИ
// ============================================================

function parseCSVLine(
    line
) {

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

            if (
                quoted &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            }

            else {

                quoted =
                    !quoted;

            }

        }

        else if (
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
// 14. ОЧИСТКА
// ============================================================

function clean(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /^\uFEFF/,
            ""
        )
        .trim();

}


// ============================================================
// 15. MIGRATION
// ============================================================

function prepareMigrations(
    data
) {

    migrations = [];


    data.forEach(
        row => {

            const origin =
                clean(
                    row.Origin
                );


            const number =
                parseNumber(
                    row.Number
                );


            if (
                !origin ||
                isNaN(number) ||
                number <= 0
            ) {

                return;

            }


            migrations.push({

                origin:
                    origin,

                number:
                    number

            });

        }
    );


    console.log(
        "Количество миграционных записей:",
        migrations.length
    );

}


// ============================================================
// 16. NODES
// ============================================================

function prepareNodes(
    data
) {

    nodes = {};


    data.forEach(
        row => {

            const id =
                clean(
                    row.id
                );


            if (
                !id
            ) {

                return;

            }


            const lat =
                parseCoordinate(
                    row.lat
                );


            const lon =
                parseCoordinate(
                    row.lon
                );


            if (
                isNaN(lat) ||
                isNaN(lon)
            ) {

                console.warn(
                    "Некорректные координаты узла:",
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
        "Количество узлов:",
        Object.keys(nodes).length
    );

}


// ============================================================
// 17. КООРДИНАТЫ
// ============================================================

function parseCoordinate(
    value
) {

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
            .trim()

    );

}


// ============================================================
// 18. GEOJSON
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

        throw new Error(
            "В data.geojson отсутствует features"
        );

    }


    geojson.features.forEach(
        feature => {

            const properties =
                feature.properties || {};


            let name =
                clean(
                    properties.prov_ENG
                );


            if (
                !name
            ) {

                name =
                    clean(
                        properties.name
                    );

            }


            if (
                !name
            ) {

                name =
                    clean(
                        properties.NAME
                    );

            }


            if (
                !name
            ) {

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
        "Количество регионов GeoJSON:",
        Object.keys(regions).length
    );

}


// ============================================================
// 19. ПОСТРОЕНИЕ ГРАФА
// ============================================================
//
// Здесь происходит самое важное.
//
// Например:
//
// Бессарабская;N189
//
// превращается в:
//
// Бессарабская → N189
//
//
// А:
//
// N189;N192;N193;N194;N226;Приморская
//
// превращается в:
//
// N189 → N192
// N192 → N193
// N193 → N194
// N194 → N226
// N226 → Приморская
//
// ============================================================

function prepareRoutes(
    text
) {

    const rows =
        parseEdges(
            text
        );


    rawRoutes = [];


    rows.forEach(
        row => {

            const values =
                row
                    .map(
                        clean
                    )
                    .filter(
                        value =>
                            value !== ""
                    );


            if (
                values.length < 2
            ) {

                return;

            }


            for (
                let i = 0;
                i < values.length - 1;
                i++
            ) {

                const from =
                    values[i];


                const to =
                    values[i + 1];


                rawRoutes.push({

                    from:
                        from,

                    to:
                        to

                });

            }

        }
    );


    // --------------------------------------------------------
    // Удаляем дубли
    // --------------------------------------------------------

    const unique =
        new Map();


    rawRoutes.forEach(
        edge => {

            const key =
                edge.from +
                "||" +
                edge.to;


            if (
                !unique.has(key)
            ) {

                unique.set(
                    key,
                    edge
                );

            }

        }
    );


    rawRoutes =
        Array.from(
            unique.values()
        );


    console.log(
        "Всего рёбер графа:",
        rawRoutes.length
    );


    // --------------------------------------------------------
    // Критические проверки
    // --------------------------------------------------------

    debugNode(
        "N189"
    );


    debugNode(
        "N190"
    );


    debugNode(
        "N191"
    );


    debugNode(
        "N193"
    );


    debugNode(
        "N226"
    );

}


// ============================================================
// 20. ПРОВЕРКА УЗЛА
// ============================================================

function debugNode(
    id
) {

    const incoming =
        rawRoutes.filter(
            edge =>
                edge.to === id
        );


    const outgoing =
        rawRoutes.filter(
            edge =>
                edge.from === id
        );


    console.log(
        `УЗЕЛ ${id}:`
    );


    console.log(
        "  входящие:",
        incoming
    );


    console.log(
        "  исходящие:",
        outgoing
    );

}


// ============================================================
// 21. ПРОВЕРКА NODE
// ============================================================

function isNode(
    id
) {

    return (
        Object.prototype.hasOwnProperty.call(
            nodes,
            id
        )
    );

}


// ============================================================
// 22. ПРОВЕРКА REGION
// ============================================================

function isRegion(
    id
) {

    return (
        Object.prototype.hasOwnProperty.call(
            regions,
            id
        )
    );

}


// ============================================================
// 23. ПОЛУЧЕНИЕ КООРДИНАТ
// ============================================================

function getPoint(
    id
) {

    // --------------------------------------------------------
    // Узел
    // --------------------------------------------------------

    if (
        isNode(id)
    ) {

        return [

            nodes[id].lat,

            nodes[id].lon

        ];

    }


    // --------------------------------------------------------
    // Регион
    // --------------------------------------------------------

    if (
        isRegion(id)
    ) {

        return getRegionCenter(
            id
        );

    }


    return null;

}


// ============================================================
// 24. ЦЕНТР РЕГИОНА
// ============================================================

function getRegionCenter(
    name
) {

    const region =
        regions[name];


    if (
        !region
    ) {

        return null;

    }


    try {

        const layer =
            L.geoJSON(
                region.feature
            );


        const center =
            layer
                .getBounds()
                .getCenter();


        return [

            center.lat,

            center.lng

        ];

    }

    catch (
        error
    ) {

        console.warn(
            "Ошибка центра:",
            name,
            error
        );


        return null;

    }

}


// ============================================================
// 25. ПОИСК ИСХОДЯЩИХ РЁБЕР
// ============================================================

function getOutgoing(
    id
) {

    return rawRoutes.filter(
        edge =>
            edge.from === id
    );

}


// ============================================================
// 26. ПОИСК ВСЕХ ПУТЕЙ
// ============================================================
//
// ВАЖНО:
//
// Нельзя делать:
//
// if (isRegion(start)) return;
//
// потому что исходный регион сам является region.
//
// Поэтому начинаем именно с его исходящих рёбер.
//
// Например:
//
// Бессарабская
//       ↓
//     N189
//
// И только после этого запускаем обход.
//

function findAllPaths(
    start
) {

    const paths = [];


    const firstEdges =
        getOutgoing(
            start
        );


    if (
        firstEdges.length === 0
    ) {

        return paths;

    }


    firstEdges.forEach(
        edge => {

            walkGraph(

                edge.to,

                [
                    start,
                    edge.to
                ],

                paths,

                new Set([
                    start
                ])

            );

        }
    );


    return paths;

}


// ============================================================
// 27. ОБХОД ГРАФА
// ============================================================

function walkGraph(

    current,

    path,

    paths,

    visited

) {

    // --------------------------------------------------------
    // Если мы пришли в конечный регион,
    // путь завершён.
    //
    // Но стартовый регион сюда не попадает,
    // потому что обход начинается с первого узла.
    // --------------------------------------------------------

    if (
        isRegion(current) &&
        !isNode(current)
    ) {

        paths.push(
            [...path]
        );

        return;

    }


    // --------------------------------------------------------
    // Проверка циклов
    // --------------------------------------------------------

    if (
        visited.has(current)
    ) {

        console.warn(
            "Обнаружен цикл:",
            path.join(
                " → "
            )
        );

        return;

    }


    const newVisited =
        new Set(
            visited
        );


    newVisited.add(
        current
    );


    // --------------------------------------------------------
    // Исходящие рёбра
    // --------------------------------------------------------

    const outgoing =
        getOutgoing(
            current
        );


    // --------------------------------------------------------
    // Тупик
    // --------------------------------------------------------

    if (
        outgoing.length === 0
    ) {

        console.warn(
            "Тупик:",
            current,
            "|",
            path.join(
                " → "
            )
        );

        return;

    }


    // --------------------------------------------------------
    // Все ветви
    // --------------------------------------------------------

    outgoing.forEach(
        edge => {

            const next =
                edge.to;


            walkGraph(

                next,

                [
                    ...path,
                    next
                ],

                paths,

                newVisited

            );

        }
    );

}


// ============================================================
// 28. РАСЧЁТ ПОТОКОВ
// ============================================================
//
// Каждый migration.origin проходит по графу.
//
// Если:
//
// Бессарабская → N189 → ... → Приморская
//
// то весь поток Бессарабской проходит по каждому сегменту.
//
// Если из узла есть две ветви:
//
// N1 → N2
// N1 → N3
//
// поток делится между двумя маршрутами.
//

function calculateSegments() {

    const segmentMap = {};


    migrations.forEach(
        migration => {

            const origin =
                migration.origin;


            const number =
                migration.number;


            const paths =
                findAllPaths(
                    origin
                );


            console.log(
                "----------------------------------------"
            );


            console.log(
                `${origin} — ${number}`
            );


            console.log(
                "Маршрутов:",
                paths.length
            );


            paths.forEach(
                path => {

                    console.log(
                        " ",
                        path.join(
                            " → "
                        )
                    );

                }
            );


            if (
                paths.length === 0
            ) {

                console.error(
                    "❌ МАРШРУТ НЕ НАЙДЕН:",
                    origin
                );

                return;

            }


            // ------------------------------------------------
            // Если маршрутов несколько,
            // делим поток между ними
            // ------------------------------------------------

            const share =
                number /
                paths.length;


            // ------------------------------------------------
            // Добавляем каждый сегмент
            // ------------------------------------------------

            paths.forEach(
                path => {

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
                            from +
                            "||" +
                            to;


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

                                origins:
                                    {}

                            };

                        }


                        segmentMap[key]
                            .value +=
                            share;


                        if (
                            !segmentMap[key]
                                .origins[
                                    origin
                                ]
                        ) {

                            segmentMap[key]
                                .origins[
                                    origin
                                ] = 0;

                        }


                        segmentMap[key]
                            .origins[
                                origin
                            ] +=
                            share;

                    }

                }
            );

        }
    );


    segments =
        Object.values(
            segmentMap
        );


    console.log(
        "=========================================="
    );


    console.log(
        "ИТОГОВЫЕ СЕГМЕНТЫ"
    );


    console.log(
        "=========================================="
    );


    console.table(

        segments.map(
            segment => ({

                from:
                    segment.from,

                to:
                    segment.to,

                value:
                    Math.round(
                        segment.value
                    )

            })
        )

    );

}


// ============================================================
// 29. РИСОВАНИЕ РЕГИОНОВ
// ============================================================

function drawRegions() {

    regionsLayer.clearLayers();


    Object.values(
        regions
    )
    .forEach(
        region => {

            const layer =
                L.geoJSON(
                    region.feature,
                    {

                        style: {

                            color:
                                "#777",

                            weight:
                                0.8,

                            fillColor:
                                "#eeeeee",

                            fillOpacity:
                                0.22

                        }

                    }
                );


            layer.bindTooltip(
                region.name
            );


            layer.on(
                "click",
                () => {

                    showRegionInfo(
                        region.name
                    );

                }
            );


            layer.addTo(
                regionsLayer
            );

        }
    );

}


// ============================================================
// 30. РИСОВАНИЕ УЗЛОВ
// ============================================================

function drawNodes() {

    nodesLayer.clearLayers();


    Object.values(
        nodes
    )
    .forEach(
        node => {

            L.circleMarker(

                [
                    node.lat,
                    node.lon
                ],

                {

                    radius:
                        SETTINGS.nodeRadius,

                    color:
                        "#222",

                    weight:
                        1,

                    fillColor:
                        "#ffffff",

                    fillOpacity:
                        1

                }

            )
            .bindTooltip(
                node.id
            )
            .addTo(
                nodesLayer
            );

        }
    );

}


// ============================================================
// 31. ТОЛЩИНА ПОТОКА
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
        ) * 4;


    return Math.min(

        SETTINGS.maxFlowWidth,

        width

    );

}


// ============================================================
// 32. КРИВАЯ ЛИНИЯ
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


        const lat =

            mt * mt * lat1 +

            2 *
            mt *
            t *
            controlLat +

            t * t * lat2;


        const lon =

            mt * mt * lon1 +

            2 *
            mt *
            t *
            controlLon +

            t * t * lon2;


        points.push(
            [
                lat,
                lon
            ]
        );

    }


    return points;

}


// ============================================================
// 33. РИСОВАНИЕ ПОТОКОВ
// ============================================================

function drawFlows() {

    flowsLayer.clearLayers();


    let drawn = 0;


    segments.forEach(
        segment => {

            const from =
                getPoint(
                    segment.from
                );


            const to =
                getPoint(
                    segment.to
                );


            if (
                !from ||
                !to
            ) {

                console.warn(
                    "Не удалось получить координаты:",
                    segment.from,
                    "→",
                    segment.to,
                    from,
                    to
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
                            "round",

                        interactive:
                            true

                    }
                );


            // ------------------------------------------------
            // Tooltip
            // ------------------------------------------------

            line.bindTooltip(

                `<b>${escapeHTML(
                    segment.from
                )} → ${escapeHTML(
                    segment.to
                )}</b><br>` +

                `${formatNumber(
                    segment.value
                )} переселенцев`,

                {

                    sticky:
                        true

                }

            );


            // ------------------------------------------------
            // Click
            // ------------------------------------------------

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


            drawn++;

        }
    );


    console.log(
        "Нарисовано сегментов:",
        drawn,
        "из",
        segments.length
    );

}


// ============================================================
// 34. ИНФОРМАЦИЯ О ПОТОКЕ
// ============================================================

function showSegmentInfo(
    segment
) {

    const info =
        document.getElementById(
            "info"
        );


    if (
        !info
    ) {

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
        );


    let html = "";


    origins.forEach(
        (
            [
                origin,
                value
            ]
        ) => {

            html +=

                `<div>` +

                `${escapeHTML(
                    origin
                )}` +

                ` — ` +

                `${formatNumber(
                    value
                )}` +

                `</div>`;

        }
    );


    info.innerHTML =

        `<h3>` +

        `${escapeHTML(
            segment.from
        )}` +

        ` → ` +

        `${escapeHTML(
            segment.to
        )}` +

        `</h3>` +

        `<p>` +

        `<b>${formatNumber(
            segment.value
        )}</b> переселенцев` +

        `</p>` +

        `<hr>` +

        `<b>Состав потока:</b>` +

        html;

}


// ============================================================
// 35. ИНФОРМАЦИЯ О РЕГИОНЕ
// ============================================================

function showRegionInfo(
    name
) {

    const info =
        document.getElementById(
            "info"
        );


    if (
        !info
    ) {

        return;

    }


    const migration =
        migrations.find(
            item =>
                item.origin === name
        );


    if (
        migration
    ) {

        info.innerHTML =

            `<h3>${escapeHTML(
                name
            )}</h3>` +

            `<p>` +

            `Исходящий поток: ` +

            `<b>${formatNumber(
                migration.number
            )}</b>` +

            `</p>`;

    }

    else {

        info.innerHTML =

            `<h3>${escapeHTML(
                name
            )}</h3>`;

    }

}


// ============================================================
// 36. ПРОВЕРКА ГРАФА
// ============================================================

function checkGraph() {

    console.log(
        "=========================================="
    );

    console.log(
        "ПРОВЕРКА ГРАФА"
    );

    console.log(
        "=========================================="
    );


    // --------------------------------------------------------
    // Каждый источник
    // --------------------------------------------------------

    migrations.forEach(
        migration => {

            const paths =
                findAllPaths(
                    migration.origin
                );


            if (
                paths.length === 0
            ) {

                console.error(
                    "❌",
                    migration.origin,
                    "— маршрут не найден"
                );

            }

            else {

                console.log(
                    "✓",
                    migration.origin,
                    "→",
                    paths.length,
                    "маршрут(ов)"
                );

            }

        }
    );


    // --------------------------------------------------------
    // Неизвестные объекты
    // --------------------------------------------------------

    const objects =
        new Set();


    rawRoutes.forEach(
        edge => {

            objects.add(
                edge.from
            );

            objects.add(
                edge.to
            );

        }
    );


    const unknown = [];


    objects.forEach(
        id => {

            if (
                !isNode(id) &&
                !isRegion(id)
            ) {

                unknown.push(
                    id
                );

            }

        }
    );


    if (
        unknown.length > 0
    ) {

        console.warn(
            "Объекты EDGES, которых нет в NODES или GeoJSON:",
            unknown
        );

    }


    // --------------------------------------------------------
    // Проверка N189
    // --------------------------------------------------------

    console.log(
        "=========================================="
    );

    console.log(
        "ПУТЬ ОТ N189"
    );

    console.log(
        "=========================================="
    );


    console.table(
        findAllPaths(
            "N189"
        )
        .map(
            path =>
                path.join(
                    " → "
                )
        )
    );


    // --------------------------------------------------------
    // Проверка N190
    // --------------------------------------------------------

    console.log(
        "=========================================="
    );

    console.log(
        "ПУТЬ ОТ N190"
    );

    console.log(
        "=========================================="
    );


    console.table(
        findAllPaths(
            "N190"
        )
        .map(
            path =>
                path.join(
                    " → "
                )
        )
    );


    // --------------------------------------------------------
    // Проверка N226
    // --------------------------------------------------------

    console.log(
        "=========================================="
    );

    console.log(
        "ПУТЬ ОТ N226"
    );

    console.log(
        "=========================================="
    );


    console.table(
        findAllPaths(
            "N226"
        )
        .map(
            path =>
                path.join(
                    " → "
                )
        )
    );


    console.log(
        "=========================================="
    );

}


// ============================================================
// 37. МАСШТАБ
// ============================================================

function fitMap() {

    const layers = [];


    Object.values(
        regions
    )
    .forEach(
        region => {

            layers.push(
                L.geoJSON(
                    region.feature
                )
            );

        }
    );


    if (
        layers.length === 0
    ) {

        return;

    }


    const group =
        L.featureGroup(
            layers
        );


    const bounds =
        group.getBounds();


    if (
        bounds.isValid()
    ) {

        map.fitBounds(
            bounds,
            {

                padding:
                    [30, 30]

            }
        );

    }

}


// ============================================================
// 38. ЧИСЛО
// ============================================================

function parseNumber(
    value
) {

    return parseFloat(

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
            )

    );

}


// ============================================================
// 39. ФОРМАТ ЧИСЛА
// ============================================================

function formatNumber(
    value
) {

    return Number(
        value
    ).toLocaleString(

        "ru-RU",

        {

            maximumFractionDigits:
                0

        }

    );

}


// ============================================================
// 40. HTML ESCAPE
// ============================================================

function escapeHTML(
    text
) {

    return String(
        text
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
// 41. АНИМАЦИЯ ПОТОКОВ
// ============================================================

let animationRunning = false;

let animationFrame = null;

let animationParticles = [];

let animationStartTime = 0;


// ============================================================
// НАСТРОЙКИ АНИМАЦИИ
// ============================================================

const ANIMATION_SETTINGS = {

    // Количество движущихся точек
    particlesPerSegment: 3,

    // Скорость движения
    // Чем больше — тем быстрее
    speed: 0.00012,

    // Размер точки
    radius: 3,

    // Прозрачность
    opacity: 0.9,

    // Цвет
    color: "#ffcc00"

};


// ============================================================
// ЗАПУСК
// ============================================================

function startFlowAnimation() {

    if (
        animationRunning
    ) {

        return;

    }


    animationRunning = true;

    animationStartTime =
        performance.now();


    createAnimationParticles();


    animationFrame =
        requestAnimationFrame(
            animateFlows
        );


    updateAnimationButton();

}


// ============================================================
// ОСТАНОВКА
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


    clearAnimationParticles();


    updateAnimationButton();

}


// ============================================================
// СОЗДАНИЕ ТОЧЕК
// ============================================================

function createAnimationParticles() {

    clearAnimationParticles();


    segments.forEach(
        segment => {

            const from =
                getPoint(
                    segment.from
                );


            const to =
                getPoint(
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


            for (
                let i = 0;
                i <
                ANIMATION_SETTINGS
                    .particlesPerSegment;
                i++
            ) {

                const particle = {

                    segment:
                        segment,

                    points:
                        points,

                    progress:
                        i /
                        ANIMATION_SETTINGS
                            .particlesPerSegment,

                    speed:
                        ANIMATION_SETTINGS
                            .speed *
                        (
                            0.7 +
                            Math.random() *
                            0.6
                        ),

                    marker:
                        null

                };


                particle.marker =
                    L.circleMarker(

                        points[0],

                        {

                            radius:
                                ANIMATION_SETTINGS
                                    .radius,

                            color:
                                ANIMATION_SETTINGS
                                    .color,

                            fillColor:
                                ANIMATION_SETTINGS
                                    .color,

                            fillOpacity:
                                ANIMATION_SETTINGS
                                    .opacity,

                            opacity:
                                ANIMATION_SETTINGS
                                    .opacity,

                            weight:
                                0,

                            interactive:
                                false

                        }

                    );


                particle.marker.addTo(
                    flowsLayer
                );


                animationParticles.push(
                    particle
                );

            }

        }
    );

}


// ============================================================
// ОЧИСТКА ТОЧЕК
// ============================================================

function clearAnimationParticles() {

    animationParticles.forEach(
        particle => {

            if (
                particle.marker
            ) {

                flowsLayer.removeLayer(
                    particle.marker
                );

            }

        }
    );


    animationParticles = [];

}


// ============================================================
// АНИМАЦИЯ
// ============================================================

function animateFlows(
    timestamp
) {

    if (
        !animationRunning
    ) {

        return;

    }


    animationParticles.forEach(
        particle => {

            // -----------------------------------------------
            // Двигаем частицу
            // -----------------------------------------------

            particle.progress +=
                particle.speed *
                16;


            // -----------------------------------------------
            // Начинаем сначала
            // -----------------------------------------------

            if (
                particle.progress >= 1
            ) {

                particle.progress -= 1;

            }


            // -----------------------------------------------
            // Координата частицы
            // -----------------------------------------------

            const position =
                getPositionOnPath(

                    particle.points,

                    particle.progress

                );


            if (
                position
            ) {

                particle.marker
                    .setLatLng(
                        position
                    );

            }

        }
    );


    animationFrame =
        requestAnimationFrame(
            animateFlows
        );

}


// ============================================================
// ПОЛОЖЕНИЕ НА ЛИНИИ
// ============================================================

function getPositionOnPath(
    points,
    progress
) {

    if (
        !points ||
        points.length === 0
    ) {

        return null;

    }


    if (
        points.length === 1
    ) {

        return points[0];

    }


    const position =

        progress *
        (
            points.length - 1
        );


    const index =
        Math.floor(
            position
        );


    const localProgress =
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


    const lat =

        p1[0] +

        (
            p2[0] -
            p1[0]
        ) *
        localProgress;


    const lon =

        p1[1] +

        (
            p2[1] -
            p1[1]
        ) *
        localProgress;


    return [
        lat,
        lon
    ];

}


// ============================================================
// КНОПКА
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


    if (
        animationRunning
    ) {

        button.innerHTML =
            "⏸ Остановить потоки";

    }

    else {

        button.innerHTML =
            "▶ Запустить потоки";

    }

}


// ============================================================
// ОБРАБОТЧИК КНОПКИ
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

            console.warn(
                "Кнопка animationToggle не найдена"
            );

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
