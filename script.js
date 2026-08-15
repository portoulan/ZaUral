// ============================================================
// КАРТА МИГРАЦИЙ
// ============================================================

const FILES = {
    migration: "data/migration.csv",
    nodes: "data/NODES.csv",
    edges: "data/EDGES.csv",
    geojson: "data/data.geojson"
};


// ============================================================
// НАСТРОЙКИ
// ============================================================

const MAX_FLOW_WIDTH = 25;
const MIN_FLOW_WIDTH = 1.5;
const FLOW_OPACITY = 0.65;
const FLOW_COLOR = "#c62828";
const NODE_COLOR = "#222";
const NODE_RADIUS = 4;


// ============================================================
// КАРТА
// ============================================================

const map = L.map("map", {
    zoomControl: true
}).setView([55, 70], 4);


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// ============================================================
// СЛОИ
// ============================================================

const regionsLayer = L.layerGroup().addTo(map);
const flowsLayer = L.layerGroup().addTo(map);
const nodesLayer = L.layerGroup().addTo(map);


// ============================================================
// ДАННЫЕ
// ============================================================

let migrations = [];
let nodes = {};
let rawRoutes = [];
let segments = [];
let regions = {};


// ============================================================
// ЗАПУСК
// ============================================================

Promise.all([

    loadCSV(FILES.migration),

    loadCSV(FILES.nodes),

    loadCSV(FILES.edges),

    loadGeoJSON(FILES.geojson)

])

.then(([migrationData, nodeData, edgeData, geojson]) => {

    console.log("Migration:", migrationData);
    console.log("Nodes:", nodeData);
    console.log("Edges:", edgeData);
    console.log("GeoJSON:", geojson);


    prepareMigrations(migrationData);

    prepareNodes(nodeData);

    prepareGeoJSON(geojson);

    prepareRoutes(edgeData);


    drawRegions();

    drawNodes();

    calculateSegments();

    drawFlows();

    fitMapToRegions();


    console.log("Карта успешно построена.");

})

.catch(error => {

    console.error("ОШИБКА:", error);

    alert(
        "Ошибка загрузки данных.\n\n" +
        error.message +
        "\n\n" +
        "Откройте F12 → Console для подробностей."
    );

});


// ============================================================
// ЗАГРУЗКА CSV БЕЗ PAPAPARSE
// ============================================================

async function loadCSV(file) {

    const response = await fetch(file);

    if (!response.ok) {

        throw new Error(
            `Не удалось загрузить ${file}. HTTP ${response.status}`
        );

    }

    const text = await response.text();

    return parseCSV(text);
}


// ============================================================
// ПРОСТОЙ ПАРСЕР CSV С РАЗДЕЛИТЕЛЕМ ;
// ============================================================

function parseCSV(text) {

    // Убираем BOM

    text = text.replace(/^\uFEFF/, "");


    // Разбиваем на строки

    const lines = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .filter(line => line.trim() !== "");


    if (lines.length === 0) {

        return [];

    }


    const headers = parseCSVLine(
        lines[0]
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
            (header, index) => {

                row[header.trim()] =
                    values[index] !== undefined
                        ? values[index].trim()
                        : "";

            }
        );


        result.push(row);

    }


    return result;

}


// ============================================================
// РАЗБОР ОДНОЙ СТРОКИ CSV
// ============================================================

function parseCSVLine(line) {

    const result = [];

    let current = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char = line[i];


        if (char === '"') {

            // Двойные кавычки внутри кавычек

            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            } else {

                insideQuotes =
                    !insideQuotes;

            }

        }

        else if (
            char === ";" &&
            !insideQuotes
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
// GEOJSON
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
// MIGRATION.CSV
// ============================================================

function prepareMigrations(data) {

    migrations = [];


    data.forEach(row => {

        const origin =
            String(
                row.Origin || ""
            )
            .replace(/^\uFEFF/, "")
            .trim();


        const number =
            parseFloat(
                String(
                    row.Number || "0"
                )
                .replace(/\s/g, "")
                .replace(",", ".")
            );


        if (
            !origin ||
            isNaN(number) ||
            number <= 0
        ) {

            return;

        }


        migrations.push({

            origin: origin,

            number: number

        });

    });


    console.log(
        "Загружено миграций:",
        migrations.length
    );

}


// ============================================================
// NODES.CSV
// ============================================================

function prepareNodes(data) {

    nodes = {};


    data.forEach(row => {

        const id =
            String(
                row.id || ""
            )
            .replace(/^\uFEFF/, "")
            .trim();


        if (!id) {

            return;

        }


        const lat =
            parseFloat(
                String(
                    row.lat || ""
                )
                .replace(",", ".")
                .trim()
            );


        const lon =
            parseFloat(
                String(
                    row.lon || ""
                )
                .replace(",", ".")
                .trim()
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

            id: id,

            lat: lat,

            lon: lon

        };

    });


    console.log(
        "Загружено узлов:",
        Object.keys(nodes).length
    );

}


// ============================================================
// GEOJSON
// ============================================================

function prepareGeoJSON(geojson) {

    regions = {};


    if (
        !geojson.features
    ) {

        throw new Error(
            "В data.geojson отсутствует массив features."
        );

    }


    geojson.features.forEach(feature => {

        const name =
            String(
                feature.properties?.prov_ENG || ""
            )
            .replace(/^\uFEFF/, "")
            .trim();


        if (!name) {

            return;

        }


        regions[name] = {

            feature: feature,

            name: name

        };

    });


    console.log(
        "Загружено регионов:",
        Object.keys(regions).length
    );

}


// ============================================================
// EDGES.CSV
// ============================================================

function prepareRoutes(data) {

    rawRoutes = [];


    data.forEach(row => {

        const values =
            Object.values(row)

            .map(value =>
                String(value || "")
                    .replace(/^\uFEFF/, "")
                    .trim()
            )

            .filter(value =>
                value !== ""
            );


        if (
            values.length < 2
        ) {

            return;

        }


        // Например:
        //
        // N1;N2;N3;N4;Тургайская
        //
        // превращается в:
        //
        // N1 → N2
        // N2 → N3
        // N3 → N4
        // N4 → Тургайская


        for (
            let i = 0;
            i < values.length - 1;
            i++
        ) {

            rawRoutes.push({

                from: values[i],

                to: values[i + 1]

            });

        }

    });


    console.log(
        "Загружено рёбер:",
        rawRoutes.length
    );

}


// ============================================================
// ПРОВЕРКА ОБЪЕКТОВ
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
// ЦЕНТР ГУБЕРНИИ
// ============================================================

function getRegionCenter(regionName) {

    const region =
        regions[regionName];


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

    catch (error) {

        console.warn(
            "Не удалось получить центр:",
            regionName
        );

        return null;

    }

}


// ============================================================
// КООРДИНАТЫ ЛЮБОГО ОБЪЕКТА
// ============================================================

function getPoint(id) {

    if (
        isNode(id)
    ) {

        return [
            nodes[id].lat,
            nodes[id].lon
        ];

    }


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
// РЕГИОНЫ
// ============================================================

function drawRegions() {

    regionsLayer.clearLayers();


    Object.values(
        regions
    )
    .forEach(region => {

        const layer =
            L.geoJSON(
                region.feature,
                {

                    style: {

                        color: "#777",

                        weight: 0.8,

                        fillColor: "#eeeeee",

                        fillOpacity: 0.25

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

    });

}


// ============================================================
// УЗЛЫ
// ============================================================

function drawNodes() {

    nodesLayer.clearLayers();


    Object.values(
        nodes
    )
    .forEach(node => {

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

    });

}


// ============================================================
// ПОИСК ВСЕХ МАРШРУТОВ
// ============================================================

function findAllPaths(start) {

    const paths = [];


    const firstEdges =
        rawRoutes.filter(
            edge =>
                edge.from === start
        );


    firstEdges.forEach(edge => {

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

    });


    return paths;

}


// ============================================================
// ОБХОД ГРАФА
// ============================================================

function walkGraph(
    current,
    path,
    paths,
    visited
) {

    // Дошли до губернии назначения

    if (
        isRegion(current)
    ) {

        paths.push(
            path
        );

        return;

    }


    // Неизвестный объект

    if (
        !isNode(current)
    ) {

        console.warn(
            "Неизвестный объект:",
            current
        );

        return;

    }


    // Защита от циклов

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


    const nextEdges =
        rawRoutes.filter(
            edge =>
                edge.from === current
        );


    if (
        nextEdges.length === 0
    ) {

        console.warn(
            "Тупик:",
            current
        );

        return;

    }


    nextEdges.forEach(edge => {

        walkGraph(

            edge.to,

            [
                ...path,
                edge.to
            ],

            paths,

            newVisited

        );

    });

}


// ============================================================
// РАСЧЁТ ПОТОКОВ
// ============================================================

function calculateSegments() {

    const segmentMap = {};


    migrations.forEach(migration => {

        const paths =
            findAllPaths(
                migration.origin
            );


        if (
            paths.length === 0
        ) {

            console.warn(
                "Не найден маршрут:",
                migration.origin
            );

            return;

        }


        // Если несколько веток,
        // пока распределяем поток поровну.

        const routeShare =
            migration.number /
            paths.length;


        paths.forEach(path => {

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

                        from: from,

                        to: to,

                        value: 0,

                        origins: {}

                    };

                }


                segmentMap[key].value +=
                    routeShare;


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

            }

        });

    });


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
// ТОЛЩИНА
// ============================================================

function getFlowWidth(value) {

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
// ПЛАВНАЯ ЛИНИЯ
// ============================================================

function createSmoothPath(
    from,
    to
) {

    const lat1 = from[0];
    const lon1 = from[1];

    const lat2 = to[0];
    const lon2 = to[1];


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


    const offset =
        distance * 0.12;


    const controlLat =
        midLat + offset;


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


        const mt =
            1 - t;


        const lat =
            mt * mt * lat1 +
            2 * mt * t * controlLat +
            t * t * lat2;


        const lon =
            mt * mt * lon1 +
            2 * mt * t * controlLon +
            t * t * lon2;


        points.push([
            lat,
            lon
        ]);

    }


    return points;

}


// ============================================================
// РИСУЕМ ПОТОКИ
// ============================================================

function drawFlows() {

    flowsLayer.clearLayers();


    segments.forEach(segment => {

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

            `
            <b>
                ${escapeHTML(
                    segment.from
                )}
                →
                ${escapeHTML(
                    segment.to
                )}
            </b>

            <br>

            ${formatNumber(
                segment.value
            )}
            переселенцев
            `,

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
// ИНФОРМАЦИЯ О СЕГМЕНТЕ
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


    let html = "";


    origins.forEach(
        ([origin, value]) => {

            html += `

                <div>
                    ${escapeHTML(origin)}
                    —
                    ${formatNumber(value)}
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
            Состав потока:
        </b>

        ${html}

    `;

}


// ============================================================
// ИНФОРМАЦИЯ О ГУБЕРНИИ
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
            (sum, migration) =>
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
// ФОРМАТ ЧИСЕЛ
// ============================================================

function formatNumber(number) {

    return Number(number)
        .toLocaleString(
            "ru-RU",
            {
                maximumFractionDigits: 0
            }
        );

}


// ============================================================
// ЭКРАНИРОВАНИЕ HTML
// ============================================================

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


// ============================================================
// МАСШТАБ КАРТЫ
// ============================================================

function fitMapToRegions() {

    const layers = [];


    Object.values(
        regions
    )
    .forEach(region => {

        try {

            layers.push(
                L.geoJSON(
                    region.feature
                )
            );

        }

        catch (error) {

            console.warn(
                error
            );

        }

    });


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
            padding: [30, 30]
        }
    );

}


// ============================================================
// ДИАГНОСТИКА
// ============================================================

setTimeout(() => {

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
                    "⚠ Не найден путь:",
                    migration.origin
                );

            }

        }
    );


}, 1000);
