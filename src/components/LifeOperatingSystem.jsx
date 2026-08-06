import React, { useMemo, useState, useEffect } from 'react';

// Brand color wheel palette (light tan → taupe → rust-brown → cream → light beige), going clockwise
const worlds = [
  { id: 'body', label: 'גוף', icon: '🧘', color: '#D9C8AE', prompt: 'מה הגוף שלך צריך כדי להרגיש חיוני יותר?' },
  { id: 'mind', label: 'תודעה', icon: '🧠', color: '#B7AA9B', prompt: 'איזו מחשבה תשרת את הגרסה החדשה שלך היום?' },
  { id: 'money', label: 'כסף', icon: '💰', color: '#A48A76', prompt: 'איזו פעולה קטנה תיצור יותר ביטחון כלכלי?' },
  { id: 'relations', label: 'מערכות יחסים', icon: '🤝', color: '#8B4A2E', prompt: 'למי נכון להעניק היום נוכחות אמיתית?' },
  { id: 'purpose', label: 'ייעוד', icon: '🧭', color: '#F2ECE0', prompt: 'איזו עשייה מקרבת אותך לעבודה המשמעותית שלך?' },
  { id: 'spirit', label: 'רוח', icon: '🕊', color: '#C9BBA4', prompt: 'מה יחזיר אותך היום למרכז שלך?' }
];

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const polar = (cx, cy, radius, angle) => {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
};
const ringSlice = (startAngle, endAngle, innerRadius, outerRadius) => {
  const a = polar(160, 160, outerRadius, startAngle);
  const b = polar(160, 160, outerRadius, endAngle);
  const c = polar(160, 160, innerRadius, endAngle);
  const d = polar(160, 160, innerRadius, startAngle);
  return `M ${a.x} ${a.y} A ${outerRadius} ${outerRadius} 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${innerRadius} ${innerRadius} 0 0 0 ${d.x} ${d.y} Z`;
};
// Simple relative-luminance check so text stays readable on both light and dark segments
const isDark = hex => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150;
};

export default function LifeOperatingSystem({ userName = 'חן', onOpenWorld }) {
  const [scores, setScores] = useState(() => read('insideout-life-scores', { body: 72, mind: 81, money: 58, relations: 76, purpose: 68, spirit: 84 }));
  const [selectedWorld, setSelectedWorld] = useState('mind');
  const startDate = useMemo(() => {
    const saved = localStorage.getItem('insideout-journey-start');
    if (saved) return new Date(saved);
    const d = new Date(); d.setDate(d.getDate() - 183); localStorage.setItem('insideout-journey-start', d.toISOString()); return d;
  }, []);
  const journeyDay = Math.max(1, Math.floor((new Date() - startDate) / 86400000) + 1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  const selected = worlds.find(world => world.id === selectedWorld);
  const average = Math.round(Object.values(scores).reduce((sum, score) => sum + Number(score || 0), 0) / worlds.length);

  // Snapshot taken once per day, so each world can show whether it rose or fell since then
  const baseline = useMemo(() => {
    const today = new Date().toDateString();
    const stored = read('insideout-life-baseline', null);
    if (stored?.date === today) return stored.scores;
    const fresh = { date: today, scores };
    localStorage.setItem('insideout-life-baseline', JSON.stringify(fresh));
    return fresh.scores;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const trend = delta => delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  useEffect(() => localStorage.setItem('insideout-life-scores', JSON.stringify(scores)), [scores]);

  return (
    <section className="life-os life-os-bare" aria-label="חדר הבקרה של החיים">
      <div className="life-os-row">
      <div className="life-os-greeting-top">
        <span>INSIDE OUT · LIFE OS</span>
        <h2>{greeting}, {userName}</h2>
        <p>היום הוא היום ה־<b>{journeyDay}</b> במסע שלך</p>
      </div>
      <div className="life-wheel-standalone">
        <div className="life-wheel-wrap">
          <svg className="life-wheel" viewBox="0 0 320 320" role="img" aria-label="גלגל החיים">
            <defs>
              <filter id="wheel-depth" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#4a3325" floodOpacity=".18" />
              </filter>
            </defs>
            <g filter="url(#wheel-depth)">
              {worlds.map((world, index) => {
                const score = scores[world.id];
                const delta = score - Number(baseline[world.id] ?? score);
                const dir = trend(delta);
                const start = index * 60 + 1.4;
                const end = (index + 1) * 60 - 1.4;
                const labelPoint = polar(160, 160, 108, index * 60 + 30);
                const ink = isDark(world.color) ? '#fdf8f2' : '#4a3325';
                return <g key={world.id} role="button" tabIndex="0" aria-label={`${world.label} ${score}% ${dir === 'up' ? 'במגמת עלייה' : dir === 'down' ? 'במגמת ירידה' : 'יציב'}`} className={selectedWorld === world.id ? 'active' : ''} onClick={() => { setSelectedWorld(world.id); onOpenWorld?.(world.id); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { setSelectedWorld(world.id); onOpenWorld?.(world.id); } }}>
                  <path className="wheel-segment-value" d={ringSlice(start, end, 73, 145)} fill={world.color} />
                  <text x={labelPoint.x} y={labelPoint.y - 12} className="wheel-icon" textAnchor="middle">{world.icon}</text>
                  <text x={labelPoint.x} y={labelPoint.y + 3} className="wheel-label" textAnchor="middle" fill={ink}>{world.label}</text>
                  <text x={labelPoint.x} y={labelPoint.y + 15} textAnchor="middle">
                    <tspan className="wheel-value" fill={ink}>{score}%</tspan>
                    {dir !== 'flat' && <tspan className={`wheel-trend wheel-trend-${dir}`}> {dir === 'up' ? '▲' : '▼'}</tspan>}
                  </text>
                </g>;
              })}
              <circle cx="160" cy="160" r="68" className="wheel-center" />
              <text x="160" y="150" className="wheel-center-title" textAnchor="middle">מדד חיים נוכחי</text>
              <text x="160" y="184" className="wheel-center-value" textAnchor="middle">{average}%</text>
            </g>
          </svg>
        </div>
        <div className="world-score-editor">
          <span>{selected?.icon} {selected?.label}</span>
          <input type="range" min="0" max="100" value={scores[selectedWorld]} onChange={event => setScores(current => ({ ...current, [selectedWorld]: Number(event.target.value) }))} style={{ '--world': selected?.color }} />
          <b>{scores[selectedWorld]}/100</b>
          {selectedWorld && scores[selectedWorld] !== baseline[selectedWorld] && (
            <em className={`wheel-trend wheel-trend-${trend(scores[selectedWorld] - Number(baseline[selectedWorld] ?? scores[selectedWorld]))}`}>
              {scores[selectedWorld] > baseline[selectedWorld] ? '▲' : '▼'} מאז היום
            </em>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
