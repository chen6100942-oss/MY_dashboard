import React from 'react';
import { fmtILS } from '../lib/mockCreditData.js';

const PALETTE = ['#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7', '#84cc16', '#64748b'];

// עיגול פילוח הוצאות לפי קטגוריה, באחוזים - reusable, לא תלוי במקור הנתונים (mock/אמיתי).
// data: [{ category, value, pct }], כבר ממוינת מהגדול לקטן.
export default function CategoryDonut({ data, month, title }) {
  const R = 95, C = 2 * Math.PI * R;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  return (
    <div className="card p-5">
      <h4 className="font-bold text-slate-700 text-sm mb-3">{title || 'הוצאות לפי תחום'}{month ? ` (${month})` : ''}</h4>
      {!data.length ? (
        <p className="text-sm text-slate-400 text-center py-6">אין עדיין נתוני הוצאות לתקופה הזו</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-8">
          <svg viewBox="0 0 240 240" className="shrink-0" style={{ width: 260, height: 260 }}>
            <g transform="rotate(-90 120 120)">
              {data.map((d, i) => {
                const dash = (d.pct / 100) * C;
                const circle = (
                  <circle
                    key={d.category}
                    cx="120" cy="120" r={R} fill="none"
                    stroke={PALETTE[i % PALETTE.length]} strokeWidth="30"
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += dash;
                return circle;
              })}
            </g>
            <text x="120" y="114" textAnchor="middle" fontSize="22" fontWeight="800" fill="#334155">{fmtILS(total)}</text>
            <text x="120" y="136" textAnchor="middle" fontSize="11" fill="#94a3b8">סה"כ הוצאות</text>
          </svg>
          <div className="flex-1 min-w-[220px] space-y-1.5">
            {data.map((d, i) => (
              <div key={d.category} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                <span className="text-slate-600 flex-1 truncate">{d.category}</span>
                <span className="font-bold text-slate-800">{d.pct}%</span>
                <span className="text-xs text-slate-400 w-16 text-left" dir="ltr">{fmtILS(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
