import React, { useMemo, useState, useEffect } from 'react';

// One uniform pastel color for every segment — score is conveyed by the number/trend, not by shade
const WHEEL_COLOR = '#C9D8C1';
const worlds = [
  { id: 'body', label: 'גוף', icon: '🧘', color: WHEEL_COLOR, prompt: 'מה הגוף שלך צריך כדי להרגיש חיוני יותר?' },
  { id: 'mind', label: 'תודעה', icon: '🧠', color: WHEEL_COLOR, prompt: 'איזו מחשבה תשרת את הגרסה החדשה שלך היום?' },
  { id: 'money', label: 'כסף', icon: '💰', color: WHEEL_COLOR, prompt: 'איזו פעולה קטנה תיצור יותר ביטחון כלכלי?' },
  { id: 'relations', label: 'מערכות יחסים', icon: '🤝', color: WHEEL_COLOR, prompt: 'למי נכון להעניק היום נוכחות אמיתית?' },
  { id: 'purpose', label: 'ייעוד', icon: '🧭', color: WHEEL_COLOR, prompt: 'איזו עשייה מקרבת אותך לעבודה המשמעותית שלך?' },
  { id: 'spirit', label: 'רוח', icon: '🕊', color: WHEEL_COLOR, prompt: 'מה יחזיר אותך היום למרכז שלך?' }
];

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const polar = (cx, cy, radius, angle) => {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
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
  const trend = delta => delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  useEffect(() => localStorage.setItem('insideout-life-scores', JSON.stringify(scores)), [scores]);

  return (
    <section className="life-os life-os-bare" aria-label="חדר הבקרה של החיים">
      <div className="life-os-row">
        <div className="life-os-greeting-top">
          <span>INSIDE OUT · LIFE OS</span>
          <h2>{greeting}, {userName}</h2>
          <p>היום הוא היום ה־<b>{journeyDay}</b> במסע שלך.</p>
        </div>
        <div className="life-wheel-standalone">
        <div className="life-wheel-wrap">
          <svg className="life-wheel life-wheel-enso" viewBox="0 0 320 320" role="img" aria-label="גלגל החיים בסגנון אנסו">
            <g className="enso-brush">
              <path className="enso-main-stroke" d="M264 220 C224 288 124 308 56 240 C-16 172 24 68 108 36" />
              <path className="enso-upper-stroke" d="M100 40 C172 8 252 40 284 108" />
              <path className="enso-dry-stroke enso-dry-one" d="M276 204 C228 272 136 288 72 232 C16 180 32 92 100 56 C172 20 244 52 272 116" />
              <path className="enso-dry-stroke enso-dry-two" d="M252 248 C188 304 84 280 40 204 C4 136 44 60 120 32 C184 8 248 40 288 88" />
              <path className="enso-dry-stroke enso-dry-three" d="M112 20 C176 0 244 24 292 80" />
              <path className="enso-bristle" d="M272 192 L300 164 M268 208 L304 188 M280 116 L300 140" />
            </g>
            <text x="160" y="150" className="wheel-center-title" textAnchor="middle">מדד חיים נוכחי</text>
            <text x="160" y="184" className="wheel-center-value" textAnchor="middle">{average}%</text>
            {worlds.map((world, index) => {
              const score = scores[world.id];
              const delta = score - Number(baseline[world.id] ?? score);
              const dir = trend(delta);
              const point = polar(160, 160, 136, index * 60);
              return <g key={world.id} role="button" tabIndex="0" aria-label={`${world.label} ${score}% ${dir === 'up' ? 'במגמת עלייה' : dir === 'down' ? 'במגמת ירידה' : 'יציב'}`} className={`enso-world${selectedWorld === world.id ? ' active' : ''}`} onClick={() => { setSelectedWorld(world.id); onOpenWorld?.(world.id); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { setSelectedWorld(world.id); onOpenWorld?.(world.id); } }}>
                <circle cx={point.x} cy={point.y} r="21" className="enso-world-dot" />
                <text x={point.x} y={point.y - 3} className="wheel-icon" textAnchor="middle">{world.icon}</text>
                <text x={point.x} y={point.y + 34} className="wheel-label" textAnchor="middle">{world.label}</text>
                <text x={point.x} y={point.y + 46} textAnchor="middle">
                  <tspan className="wheel-value">{score}%</tspan>
                  {dir !== 'flat' && <tspan className={`wheel-trend wheel-trend-${dir}`}> {dir === 'up' ? '▲' : '▼'}</tspan>}
                </text>
              </g>;
            })}
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
