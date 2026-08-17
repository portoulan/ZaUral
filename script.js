// ============================================================
// ПОИСК МАРШРУТОВ ПО ГРАФУ
// ============================================================

function findAllPaths(start) {

    const paths = [];

    const startEdges = rawRoutes.filter(
        edge => edge.from === start
    );

    // Если регион является источником,
    // начинаем только с его исходящих рёбер.
    startEdges.forEach(edge => {

        walkGraph(
            edge.to,
            [start, edge.to],
            paths,
            new Set([start])
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

    // --------------------------------------------------------
    // Если текущий объект — конечный регион,
    // маршрут закончен.
    //
    // НО только если мы действительно пришли сюда
    // через ребро.
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
    // Защита от циклов
    // --------------------------------------------------------

    if (
        visited.has(current)
    ) {

        console.warn(
            "Цикл:",
            path.join(" → ")
        );

        return;
    }


    const nextVisited =
        new Set(visited);

    nextVisited.add(current);


    // --------------------------------------------------------
    // Ищем все исходящие рёбра
    // --------------------------------------------------------

    const outgoing =
        rawRoutes.filter(
            edge =>
                edge.from === current
        );


    // --------------------------------------------------------
    // Тупик
    // --------------------------------------------------------

    if (
        outgoing.length === 0
    ) {

        // Если это узел без выхода,
        // маршрут не завершён корректно.

        console.warn(
            "ТУПИК:",
            current,
            "|",
            path.join(" → ")
        );

        return;
    }


    // --------------------------------------------------------
    // Продолжаем по всем веткам
    // --------------------------------------------------------

    outgoing.forEach(edge => {

        const next =
            edge.to;


        walkGraph(

            next,

            [
                ...path,
                next
            ],

            paths,

            nextVisited

        );

    });

}


// ============================================================
// РАСЧЁТ ПОТОКОВ
// ============================================================

function calculateSegments() {

    const segmentMap = {};


    migrations.forEach(
        migration => {

            const origin =
                migration.origin;

            const number =
                migration.number;


            // ------------------------------------------------
            // Ищем реальные маршруты
            // ------------------------------------------------

            const paths =
                findAllPaths(
                    origin
                );


            console.log(
                "----------------------------------------"
            );

            console.log(
                origin,
                "—",
                number
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
            // Нет маршрута
            // ------------------------------------------------

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
            // Если несколько ветвей,
            // делим поток между ними
            // ------------------------------------------------

            const share =
                number /
                paths.length;


            // ------------------------------------------------
            // Добавляем каждый участок
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
