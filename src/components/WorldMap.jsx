import { useEffect, useRef } from 'react';
import { loadAmCharts } from '../lib/loadScript.js';

// Static picture of where she's been — the colours mirror the status dropdowns
// in the country list below it. Deliberately not clickable: status is changed
// in the list, the map only reflects it. Trip planning lives in TravelHub.
const WorldMap = ({ worldVisited, worldUpcoming, worldBlocked, colors }) => {
    const chartDivRef = useRef(null);
    const rootRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        loadAmCharts().then(() => {
            if (cancelled || !chartDivRef.current || !window.am5 || !window.am5map) return;
            const am5 = window.am5;
            const am5map = window.am5map;
            const am5themes_Animated = window.am5themes_Animated;

            const root = am5.Root.new(chartDivRef.current);
            rootRef.current = root;
            root.setThemes([am5themes_Animated.new(root)]);

            const chart = root.container.children.push(am5map.MapChart.new(root, {
                panX: 'rotateX',
                panY: 'translateY',
                projection: am5map.geoNaturalEarth1(),
                homeZoomLevel: 1,
            }));

            const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
                geoJSON: window.am5geodata_worldLow,
                exclude: ['AQ'],
            }));

            polygonSeries.mapPolygons.template.setAll({
                tooltipText: '{name}',
                interactive: true,
                fill: am5.color(colors.none),
                stroke: am5.color(0xfffdf9),
                strokeWidth: 0.6,
            });

            const colorCountries = () => {
                polygonSeries.mapPolygons.each(polygon => {
                    const id = polygon.dataItem?.get('id');
                    if (worldVisited.includes(id)) {
                        polygon.set('fill', am5.color(colors.visited));
                    } else if (worldUpcoming.includes(id)) {
                        polygon.set('fill', am5.color(colors.upcoming));
                    } else if (worldBlocked.includes(id)) {
                        polygon.set('fill', am5.color(colors.blocked));
                    } else {
                        polygon.set('fill', am5.color(colors.none));
                    }
                });
            };

            polygonSeries.events.on('datavalidated', colorCountries);
        });

        return () => {
            cancelled = true;
            if (rootRef.current) { rootRef.current.dispose(); rootRef.current = null; }
        };
    }, [worldVisited.join(','), worldUpcoming.join(','), worldBlocked.join(','), colors.visited, colors.upcoming, colors.blocked, colors.none]);

    return <div ref={chartDivRef} style={{ width: '100%', height: '430px', borderRadius: '1rem', overflow: 'hidden' }} />;
};

export default WorldMap;
