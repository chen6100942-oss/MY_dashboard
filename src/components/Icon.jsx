import React from 'react';

const fallbackIcons = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    moon: '<path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>',
    hourglass: '<path d="M6 2h12M6 22h12M7 2c0 5 2 6 5 10-3 4-5 5-5 10M17 2c0 5-2 6-5 10 3 4 5 5 5 10"/>',
    'layout-grid': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    'volume-2': '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    'volume-x': '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 10 5 5m0-5-5 5"/>',
    'music-2': '<circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V5l10-2v13M11 9l10-2"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
    'list-todo': '<path d="m3 6 1.5 1.5L7 5"/><path d="M10 6h11"/><path d="m3 12 1.5 1.5L7 11"/><path d="M10 12h11"/><path d="m3 18 1.5 1.5L7 17"/><path d="M10 18h11"/>',
    'calendar-clock': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><circle cx="15.5" cy="15.5" r="3"/><path d="M15.5 14v1.7l1.2.8"/>',
    'trending-up': '<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/>',
    brain: '<path d="M9.5 4.5A3 3 0 0 0 5 7a3 3 0 0 0-1 5.5A3 3 0 0 0 7 18h2.5V4.5ZM14.5 4.5A3 3 0 0 1 19 7a3 3 0 0 1 1 5.5A3 3 0 0 1 17 18h-2.5V4.5Z"/><path d="M9.5 9H7M14.5 9H17M9.5 14H7.5M14.5 14h2"/>',
    lightbulb: '<path d="M9 18h6M10 22h4"/><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5L15 18H9l-.5-2.5Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>',
    archive: '<rect x="3" y="5" width="18" height="4" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    'flower-2': '<path d="M12 21c-3-2.3-5.3-5-6.4-8.1 2.7-.1 4.8.7 6.4 2.4 1.6-1.7 3.7-2.5 6.4-2.4C17.3 16 15 18.7 12 21Z"/><path d="M12 15.3C8.8 13.4 7.2 10.7 7.3 7.1c2.1.5 3.6 1.7 4.7 3.5 1.1-1.8 2.6-3 4.7-3.5.1 3.6-1.5 6.3-4.7 8.2Z"/><path d="M12 10.6C10.2 8.7 9.7 6.2 12 3c2.3 3.2 1.8 5.7 0 7.6Z"/><path d="M4 21h16"/>',
    'edit-3': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
    'arrow-up-right': '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    'heart-handshake': '<path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 0 1 12 6a5 5 0 0 1 7.5 6.6Z"/><path d="m8.5 12 2.1 2.1a2 2 0 0 0 2.8 0l2.1-2.1"/>',
    coffee: '<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    plane: '<path fill="currentColor" stroke="none" d="M12 1 14 8 21 12 14 12.5 15 20 18 21.5 12 20.5 6 21.5 9 20 10 12.5 3 12 10 8Z"/>',
    dumbbell: '<path d="M4 9v6M2 10v4M20 9v6M22 10v4M7 7v10M17 7v10M7 12h10"/>',
    'check-square': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    'book-open': '<path d="M12 7v13"/><path d="M4 5h6a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2Z"/><path d="M20 5h-6a2 2 0 0 0-2 2v13h6a2 2 0 0 0 2-2Z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'piggy-bank': '<path d="M19 5c-1.5 0-2.8 1.1-3.3 2.5-3.3-1-9.7-.2-9.7 4.5 0 1.6.3 2.7 1 3.5V19h3v-1.5h4V19h3v-3c1-.3 1.7-1 2-2h1v-3h-1c-.1-1-.5-1.8-1-2.5V5Z"/><circle cx="15.5" cy="10.5" r="1"/>',
    map: '<path d="M9 3v15"/><path d="M15 6v15"/><path d="M3 6.5v13l6-2.5 6 2.5 6-2.5v-13l-6 2.5-6-2.5Z"/>',
    save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 3v5h7V3"/><path d="M7 21v-7h10v7"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    star: '<path d="M12 2.5 14.9 9 22 9.7l-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.7 9.1 9Z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'trash-2': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    'palm-tree': '<path d="M13 8c0-2.76-2.5-5-5.5-5S2 5.24 2 8c1.5-1 3-1 4.5 0"/><path d="M13 8c0-2.76 2.5-5 5.5-5S24 5.24 24 8c-1.5-1-3-1-4.5 0"/><path d="M13 8v13"/><path d="M13 8c-2 0-4 1-5 3"/><path d="M9 21h8"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.3a16 16 0 0 0 6 6l1.5-1.4a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2Z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    'paperclip': '<path d="M21.4 11.4 12 20.8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L9.9 18.6a2 2 0 0 1-3-3l7.5-7.4"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 20h16"/>',
};

// A few glyphs are more recognizable (and safer than a hand-drawn path) rendered
// as an actual text character in the system font, colored via currentColor.
const textGlyphs = {
    plane: '✈',
};

const Icon = ({ name, size = 24, className = "", ...props }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        let cancelled = false;
        let retryTimer;
        const drawIcon = (attempt = 0) => {
            if (cancelled || !ref.current) return;
            ref.current.innerHTML = '';
            if (textGlyphs[name]) {
                ref.current.innerHTML = `<span style="font-size:${Math.round(size*0.86)}px;line-height:1;color:currentColor">${textGlyphs[name]}</span>`;
                return;
            }
            try {
                const iconName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
                const iconLibrary = window.lucide;
                if (iconLibrary?.[iconName]) {
                    const [tag, attrs, children] = iconLibrary[iconName];
                    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', tag);
                    Object.entries({...attrs, width: size, height: size, class: className}).forEach(([k,v]) => { if(v) svgEl.setAttribute(k, v); });
                    (children||[]).forEach(([childTag, childAttrs]) => {
                        const el = document.createElementNS('http://www.w3.org/2000/svg', childTag);
                        Object.entries(childAttrs||{}).forEach(([k,v]) => el.setAttribute(k,v));
                        svgEl.appendChild(el);
                    });
                    ref.current.appendChild(svgEl);
                    return;
                }
            } catch(e) {}
            if (attempt < 8) {
                retryTimer = window.setTimeout(() => drawIcon(attempt + 1), 100);
            } else if (fallbackIcons[name] && ref.current) {
                ref.current.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}">${fallbackIcons[name]}</svg>`;
            }
        };
        drawIcon();
        return () => {
            cancelled = true;
            if (retryTimer) window.clearTimeout(retryTimer);
        };
    }, [name, size, className]);
    return React.createElement('span', { ref, style: { display:'inline-flex', alignItems:'center', justifyContent:'center', width: size, height: size }, ...props });
};

export default Icon;
