import React, { useMemo, useState, useEffect } from 'react';

const worlds = [
  { id: 'body', label: 'גוף', icon: '🧘', color: '#D9C2A6', prompt: 'מה הגוף שלך צריך כדי להרגיש חיוני יותר?' },
  { id: 'mind', label: 'תודעה', icon: '🧠', color: '#C9AD8B', prompt: 'איזו מחשבה תשרת את הגרסה החדשה שלך היום?' },
  { id: 'money', label: 'כסף', icon: '💰', color: '#BFA07A', prompt: 'איזו פעולה קטנה תיצור יותר ביטחון כלכלי?' },
  { id: 'relations', label: 'מערכות יחסים', icon: '🤝', color: '#D8B9A0', prompt: 'למי נכון להעניק היום נוכחות אמיתית?' },
  { id: 'purpose', label: 'ייעוד', icon: '🧭', color: '#B79878', prompt: 'איזו עשייה מקרבת אותך לעבודה המשמעותית שלך?' },
  { id: 'spirit', label: 'רוח', icon: '🕊', color: '#E0CBAE', prompt: 'מה יחזיר אותך היום למרכז שלך?' }
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
    <section className="life-os" aria-label="חדר הבקרה של החיים">
      <div className="life-os-columns">
        <div className="life-wheel-side">
          <span className="life-wheel-side-label">גלגל החיים</span>
          <div className="life-wheel-wrap">
            <svg className="life-wheel" viewBox="0 0 320 320" role="img" aria-label="גלגל החיים">
              <defs>
                {worlds.map(world => (
                  <radialGradient key={world.id} id={`wheel-gloss-${world.id}`} cx="35%" cy="28%" r="80%">
                    <stop offset="0%" stopColor="#fff" stopOpacity=".85" />
                    <stop offset="28%" stopColor={world.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={world.color} stopOpacity="1" />
                  </radialGradient>
                ))}
                <radialGradient id="wheel-center-gloss" cx="38%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#fffdf9" />
                  <stop offset="60%" stopColor="#f3e9db" />
                  <stop offset="100%" stopColor="#e6d7c3" />
                </radialGradient>
                <filter id="wheel-depth" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#5a4433" floodOpacity=".28" />
                </filter>
              </defs>
              <ellipse cx="160" cy="222" rx="118" ry="16" fill="#5a4433" opacity=".1" />
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
                    <path className="wheel-segment-value" d={ringSlice(start, end, 73, scoreRadius)} fill={`url(#wheel-gloss-${world.id})`} />
                    <path className="wheel-segment-rim" d={ringSlice(start, end, scoreRadius - 2.5, scoreRadius)} />
                    <text x={labelPoint.x} y={labelPoint.y - 12} className="wheel-icon" textAnchor="middle">{world.icon}</text>
                    <text x={labelPoint.x} y={labelPoint.y + 3} className="wheel-label" textAnchor="middle">{world.label}</text>
                    <text x={labelPoint.x} y={labelPoint.y + 15} textAnchor="middle">
                      <tspan className="wheel-value">{score}%</tspan>
                      {dir !== 'flat' && <tspan className={`wheel-trend wheel-trend-${dir}`}> {dir === 'up' ? '▲' : '▼'}</tspan>}
                    </text>
                  </g>;
                })}
                <circle cx="160" cy="160" r="68" className="wheel-center" fill="url(#wheel-center-gloss)" />
                <circle cx="160" cy="160" r="68" className="wheel-center-ring" />
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

        <div className="life-os-intro">
          <div className="life-os-greeting">
            <span>INSIDE OUT · LIFE OS</span>
            <h2>{greeting}, {userName}</h2>
            <p>היום הוא היום ה־<b>{journeyDay}</b> במסע שלך.</p>
          </div>
        </div>
      </div>

    </section>
  );
}
