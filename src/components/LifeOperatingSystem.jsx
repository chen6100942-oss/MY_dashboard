import React, { useMemo, useState, useEffect } from 'react';

// One monochrome hue, stepped from light to deep, instead of six different colors
const worlds = [
  { id: 'body', label: 'גוף', icon: '🧘', color: '#E7D8C4', prompt: 'מה הגוף שלך צריך כדי להרגיש חיוני יותר?' },
  { id: 'mind', label: 'תודעה', icon: '🧠', color: '#DAC4A6', prompt: 'איזו מחשבה תשרת את הגרסה החדשה שלך היום?' },
  { id: 'money', label: 'כסף', icon: '💰', color: '#CBAF8B', prompt: 'איזו פעולה קטנה תיצור יותר ביטחון כלכלי?' },
  { id: 'relations', label: 'מערכות יחסים', icon: '🤝', color: '#BB9970', prompt: 'למי נכון להעניק היום נוכחות אמיתית?' },
  { id: 'purpose', label: 'ייעוד', icon: '🧭', color: '#A8825A', prompt: 'איזו עשייה מקרבת אותך לעבודה המשמעותית שלך?' },
  { id: 'spirit', label: 'רוח', icon: '🕊', color: '#8F6845', prompt: 'מה יחזיר אותך היום למרכז שלך?' }
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

export default function LifeOperatingSystem({ onOpenWorld }) {
  const [scores, setScores] = useState(() => read('insideout-life-scores', { body: 72, mind: 81, money: 58, relations: 76, purpose: 68, spirit: 84 }));
  const [selectedWorld, setSelectedWorld] = useState('mind');
  const selected = worlds.find(world => world.id === selectedWorld);
  const average = Math.round(Object.values(scores).reduce((sum, score) => sum + Number(score || 0), 0) / worlds.length);

  // Snapshot taken once per day, so each world (and the overall average) can show whether it rose or fell since then
  const baseline = useMemo(() => {
    const today = new Date().toDateString();
    const stored = read('insideout-life-baseline', null);
    if (stored?.date === today) return stored.scores;
    const fresh = { date: today, scores };
    localStorage.setItem('insideout-life-baseline', JSON.stringify(fresh));
    return fresh.scores;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const baselineAverage = Math.round(Object.values(baseline).reduce((sum, score) => sum + Number(score || 0), 0) / worlds.length);
  const trend = delta => delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  useEffect(() => localStorage.setItem('insideout-life-scores', JSON.stringify(scores)), [scores]);

  return (
    <section className="life-os life-os-bare" aria-label="חדר הבקרה של החיים">
      <div className="life-wheel-standalone">
        <span className="life-wheel-side-label">גלגל החיים</span>
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
                const scoreRadius = 73 + (score / 100) * 72;
                const labelPoint = polar(160, 160, 108, index * 60 + 30);
                return <g key={world.id} role="button" tabIndex="0" aria-label={`${world.label} ${score}% ${dir === 'up' ? 'במגמת עלייה' : dir === 'down' ? 'במגמת ירידה' : 'יציב'}`} className={selectedWorld === world.id ? 'active' : ''} onClick={() => { setSelectedWorld(world.id); onOpenWorld?.(world.id); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { setSelectedWorld(world.id); onOpenWorld?.(world.id); } }}>
                  <path className="wheel-segment-base" d={ringSlice(start, end, 73, 145)} />
                  <path className="wheel-segment-value" d={ringSlice(start, end, 73, scoreRadius)} fill={world.color} />
                  <text x={labelPoint.x} y={labelPoint.y - 12} className="wheel-icon" textAnchor="middle">{world.icon}</text>
                  <text x={labelPoint.x} y={labelPoint.y + 3} className="wheel-label" textAnchor="middle">{world.label}</text>
                  <text x={labelPoint.x} y={labelPoint.y + 15} textAnchor="middle">
                    <tspan className="wheel-value">{score}%</tspan>
                    {dir !== 'flat' && <tspan className={`wheel-trend wheel-trend-${dir}`}> {dir === 'up' ? '▲' : '▼'}</tspan>}
                  </text>
                </g>;
              })}
              <circle cx="160" cy="160" r="68" className="wheel-center" />
              <text x="160" y="142" className="wheel-center-title" textAnchor="middle">מדד חיים נוכחי</text>
              <text x="160" y="176" className="wheel-center-value" textAnchor="middle">{average}%</text>
              {average !== baselineAverage && (
                <text x="160" y="194" textAnchor="middle" className={`wheel-trend wheel-trend-${trend(average - baselineAverage)}`}>
                  {average > baselineAverage ? '▲' : '▼'} {Math.abs(average - baselineAverage)} מהיום
                </text>
              )}
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
    </section>
  );
}
