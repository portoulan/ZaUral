// ============================================================
// ИНТЕРАКТИВНАЯ КАРТА МИГРАЦИЙ
// ============================================================
//
// Файлы:
//
// index.html
// script.js
// style.css
//
// data/
//   migration.csv
//   NODES.csv
//   EDGES.csv
//   data.geojson
//
// ============================================================


// ============================================================
// 1. НАСТРОЙКИ ФАЙЛОВ
// ============================================================

const FILES = {
    migration: "data/migration.csv",
    nodes: "data/NODES.csv",
    edges: "data/EDGES.csv",
    geojson: "data/data.geojson"
};


// ============================================================
// 2. НАСТРОЙКИ ВИЗУАЛИЗАЦИИ
// ============================================================

const FLOW_COLOR = "#c62828";

const FLOW_OPACITY = 0.68;

const MIN_FLOW_WIDTH = 1.5;

const MAX_FLOW_WIDTH = 28;

const NODE_RADIUS = 4;


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
// 7. ЗАГРУЗКА ВСЕХ ФАЙЛОВ
// ============================================================

async function loadEverything() {

    try {

        console.log(
            "===================================="
        );

        console.log(
            "НАЧАЛО ЗАГРУЗКИ"
        );

        console.log(
            "===================================="
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
            "Все файлы загружены"
        );


        // ----------------------------------------
        // Подготовка
        // ----------------------------------------

        prepareMigrations(
            migrationData
        );


        prepareNodes(
            nodeData
        );


        prepareGeoJSON(
            geojson
        );


        prepareRoutes(
            edgeData
        );


        // ----------------------------------------
        // Отрисовка
        // ----------------------------------------

        drawRegions();

        drawNodes();


        // ----------------------------------------
        // Расчёт потоков
        // ----------------------------------------

        calculateSegments();


        drawFlows();


        // ----------------------------------------
        // Масштаб карты
        // ----------------------------------------

        fitMap();


        // ----------------------------------------
        // Диагностика
        // ----------------------------------------

        checkGraph();


        console.log(
            "===================================="
        );

        console.log(
            "КАРТА ГОТОВА"
        );

        console.log(
            "===================================="
        );

    }

    catch (error) {

        console.error(
            "ОШИБКА:",
            error
        );


        alert(
            "Ошибка загрузки данных:\n\n" +
            error.message
        );

    }

}


// ============================================================
// 8. ЗАГРУЗКА ОБЫЧНОГО CSV
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
// EDGES.csv имеет особую структуру.
//
// Например:
//
// from;to;;;;;;;;;;;;;;;;
//
// Архангельская;N1
//
// Астраханская;N1
//
// N1;N2;N3;N4;N5;...;Тургайская
//
// Поэтому EDGES нельзя читать обычным способом,
// где первая строка задаёт фиксированные названия колонок.
//
// Здесь каждая строка читается целиком.
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
// 10. ЗАГРУЗКА GEOJSON
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
// 11. ПАРСЕР CSV
// ============================================================

function parseCSV(text) {

    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    text =
        text
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
        ).map(
            h =>
                h
                    .replace(
                        /^\uFEFF/,
                        ""
                    )
                    .trim()
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
                        ? values[index].trim()
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

function parseEdgesCSV(text) {

    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    text =
        text
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
        lines.length <= 1
    ) {

        return [];

    }


    const result = [];


    // Первую строку пропускаем:
    //
    // from;to;;;;;;;;;;;;;;;;;

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
                    value
                        .replace(
                            /^\uFEFF/,
                            ""
                        )
                        .trim()
            )
            .filter(
                value =>
                    value !== ""
            );


        if (
            values.length >= 2
        ) {

            result.push(
                values
            );

        }

    }


    return result;

}


// ============================================================
// 13. ПАРСЕР ОДНОЙ СТРОКИ
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
// 14. ПОДГОТОВКА MIGRATION
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
        "Миграций:",
        migrations.length
    );

}


// ============================================================
// 15. ПОДГОТОВКА NODES
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


            let lat =
                parseFloat(
                    String(
                        row.lat || ""
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


            let lon =
                parseFloat(
                    String(
                        row.lon || ""
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


            if (
                isNaN(lat) ||
                isNaN(lon)
            ) {

                console.warn(
                    "Неверные координаты:",
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
// 16. ПОДГОТОВКА GEOJSON
// ============================================================

function prepareGeoJSON(
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
            "data.geojson не содержит features"
        );

    }


    geojson.features.forEach(
        feature => {

            const props =
                feature.properties || {};


            // Основное имя из твоего GeoJSON

            let name =
                clean(
                    props.prov_ENG
                );


            // Запасные варианты,
            // если встретятся в GeoJSON

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
// 17. ПОДГОТОВКА EDGES
// ============================================================
//
// Здесь находится главное исправление.
//
// Каждая строка EDGES превращается в последовательные
// связи.
//
// Например:
//
// Архангельская;N1
//
// превращается в:
//
// Архангельская → N1
//
//
// А:
//
// N1;N2;N3;N4;N5;Тургайская
//
// превращается в:
//
// N1 → N2
// N2 → N3
// N3 → N4
// N4 → N5
// N5 → Тургайская
//
// ============================================================

function prepareRoutes(rows) {

    rawRoutes = [];


    rows.forEach(
        row => {

            const values =
                row
                    .map(
                        clean
                    )
                    .filter(
                        Boolean
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
    // Убираем полные дубликаты
    // --------------------------------------------------------

    const unique = new Map();


    rawRoutes.forEach(
        edge => {

            const key =
                edge.from +
                "||" +
                edge.to;


            unique.set(
                key,
                edge
            );

        }
    );


    rawRoutes =
        Array.from(
            unique.values()
        );


    console.log(
        "Рёбер:",
        rawRoutes.length
    );


    console.table(
        rawRoutes.slice(
            0,
            100
        )
    );

}


// ============================================================
// 18. ОЧИСТКА ТЕКСТА
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
// 19. ЧИСЛО
// ============================================================

function parseNumber(value) {

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
// 20. ПРОВЕРКА: ЕСТЬ ЛИ УЗЕЛ
// ============================================================

function isNode(id) {

    return (
        nodes[id] !== undefined
    );

}


// ============================================================
// 21. ПРОВЕРКА: ЕСТЬ ЛИ РЕГИОН
// ============================================================

function isRegion(id) {

    return (
        regions[id] !== undefined
    );

}


// ============================================================
// 22. КООРДИНАТЫ ОБЪЕКТА
// ============================================================

function getPoint(id) {

    // ----------------------------------------
    // Узел
    // ----------------------------------------

    if (
        isNode(id)
    ) {

        return [

            nodes[id].lat,

            nodes[id].lon

        ];

    }


    // ----------------------------------------
    // Регион
    // ----------------------------------------

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
// 23. ЦЕНТР РЕГИОНА
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
// 24. РИСУЕМ РЕГИОНЫ
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
                function () {

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
// 25. РИСУЕМ УЗЛЫ
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
// 26. ПОИСК МАРШРУТОВ
// ============================================================
//
// Например:
//
// Бессарабская
// ↓
// N189
// ↓
// N226
// ↓
// N227
// ↓
// ...
// ↓
// регион
//
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
// 27. ОБХОД ГРАФА
// ============================================================

function walkGraph(

    current,

    path,

    paths,

    visited

) {

    // --------------------------------------------------------
    // ДОШЛИ ДО КОНЕЧНОГО РЕГИОНА
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
    // ЦИКЛ
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
    // ВСЕ ВЫХОДЯЩИЕ РЁБРА
    // --------------------------------------------------------

    const outgoing =
        rawRoutes.filter(
            edge =>
                edge.from === current
        );


    // --------------------------------------------------------
    // НЕТ ПРОДОЛЖЕНИЯ
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
    // ПРОДОЛЖАЕМ ПО ВСЕМ ВЫХОДАМ
    // --------------------------------------------------------

    outgoing.forEach(
        edge => {

            const next =
                edge.to;


            // Если объект вообще неизвестен

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
// 28. РАСЧЁТ ПОТОКОВ
// ============================================================
//
// Здесь поток каждой губернии проходит по всем найденным
// маршрутам.
//
// Если маршрутов несколько — поток делится между ними.
//
// Если маршрутов один — всё число переселенцев идёт
// по нему целиком.
//
// При объединении потоков значения складываются.
//
// Например:
//
// Архангельская 33
// Астраханская 524
//
// обе идут через N1:
//
// Архангельская → N1 = 33
// Астраханская → N1 = 524
//
// N1 → N2 = 557
//
// ============================================================

function calculateSegments() {

    const mapSegments = {};


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
                    "НЕТ МАРШРУТА:",
                    migration.origin
                );

                return;

            }


            console.log(
                "================================"
            );


            console.log(
                migration.origin,
                "→",
                migration.number,
                "чел."
            );


            console.log(
                "Найдено маршрутов:",
                paths.length
            );


            paths.forEach(
                path => {

                    console.log(
                        path.join(
                            " → "
                        )
                    );

                }
            );


            // ------------------------------------------------
            // Доля на каждый маршрут
            // ------------------------------------------------

            const share =

                migration.number /
                paths.length;


            // ------------------------------------------------
            // Записываем каждый участок
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
                            !mapSegments[key]
                        ) {

                            mapSegments[key] = {

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


                        mapSegments[key]
                            .value +=
                            share;


                        if (
                            mapSegments[key]
                                .origins[
                                    migration.origin
                                ] === undefined
                        ) {

                            mapSegments[key]
                                .origins[
                                    migration.origin
                                ] = 0;

                        }


                        mapSegments[key]
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
            mapSegments
        );


    console.log(
        "===================================="
    );

    console.log(
        "ИТОГОВЫЕ СЕГМЕНТЫ"
    );

    console.log(
        "===================================="
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
// 29. ТОЛЩИНА ПОТОКА
// ============================================================

function getFlowWidth(
    value
) {

    if (
        value <= 0
    ) {

        return MIN_FLOW_WIDTH;

    }


    // Логарифмическое масштабирование,
    // чтобы огромные потоки не скрывали маленькие.

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
// 30. СОЗДАНИЕ ПЛАВНОЙ ЛИНИИ
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

        distance * 0.12;


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
// 31. РИСОВАНИЕ ПОТОКОВ
// ============================================================

function drawFlows() {

    flowsLayer.clearLayers();


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

                        smoothFactor:
                            1

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
                function () {

                    showSegmentInfo(
                        segment
                    );

                }
            );


            line.addTo(
                flowsLayer
            );

        }
    );

}


// ============================================================
// 32. ИНФОРМАЦИЯ О ПОТОКЕ
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
            (a, b) =>
                b[1] - a[1]
        );


    let originHTML = "";


    origins.forEach(
        (
            [
                origin,
                value
            ]
        ) => {

            originHTML +=

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

        `<b>Губернии исхода:</b>` +

        originHTML;

}


// ============================================================
// 33. ИНФОРМАЦИЯ О РЕГИОНЕ
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
            m =>
                m.origin === name
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
// 34. ПРОВЕРКА ГРАФА
// ============================================================

function checkGraph() {

    console.log(
        "===================================="
    );

    console.log(
        "ПРОВЕРКА ГРАФА"
    );

    console.log(
        "===================================="
    );


    // --------------------------------------------------------
    // Все объекты из EDGES
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
        missing.length > 0
    ) {

        console.error(
            "ОБЪЕКТЫ БЕЗ КООРДИНАТ:",
            missing
        );

    }

    else {

        console.log(
            "✓ Все объекты EDGES имеют координаты"
        );

    }


    // --------------------------------------------------------
    // Проверяем каждую губернию
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

                    "❌ НЕТ ПУТИ:",

                    migration.origin

                );

            }

            else {

                console.log(

                    "✓",

                    migration.origin,

                    "→",

                    paths.length,

                    "путь(ей)"

                );

            }

        }
    );


    // --------------------------------------------------------
    // Проверяем конкретные узлы N189 / N190
    // --------------------------------------------------------

    ["N189", "N190", "N226"].forEach(
        id => {

            if (
                isNode(id)
            ) {

                const outgoing =
                    rawRoutes.filter(
                        edge =>
                            edge.from === id
                    );


                const incoming =
                    rawRoutes.filter(
                        edge =>
                            edge.to === id
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

        }
    );


    console.log(
        "===================================="
    );

}


// ============================================================
// 35. МАСШТАБ КАРТЫ
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


    map.fitBounds(
        group.getBounds(),
        {
            padding:
                [30, 30]
        }
    );

}


// ============================================================
// 36. ФОРМАТ ЧИСЕЛ
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
// 37. ЗАЩИТА HTML
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
