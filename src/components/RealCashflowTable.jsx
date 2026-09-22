import React from 'react';
import { fmtILS, fmtDateHe } from '../lib/mockCreditData.js';

// טבלת תנועות אחת (הכנסות או הוצאות) - reusable, לא תלויה בכיוון הכסף.
// rows: [{ id, date, category, label, amount }]
export default function RealCashflowTable({ title, color, rows, headHex, bg }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className={`card overflow-hidden border-t-[3px] ${color}`}>
      <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: headHex }}>
        <span className="text-white font-bold text-sm">{title}</span>
        <span className="text-white font-bold text-sm">{fmtILS(total)}</span>
      </div>
      <div className="grid grid-cols-[85px_1fr_90px] gap-2 px-4 py-2 bg-slate-100 text-[11px] font-bold text-slate-500">
        <span>תאריך</span><span>סוג / תיאור</span><span>סכום</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {rows.map(r => (
          <div key={r.id} className={`grid grid-cols-[85px_1fr_90px] gap-2 items-center px-4 py-2 ${bg}`}>
            <span className="text-xs text-slate-500" dir="ltr">{fmtDateHe(r.date)}</span>
            <span className="text-sm text-slate-700 truncate">
              <b className="text-slate-800">{r.category}</b>
              {r.label && r.label !== r.category && <span className="text-slate-400"> · {r.label}</span>}
            </span>
            <span className="font-bold text-sm" dir="ltr">{fmtILS(r.amount)}</span>
          </div>
        ))}
        {!rows.length && <p className="px-4 py-8 text-center text-sm text-slate-400">אין תנועות בחודש הזה</p>}
      </div>
    </div>
  );
}
