import React, { useMemo, useState, useEffect } from 'react';

const worlds = [
  { id: 'body', label: 'גוף', icon: '🧘', prompt: 'מה הגוף שלך צריך כדי להרגיש חיוני יותר?' },
  { id: 'mind', label: 'תודעה', icon: '🧠', prompt: 'איזו מחשבה תשרת את הגרסה החדשה שלך היום?' },
  { id: 'money', label: 'כסף', icon: '💰', prompt: 'איזו פעולה קטנה תיצור יותר ביטחון כלכלי?' },
  { id: 'relations', label: 'מערכות יחסים', icon: '🤝', prompt: 'למי נכון להעניק היום נוכחות אמיתית?' },
  { id: 'purpose', label: 'ייעוד', icon: '🧭', prompt: 'איזו עשייה מקרבת אותך לעבודה המשמעותית שלך?' },
  { id: 'spirit', label: 'רוח', icon: '🕊', prompt: 'מה יחזיר אותך היום למרכז שלך?' }
];

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

export default function LifeOperatingSystem({ userName = 'חן', onOpenWorld }) {
  const [scores, setScores] = useState(() => read('insideout-life-scores', { body: 72, mind: 81, money: 58, relations: 76, purpose: 68, spirit: 84 }));
  const startDate = useMemo(() => {
    const saved = localStorage.getItem('insideout-journey-start');
    if (saved) return new Date(saved);
    const d = new Date(); d.setDate(d.getDate() - 183); localStorage.setItem('insideout-journey-start', d.toISOString()); return d;
  }, []);
  const journeyDay = Math.max(1, Math.floor((new Date() - startDate) / 86400000) + 1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  const average = Math.round(Object.values(scores).reduce((sum, score) => sum + Number(score || 0), 0) / worlds.length);

  // Snapshot taken once per day, so each metric can show whether it rose or fell since then
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
      <div className="life-os-greeting-top">
        <span>INSIDE OUT · LIFE OS</span>
        <h2>{greeting}, {userName}</h2>
        <p>היום הוא היום ה־<b>{journeyDay}</b> במסע שלך · מדד חיים נוכחי <b>{average}%</b></p>
      </div>
      <div className="life-metrics-grid">
        {worlds.map(world => {
          const score = scores[world.id];
          const delta = score - Number(baseline[world.id] ?? score);
          const dir = trend(delta);
          return (
            <div key={world.id} className="life-metric-card" onClick={() => onOpenWorld?.(world.id)}>
              <div className="life-metric-head">
                <span className="life-metric-icon">{world.icon}</span>
                <span className="life-metric-label">{world.label}</span>
              </div>
              <div className="life-metric-value">
                {score}%
                {dir !== 'flat' && <em className={`wheel-trend wheel-trend-${dir}`}>{dir === 'up' ? '▲' : '▼'}</em>}
              </div>
              <div className="life-metric-bar"><i style={{ width: `${score}%` }} /></div>
              <input
                type="range" min="0" max="100" value={score}
                onClick={event => event.stopPropagation()}
                onChange={event => setScores(current => ({ ...current, [world.id]: Number(event.target.value) }))}
                aria-label={world.label}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
