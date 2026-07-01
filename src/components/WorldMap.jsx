import { useEffect, useRef } from 'react';
import { loadAmCharts } from '../lib/loadScript.js';

const WorldMap = ({ worldVisited, worldUpcoming, worldBlocked, setWorldVisited, setWorldUpcoming, setWorldBlocked }) => {
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
                toggleKey: 'active',
                interactive: true,
                fill: am5.color(0xe2e8f0),
                stroke: am5.color(0xffffff),
                strokeWidth: 0.5,
            });

            polygonSeries.mapPolygons.template.states.create('hover', {
                fill: am5.color(0xa78bfa),
            });

            const colorCountries = () => {
                polygonSeries.mapPolygons.each(polygon => {
                    const id = polygon.dataItem?.get('id');
                    if (worldVisited.includes(id)) {
                        polygon.set('fill', am5.color(0x10b981));
                    } else if (worldUpcoming.includes(id)) {
                        polygon.set('fill', am5.color(0xf59e0b));
                    } else if (worldBlocked.includes(id)) {
                        polygon.set('fill', am5.color(0xdc2626));
                    } else {
                        polygon.set('fill', am5.color(0xe2e8f0));
                    }
                });
            };

            polygonSeries.events.on('datavalidated', colorCountries);

            polygonSeries.mapPolygons.template.events.on('click', (ev) => {
                const id = ev.target.dataItem?.get('id');
                if (!id) return;
                if (worldVisited.includes(id)) {
                    setWorldVisited(prev => prev.filter(c => c !== id));
                    setWorldUpcoming(prev => [...prev.filter(c => c !== id), id]);
                } else if (worldUpcoming.includes(id)) {
                    setWorldUpcoming(prev => prev.filter(c => c !== id));
                    setWorldBlocked(prev => [...prev.filter(c => c !== id), id]);
                } else if (worldBlocked.includes(id)) {
                    setWorldBlocked(prev => prev.filter(c => c !== id));
                } else {
                    setWorldVisited(prev => [...prev, id]);
                }
            });
        });

        return () => {
            cancelled = true;
            if (rootRef.current) { rootRef.current.dispose(); rootRef.current = null; }
        };
    }, [worldVisited.join(','), worldUpcoming.join(','), worldBlocked.join(',')]);

    return <div ref={chartDivRef} style={{ width: '100%', height: '420px', borderRadius: '1rem', overflow: 'hidden' }} />;
};

export default WorldMap;
