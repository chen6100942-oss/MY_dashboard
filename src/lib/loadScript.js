const loadedScripts = {};

function loadScript(src) {
    if (loadedScripts[src]) return loadedScripts[src];
    loadedScripts[src] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
    return loadedScripts[src];
}

const AMCHARTS_SCRIPTS = [
    'https://cdn.amcharts.com/lib/5/index.js',
    'https://cdn.amcharts.com/lib/5/map.js',
    'https://cdn.amcharts.com/lib/5/geodata/worldLow.js',
    'https://cdn.amcharts.com/lib/5/themes/Animated.js',
];

export async function loadAmCharts() {
    for (const src of AMCHARTS_SCRIPTS) {
        await loadScript(src);
    }
}
