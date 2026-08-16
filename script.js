// ============================================================
// ИНТЕРАКТИВНАЯ КАРТА МИГРАЦИЙ
// ============================================================
//
// Структура:
//
// /
// ├── index.html
// ├── style.css
// ├── script.js
// └── data/
//      ├── migration.csv
//      ├── NODES.csv
//      ├── EDGES.csv
//      └── data.geojson
//
// ============================================================


// ============================================================
// 1. ФАЙЛЫ
// ============================================================

const FILES = {
    migration: "data/migration.csv",
    nodes: "data/NODES.csv",
    edges: "data/EDGES.csv",
    geojson: "data/data.geojson"
};


// ============================================================
// 2. НАСТРОЙКИ
// ============================================================

const FLOW_COLOR = "#c62828";

const FLOW_OPACITY = 0.65;

const MIN_FLOW_WIDTH = 1.5;

const MAX_FLOW_WIDTH = 30;

const NODE_RADIUS = 4;


// ============================================================
// 3. ДАННЫЕ
// ============================================================

let migrations = [];

let nodes = {};

let regions = {};

let rawRoutes = [];

let segments = [];


// ============================================================
// 4. КАРТА
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

        console.log(
            "========================================"
        );

        console.log(
            "ЗАГРУЗКА ДАННЫХ"
        );

        console.log(
            "========================================"
        );


        const migrationData =
            await loadCSV(
                FILES.migration
            );


        const nodeData =
            await loadCSV(
                FILES.nodes
            );


        const edgeData =
            await loadEdges(
                FILES.edges
            );


        const geojson =
            await loadGeoJSON(
                FILES.geojson
            );


        console.log(
            "Файлы загружены"
        );


        // ----------------------------------------------------
        // Подготовка данных
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
            edgeData
        );


        // ----------------------------------------------------
        // Рисуем регионы и узлы
        // ----------------------------------------------------

        drawRegions();

        drawNodes();


        // ----------------------------------------------------
        // Рассчитываем потоки
        // ----------------------------------------------------

        calculateSegments();


        // ----------------------------------------------------
        // Рисуем потоки
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
            "========================================"
        );

        console.log(
            "ГОТОВО"
        );

        console.log(
            "========================================"
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
// 8. ЗАГРУЗКА CSV
// ============================================================

async function loadCSV(file) {

    const response =
        await fetch(file);


    if (!response.ok) {

        throw new Error(
            `Не удалось загрузить ${file}. HTTP ${response.status}`
        );

    }


    const text =
        await response.text();


    return parseCSV(
        text
    );

}


// ============================================================
// 9. ЗАГРУЗКА EDGES
// ============================================================
//
// EDGES имеет необычную структуру:
//
// Архангельская;N1;;;;;;;;;
//
// Кубанская;N190;;;;;;;;;
//
// N1;N2;N3;N4;...;N164;Тургайская
//
// N51;N52;...;N171;Тобольская
//
// N189;N192;N193;...;N226;Приморская
//
// Поэтому мы не используем заголовки столбцов.
// Каждая непустая ячейка является элементом маршрута.
//
// ============================================================

async function loadEdges(file) {

    const response =
        await fetch(file);


    if (!response.ok) {

        throw new Error(
            `Не удалось загрузить ${file}. HTTP ${response.status}`
        );

    }


    const text =
        await response.text();


    return parseEdgesCSV(
        text
    );

}


// ============================================================
// 10. GEOJSON
// ============================================================

async function loadGeoJSON(file) {

    const response =
        await fetch(file);


    if (!response.ok) {

        throw new Error(
            `Не удалось загрузить ${file}. HTTP ${response.status}`
        );

    }


    return await response.json();

}


// ============================================================
// 11. ОБЫЧНЫЙ CSV
// ============================================================

function parseCSV(text) {

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
            header =>
                clean(header)
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
// 12. EDGES CSV
// ============================================================

function parseEdgesCSV(text) {

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


    if (
        lines.length <= 1
    ) {

        return rows;

    }


    // Первую строку пропускаем:
    //
    // from;to;;;;;;;;;;
    //
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
                value =>
                    clean(value)
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
// 14. ОЧИСТКА СТРОК
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


// ============================================================
// 15. ПОДГОТОВКА MIGRATION
// ============================================================

function prepareMigrations(data) {

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
                !origin
            ) {

                return;

            }


            if (
                isNaN(number)
            ) {

                return;

            }


            if (
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
        "Миграций:",
        migrations.length
    );

}


// ============================================================
// 16. ПОДГОТОВКА NODES
// ============================================================

function prepareNodes(data) {

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
                    "Неверные координаты:",
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
        "Узлов:",
        Object.keys(nodes).length
    );

}


// ============================================================
// 17. КООРДИНАТА
// ============================================================

function parseCoordinate(value) {

    return parseFloat(

        String(
            value ?? ""
        )
            .replace(
                /^\uFEFF/,
                ""
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
// 18. ПОДГОТОВКА РЕГИОНОВ
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
            "В data.geojson нет массива features"
        );

    }


    geojson.features.forEach(
        feature => {

            const props =
                feature.properties || {};


            let name =
                clean(
                    props.prov_ENG
                );


            if (!name) {

                name =
                    clean(
                        props.name
                    );

            }


            if (!name) {

                name =
                    clean(
                        props.NAME
                    );

            }


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
        "Регионов:",
        Object.keys(regions).length
    );

}


// ============================================================
// 19. ПОДГОТОВКА ГРАФА
// ============================================================
//
// Это ключевая функция.
//
// Каждая строка EDGES превращается в последовательные
// рёбра.
//
// Например:
//
// N189;N192;N193;N194;N195;N226;Приморская
//
// превращается в:
//
// N189 → N192
// N192 → N193
// N193 → N194
// ...
// N225 → N226
// N226 → Приморская
//
// ============================================================

function prepareRoutes(rows) {

    rawRoutes = [];


    rows.forEach(
        row => {

            const values =
                row
                    .map(
                        value =>
                            clean(value)
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


            // ------------------------------------------------
            // Создаём все последовательные связи
            // ------------------------------------------------

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


    // ========================================================
    // Удаляем дубли
    // ========================================================

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
        "Всего рёбер:",
        rawRoutes.length
    );


    // ========================================================
    // Диагностика важных узлов
    // ========================================================

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
// 20. ДИАГНОСТИКА УЗЛА
// ============================================================

function debugNode(id) {

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
        `УЗЕЛ ${id}`
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
// 21. ЕСТЬ ЛИ NODE
// ============================================================

function isNode(id) {

    return (
        nodes[id] !== undefined
    );

}


// ============================================================
// 22. ЕСТЬ ЛИ REGION
// ============================================================

function isRegion(id) {

    return (
        regions[id] !== undefined
    );

}


// ============================================================
// 23. ПОЛУЧИТЬ КООРДИНАТЫ
// ============================================================

function getPoint(id) {

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
// 24. ЦЕНТР ПОЛИГОНА
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
            "Не удалось определить центр:",
            name,
            error
        );


        return null;

    }

}


// ============================================================
// 25. РИСУЕМ РЕГИОНЫ
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
                                0.25

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
// 26. РИСУЕМ УЗЛЫ
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
                        NODE_RADIUS,

                    color:
                        "#222",

                    weight:
                        1,

                    fillColor:
                        "#fff",

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
// 27. ПОИСК ВСЕХ МАРШРУТОВ
// ============================================================

function findAllPaths(
    start
) {

    const paths = [];


    walkGraph(

        start,

        [start],

        paths,

        new Set()

    );


    return paths;

}


// ============================================================
// 28. ОБХОД ГРАФА
// ============================================================

function walkGraph(

    current,

    path,

    paths,

    visited

) {

    // --------------------------------------------------------
    // Если пришли в регион — маршрут завершён
    // --------------------------------------------------------

    if (
        isRegion(current)
    ) {

        paths.push(
            [...path]
        );

        return;

    }


    // --------------------------------------------------------
    // Если объект уже был в этом маршруте —
    // обнаружен цикл
    // --------------------------------------------------------

    if (
        visited.has(current)
    ) {

        console.warn(
            "Цикл:",
            path.join(
                " → "
            )
        );

        return;

    }


    const nextVisited =
        new Set(
            visited
        );


    nextVisited.add(
        current
    );


    // --------------------------------------------------------
    // Все исходящие рёбра
    // --------------------------------------------------------

    const outgoing =
        rawRoutes.filter(
            edge =>
                edge.from === current
        );


    // --------------------------------------------------------
    // Нет выхода
    // --------------------------------------------------------

    if (
        outgoing.length === 0
    ) {

        console.warn(
            "ТУПИК:",
            current,
            "|",
            path.join(
                " → "
            )
        );

        return;

    }


    // --------------------------------------------------------
    // Идём по каждой ветви
    // --------------------------------------------------------

    outgoing.forEach(
        edge => {

            const next =
                edge.to;


            // Если неизвестный объект

            if (
                !isNode(next) &&
                !isRegion(next)
            ) {

                console.error(
                    "НЕИЗВЕСТНЫЙ ОБЪЕКТ:",
                    next,
                    "|",
                    edge.from,
                    "→",
                    edge.to
                );

                return;

            }


            walkGraph(

                next,

                [
                    ...path,
                    next
                ],

                paths,

                nextVisited

            );

        }
    );

}


// ============================================================
// 29. РАСЧЁТ СЕГМЕНТОВ
// ============================================================
//
// Поток каждой губернии проходит по маршруту.
//
// Если из узла есть несколько ветвей,
// поток распределяется между ними поровну.
//
// Если несколько потоков приходят в один узел,
// они автоматически объединяются.
//
// ============================================================

function calculateSegments() {

    const segmentMap = {};


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
                    "❌ НЕТ МАРШРУТА:",
                    migration.origin
                );

                return;

            }


            console.log(
                "----------------------------------------"
            );


            console.log(
                migration.origin,
                "—",
                migration.number
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


            // ------------------------------------------------
            // Распределение по маршрутам
            // ------------------------------------------------

            const share =

                migration.number /
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
                            segmentMap[key]
                                .origins[
                                    migration.origin
                                ] === undefined
                        ) {

                            segmentMap[key]
                                .origins[
                                    migration.origin
                                ] = 0;

                        }


                        segmentMap[key]
                            .origins[
                                migration.origin
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
        "========================================"
    );

    console.log(
        "ИТОГОВЫЕ СЕГМЕНТЫ"
    );

    console.log(
        "========================================"
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
// 30. ТОЛЩИНА ПОТОКА
// ============================================================

function getFlowWidth(
    value
) {

    if (
        value <= 0
    ) {

        return MIN_FLOW_WIDTH;

    }


    const width =

        MIN_FLOW_WIDTH +

        Math.log10(
            value + 1
        ) * 4;


    return Math.min(
        width,
        MAX_FLOW_WIDTH
    );

}


// ============================================================
// 31. КРИВАЯ ЛИНИЯ
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
        distance * 0.10;


    const controlLon =
        midLon;


    const points = [];


    const steps = 20;


    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;


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
// 32. РИСУЕМ ПОТОКИ
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
                    "НЕВОЗМОЖНО НАРИСОВАТЬ:",
                    segment.from,
                    "→",
                    segment.to,
                    "| координаты:",
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
                            FLOW_COLOR,

                        weight:
                            getFlowWidth(
                                segment.value
                            ),

                        opacity:
                            FLOW_OPACITY,

                        lineCap:
                            "round",

                        lineJoin:
                            "round",

                        interactive:
                            true

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
                )} переселенцев`,

                {
                    sticky:
                        true
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
// 33. ИНФОРМАЦИЯ О СЕГМЕНТЕ
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

        `<b>Источники потока:</b>` +

        html;

}


// ============================================================
// 34. ИНФОРМАЦИЯ О РЕГИОНЕ
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
            migration =>
                migration.origin === name
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
// 35. ПРОВЕРКА ГРАФА
// ============================================================

function checkGraph() {

    console.log(
        "========================================"
    );

    console.log(
        "ПРОВЕРКА МАРШРУТОВ"
    );

    console.log(
        "========================================"
    );


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
                    "— путь не найден"
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


    console.log(
        "========================================"
    );


    // --------------------------------------------------------
    // Проверка объектов из EDGES
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


    const missing = [];


    objects.forEach(
        id => {

            if (
                !isNode(id) &&
                !isRegion(id)
            ) {

                missing.push(
                    id
                );

            }

        }
    );


    if (
        missing.length
    ) {

        console.error(
            "❌ Объекты EDGES без координат:",
            missing
        );

    }

    else {

        console.log(
            "✓ Все объекты EDGES найдены"
        );

    }


    // --------------------------------------------------------
    // Специально проверяем N189
    // --------------------------------------------------------

    console.log(
        "========================================"
    );

    console.log(
        "ПРОВЕРКА N189"
    );


    const n189 =
        findAllPaths(
            "N189"
        );


    console.log(
        n189
    );


    // --------------------------------------------------------
    // N190
    // --------------------------------------------------------

    console.log(
        "ПРОВЕРКА N190"
    );


    console.log(
        findAllPaths(
            "N190"
        )
    );


    // --------------------------------------------------------
    // N226
    // --------------------------------------------------------

    console.log(
        "ПРОВЕРКА N226"
    );


    console.log(
        findAllPaths(
            "N226"
        )
    );


    console.log(
        "========================================"
    );

}


// ============================================================
// 36. МАСШТАБ КАРТЫ
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
// 37. ЧИСЛО
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
// 38. ФОРМАТ ЧИСЛА
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
// 39. HTML ESCAPE
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
