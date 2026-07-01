import React from 'react';

const Icon = ({ name, size = 24, className = "", ...props }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = '';
            try {
                const iconName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
                if (lucide[iconName]) {
                    const [tag, attrs, children] = lucide[iconName];
                    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', tag);
                    Object.entries({...attrs, width: size, height: size, class: className}).forEach(([k,v]) => { if(v) svgEl.setAttribute(k, v); });
                    (children||[]).forEach(([childTag, childAttrs]) => {
                        const el = document.createElementNS('http://www.w3.org/2000/svg', childTag);
                        Object.entries(childAttrs||{}).forEach(([k,v]) => el.setAttribute(k,v));
                        svgEl.appendChild(el);
                    });
                    ref.current.appendChild(svgEl);
                }
            } catch(e) {}
        }
    }, [name, size, className]);
    return React.createElement('span', { ref, style: { display:'inline-flex', alignItems:'center', justifyContent:'center', width: size, height: size }, ...props });
};

export default Icon;
