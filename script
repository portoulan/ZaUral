// ============================================================
// КАРТА МИГРАЦИЙ
// ============================================================
//
// Файлы:
//
// data/migration.csv
// data/NODES.csv
// data/EDGES.csv
// data/data.geojson
//
// migration.csv:
// Origin;Number
// Архангельская;33
// Астраханская;524
//
// NODES.csv:
// id;lat;lon
// N1;48.612383370883187;53.16115949
//
// EDGES.csv:
// Архангельская;N1
// Астраханская;N1
// N1;N2;N3;N4;...;Тургайская
//
// data.geojson:
// properties.prov_ENG
//
// ============================================================


// ============================================================
// 1. НАСТРОЙКИ
// ============================================================

const FILES = {

    migration: "data/migration.csv",

    nodes: "data/NODES.csv",

    edges: "data/EDGES.csv",

    geojson: "data/data.geojson"

};


// Максимальная толщина потока

const MAX_FLOW_WIDTH = 25;


// Минимальная толщина

const MIN_FLOW_WIDTH = 1.5;


// Прозрачность потоков

const FLOW_OPACITY = 0.65;


// Цвет потоков

const FLOW_COLOR = "#c62828";


// Цвет узлов

const NODE_COLOR = "#222";


// Размер узлов

const NODE_RADIUS = 4;


// ============================================================
// 2. СОЗДАЁМ КАРТУ
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


// Начальный масштаб

map.setView(
    [55, 70],
    4
);


// ============================================================
// 3. СЛОИ
// ============================================================

const regionsLayer =
    L.layerGroup().addTo(map);


const flowsLayer =
    L.layerGroup().addTo(map);


const nodesLayer =
    L.layerGroup().addTo(map);


// ============================================================
// 4. ХРАНИЛИЩА ДАННЫХ
// ============================================================

let migrations = [];

let nodes = {};

let rawRoutes = [];

let segments = [];

let regions = {};


// ============================================================
// 5. ЗАГРУЖАЕМ ВСЕ ФАЙЛЫ
// ============================================================

Promise.all([

    loadCSV(
        FILES.migration
    ),

    loadCSV(
        FILES.nodes
    ),

    loadCSV(
        FILES.edges
    ),

    loadGeoJSON(
        FILES.geojson
    )

])

.then(
    (
        migrationData,
        nodeData,
        edgeData,
        geojson
    ) => {

        console.log(
            "Migration:",
            migrationData
        );

        console.log(
            "Nodes:",
            nodeData
        );

        console.log(
            "Edges:",
            edgeData
        );

        console.log(
            "GeoJSON:",
            geojson
        );


        // -------------------------------
        // Подготавливаем данные
        // -------------------------------

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


        // -------------------------------
        // Рисуем
        // -------------------------------

        drawRegions();

        drawNodes();

        calculateSegments();

        drawFlows();


        // -------------------------------
        // Подгоняем карту под регионы
        // -------------------------------

        fitMapToRegions();

    }

)

.catch(
    error => {

        console.error(
            "ОШИБКА:",
            error
        );


        alert(
            "Ошибка загрузки данных. " +
            "Открой консоль браузера (F12) " +
            "для подробностей."
        );

    }
);


// ============================================================
// 6. ЗАГРУЗКА CSV
// ============================================================

function loadCSV(file) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            Papa.parse(
                file,
                {

                    download: true,

                    header: true,

                    delimiter: ";",

                    skipEmptyLines: true,

                    encoding: "UTF-8",

                    complete:
                        function(results) {

                            resolve(
                                results.data
                            );

                        },

                    error:
                        function(error) {

                            reject(
                                error
                            );

                        }

                }
            );

        }
    );

}


// ============================================================
// 7. ЗАГРУЗКА GEOJSON
// ============================================================

function loadGeoJSON(file) {

    return fetch(file)

        .then(
            response => {

                if (
                    !response.ok
                ) {

                    throw new Error(
                        "Не удалось загрузить " +
                        file
                    );

                }

                return response.json();

            }
        );

}


// ============================================================
// 8. MIGRATION.CSV
// ============================================================

function prepareMigrations(data) {

    migrations = [];


    data.forEach(
        row => {

            // Убираем BOM

            let origin =
                String(
                    row.Origin || ""
                )
                .replace(
                    /^\uFEFF/,
                    ""
                )
                .trim();


            // Число переселенцев

            let number =
                String(
                    row.Number || "0"
                )
                .replace(
                    /\s/g,
                    ""
                )
                .replace(
                    ",",
                    "."
                );


            number =
                parseFloat(
                    number
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
        "Миграций:",
        migrations
    );

}


// ============================================================
// 9. NODES.CSV
// ============================================================

function prepareNodes(data) {

    nodes = {};


    data.forEach(
        row => {

            let id =
                String(
                    row.id || ""
                )
                .replace(
                    /^\uFEFF/,
                    ""
                )
                .trim();


            if (!id) {

                return;

            }


            let lat =
                String(
                    row.lat || ""
                )
                .replace(
                    ",",
                    "."
                )
                .trim();


            let lon =
                String(
                    row.lon || ""
                )
                .replace(
                    ",",
                    "."
                )
                .trim();


            lat =
                parseFloat(
                    lat
                );


            lon =
                parseFloat(
                    lon
                );


            if (
                isNaN(lat) ||
                isNaN(lon)
            ) {

                console.warn(
                    "Некорректные координаты:",
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
        "Узлов загружено:",
        Object.keys(nodes).length
    );

}


// ============================================================
// 10. GEOJSON
// ============================================================

function prepareGeoJSON(
    geojson
) {

    regions = {};


    if (
        !geojson.features
    ) {

        console.error(
            "В GeoJSON нет features"
        );

        return;

    }


    geojson.features.forEach(
        feature => {

            const name =
                String(
                    feature
                        .properties
                        ?.prov_ENG ||
                    ""
                )
                .replace(
                    /^\uFEFF/,
                    ""
                )
                .trim();


            if (!name) {

                return;

            }


            regions[name] = {

                feature:
                    feature,

                name:
                    name

            };

        }
    );


    console.log(
        "Регионов GeoJSON:",
        Object.keys(regions).length
    );

}


// ============================================================
// 11. EDGES.CSV
// ============================================================
//
// Пример:
//
// Архангельская;N1
//
// превращается:
//
// Архангельская → N1
//
//
// А:
//
// N1;N2;N3;N4;Тургайская
//
// превращается:
//
// N1 → N2
// N2 → N3
// N3 → N4
// N4 → Тургайская
//
// ============================================================

function prepareRoutes(data) {

    rawRoutes = [];


    data.forEach(
        row => {

            const values =
                Object.values(row)

                .map(
                    value =>
                        String(
                            value || ""
                        )
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


    console.log(
        "Рёбер графа:",
        rawRoutes.length
    );


    console.log(
        "Граф:",
        rawRoutes
    );

}


// ============================================================
// 12. ОПРЕДЕЛЯЕМ — УЗЕЛ ЭТО ИЛИ РЕГИОН
// ============================================================

function isNode(id) {

    return Boolean(
        nodes[id]
    );

}


function isRegion(id) {

    return Boolean(
        regions[id]
    );

}


// ============================================================
// 13. ПОЛУЧАЕМ ЦЕНТР РЕГИОНА
// ============================================================
//
// Используем Leaflet для получения центра
// bounding box.
//
// Для большинства губерний этого достаточно.
//
// ============================================================

function getRegionCenter(
    regionName
) {

    const region =
        regions[
            regionName
        ];


    if (!region) {

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
            "Не удалось получить центр:",
            regionName
        );


        return null;

    }

}


// ============================================================
// 14. ПОЛУЧАЕМ КООРДИНАТЫ ЛЮБОГО ОБЪЕКТА
// ============================================================

function getPoint(
    id
) {

    // -------------------------
    // Узел
    // -------------------------

    if (
        isNode(id)
    ) {

        return [

            nodes[id].lat,

            nodes[id].lon

        ];

    }


    // -------------------------
    // Регион
    // -------------------------

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
// 15. РИСУЕМ ГУБЕРНИИ
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
                function() {

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
// 16. РИСУЕМ УЗЛЫ
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
                        NODE_COLOR,

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
// 17. ПОИСК ПУТИ
// ============================================================
//
// Для каждого региона ищем все возможные пути
// через граф.
//
// ============================================================

function findAllPaths(
    start
) {

    const paths = [];


    const firstEdges =
        rawRoutes.filter(
            edge =>
                edge.from === start
        );


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
// 18. ОБХОД ГРАФА
// ============================================================

function walkGraph(
    current,
    path,
    paths,
    visited
) {

    // -------------------------
    // Дошли до региона
    // -------------------------

    if (
        isRegion(current)
    ) {

        paths.push(
            path
        );

        return;

    }


    // -------------------------
    // Если это неизвестный объект
    // -------------------------

    if (
        !isNode(current)
    ) {

        console.warn(
            "Неизвестный объект графа:",
            current
        );

        return;

    }


    // -------------------------
    // Защита от циклов
    // -------------------------

    if (
        visited.has(current)
    ) {

        return;

    }


    const newVisited =
        new Set(
            visited
        );


    newVisited.add(
        current
    );


    // -------------------------
    // Следующие ребра
    // -------------------------

    const nextEdges =
        rawRoutes.filter(
            edge =>
                edge.from === current
        );


    if (
        nextEdges.length === 0
    ) {

        console.warn(
            "Тупик графа:",
            current
        );

        return;

    }


    nextEdges.forEach(
        edge => {

            walkGraph(

                edge.to,

                [
                    ...path,
                    edge.to
                ],

                paths,

                newVisited

            );

        }
    );

}


// ============================================================
// 19. РАСПРЕДЕЛЯЕМ МИГРАЦИЮ ПО МАРШРУТАМ
// ============================================================
//
// Здесь рассчитываем, сколько человек проходит
// через каждый сегмент.
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

                console.warn(

                    "Не найден маршрут для:",

                    migration.origin

                );

                return;

            }


            // -----------------------------------------
            // Если у региона несколько маршрутов,
            // пока распределяем поток поровну.
            // -----------------------------------------

            const routeShare =
                migration.number /
                paths.length;


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
                                    {},

                                destinations:
                                    {}

                            };

                        }


                        segmentMap[key]
                            .value +=
                            routeShare;


                        // Запоминаем происхождение

                        if (
                            !segmentMap[key]
                                .origins[
                                    migration.origin
                                ]
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
                            routeShare;


                        // Если конечный регион

                        if (
                            isRegion(to)
                        ) {

                            if (
                                !segmentMap[key]
                                    .destinations[
                                        to
                                    ]
                            ) {

                                segmentMap[key]
                                    .destinations[
                                        to
                                    ] = 0;

                            }


                            segmentMap[key]
                                .destinations[
                                    to
                                ] +=
                                routeShare;

                        }

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
        "Рассчитанные сегменты:",
        segments
    );

}


// ============================================================
// 20. ТОЛЩИНА ПОТОКА
// ============================================================
//
// Логарифмическая шкала.
//
// Благодаря этому поток 20 000 человек
// не уничтожит визуально поток 100 человек.
//
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
            value
        ) * 3;


    return Math.min(
        width,
        MAX_FLOW_WIDTH
    );

}


// ============================================================
// 21. СОЗДАЁМ ПЛАВНУЮ ЛИНИЮ
// ============================================================
//
// Пока используем несколько промежуточных точек,
// чтобы линия выглядела мягче.
//
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


    // Небольшое смещение контрольной точки

    const offset =
        distance * 0.12;


    const controlLat =
        midLat +
        offset;


    const controlLon =
        midLon;


    const points = [];


    const steps = 12;


    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;


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


// ============================================================
// 22. РИСУЕМ ПОТОКИ
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
                    segment.to
                );

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


            const line =
                L.polyline(

                    points,

                    {

                        color:
                            FLOW_COLOR,

                        weight:
                            width,

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

                createFlowTooltip(
                    segment
                ),

                {

                    sticky:
                        true

                }

            );


            line.on(
                "click",
                function() {

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
// 23. TOOLTIP ПОТОКА
// ============================================================

function createFlowTooltip(
    segment
) {

    let html = `

        <div>

        <b>
            ${escapeHTML(
                segment.from
            )}
            →
            ${escapeHTML(
                segment.to
            )}
        </b>

        <br><br>

        <b>
            ${formatNumber(
                segment.value
            )}
        </b>

        переселенцев

        </div>

    `;


    return html;

}


// ============================================================
// 24. ИНФОРМАЦИЯ О СЕГМЕНТЕ
// ============================================================

function showSegmentInfo(
    segment
) {

    const origins =
        Object.entries(
            segment.origins
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    let originHTML =
        "";


    origins.forEach(
        item => {

            originHTML += `

                <div>
                    ${escapeHTML(
                        item[0]
                    )}
                    —
                    ${formatNumber(
                        item[1]
                    )}
                </div>

            `;

        }
    );


    const info =
        document.getElementById(
            "info"
        );


    if (!info) {

        return;

    }


    info.innerHTML = `

        <strong>

            ${escapeHTML(
                segment.from
            )}
            →
            ${escapeHTML(
                segment.to
            )}

        </strong>

        <br><br>

        Всего:

        <strong>

            ${formatNumber(
                segment.value
            )}

        </strong>

        переселенцев

        <hr>

        <b>
            Происхождение потока:
        </b>

        ${originHTML}

    `;

}


// ============================================================
// 25. ИНФОРМАЦИЯ О РЕГИОНЕ
// ============================================================

function showRegionInfo(
    regionName
) {

    const outgoing =
        migrations.filter(
            migration =>
                migration.origin ===
                regionName
        );


    const total =
        outgoing.reduce(
            (
                sum,
                migration
            ) =>
                sum +
                migration.number,

            0
        );


    const info =
        document.getElementById(
            "info"
        );


    if (!info) {

        return;

    }


    info.innerHTML = `

        <strong>

            ${escapeHTML(
                regionName
            )}

        </strong>

        <br><br>

        Исходящий поток:

        <strong>

            ${formatNumber(
                total
            )}

        </strong>

        переселенцев

    `;

}


// ============================================================
// 26. ФОРМАТ ЧИСЕЛ
// ============================================================

function formatNumber(
    number
) {

    return Number(
        number
    )
    .toLocaleString(
        "ru-RU",
        {

            maximumFractionDigits:
                0

        }
    );

}


// ============================================================
// 27. ЗАЩИТА HTML
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
// 28. ПОДГОНЯЕМ КАРТУ ПОД GEOJSON
// ============================================================

function fitMapToRegions() {

    const layers = [];


    Object.values(
        regions
    )
    .forEach(
        region => {

            try {

                const layer =
                    L.geoJSON(
                        region.feature
                    );


                layers.push(
                    layer
                );

            }

            catch (
                error
            ) {

                console.warn(
                    error
                );

            }

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
// 29. ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА
// ============================================================
//
// Показываем в консоли регионы,
// для которых не найден маршрут.
//
// ============================================================

setTimeout(
    function() {

        if (
            migrations.length === 0
        ) {

            return;

        }


        migrations.forEach(
            migration => {

                const paths =
                    findAllPaths(
                        migration.origin
                    );


                if (
                    paths.length === 0
                ) {

                    console.warn(

                        "⚠ Нет маршрута:",
                        migration.origin

                    );

                }

            }
        );


        console.log(
            "Проверка маршрутов завершена."
        );

    },

    2000
);
