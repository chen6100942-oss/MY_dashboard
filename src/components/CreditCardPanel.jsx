import React, { useMemo } from 'react';
import CreditTransactionTable from './CreditTransactionTable.jsx';
import { fmtILS, fmtDateHe } from '../lib/mockCreditData.js';

// כרטיסייה עצמאית לכרטיס אשראי אחד: כותרת + סיכום חודשי + טבלת עסקאות.
// רכיב generic - לא תלוי בשם כרטיס ספציפי, כדי שלא יהיה קוד משוכפל לכל כרטיס.
// card: { id, name, nickname, last4, active } - אותה צורה לכרטיס אמיתי (Financy) או כרטיס mock.
export default function CreditCardPanel({ card, monthKey, rows, nextMonthRows, onToggleActive }) {
  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.monthlyAmount, 0);
    const newCount = rows.filter(r => r.installmentCurrent === 1).length;
    const carriedTotal = rows.filter(r => r.isInstallment && r.installmentCurrent > 1).reduce((s, r) => s + r.monthlyAmount, 0);
    const futureTotal = nextMonthRows.reduce((s, r) => s + r.monthlyAmount, 0);
    const topRow = rows.length ? rows.reduce((a, b) => (b.monthlyAmount > a.monthlyAmount ? b : a)) : null;
    // תאריך חיוב קרוב - להמחשה בלבד (יום קבוע), עד שיהיה חיבור אמיתי שיודע את יום החיוב האמיתי של הכרטיס
    const [y, m] = monthKey.split('-').map(Number);
    const nextDate = new Date(y, m, 10); // ה-10 בחודש הבא
    const nextChargeDateLabel = `${String(nextDate.getDate()).padStart(2, '0')}.${String(nextDate.getMonth() + 1).padStart(2, '0')}.${nextDate.getFullYear()}`;
    return { total, newCount, carriedTotal, futureTotal, txCount: rows.length, topRow, nextChargeDateLabel };
  }, [rows, nextMonthRows, monthKey]);

  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-700 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-sm">{card.name}</span>
          {card.last4 && <span className="text-slate-300 text-xs" dir="ltr">•••• {card.last4}</span>}
          {card.nickname && <span className="text-slate-400 text-xs">({card.nickname})</span>}
          <span
            onClick={onToggleActive}
            title={onToggleActive ? 'לחצי כדי לשנות סטטוס' : undefined}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${onToggleActive ? 'cursor-pointer' : ''} ${card.active ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-400 text-white hover:bg-slate-500'}`}
          >
            {card.active ? '🟢 פעיל' : '⚪ לא בשימוש'}
          </span>
        </div>
        <span className="text-white font-bold">{fmtILS(stats.total)}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3.5 bg-slate-50 border-b border-slate-100">
        <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
          <div className="text-sm font-extrabold text-slate-800">{fmtILS(stats.total)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">סך הוצאות החודש</div>
        </div>
        <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
          <div className="text-sm font-extrabold text-violet-600">{fmtILS(stats.futureTotal)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">חיוב קרוב · {stats.nextChargeDateLabel}</div>
        </div>
        <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
          <div className="text-sm font-extrabold text-slate-800">{stats.txCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">עסקאות החודש</div>
        </div>
        <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
          <div className="text-sm font-extrabold text-rose-500 truncate" dir="ltr">{stats.topRow ? fmtILS(stats.topRow.monthlyAmount) : '—'}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{stats.topRow ? `הכי גבוהה · ${stats.topRow.merchant}` : 'אין עסקאות'}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 text-[11px] text-slate-500 bg-white border-b border-slate-100">
        <span>עסקאות חדשות החודש: <b className="text-slate-700">{stats.newCount}</b></span>
        <span>תשלומים מעסקאות קודמות: <b className="text-slate-700">{fmtILS(stats.carriedTotal)}</b></span>
      </div>

      {rows.length > 0 ? (
        <CreditTransactionTable rows={rows} monthKey={monthKey} />
      ) : (
        <p className="px-4 py-8 text-center text-sm text-slate-400">אין עסקאות בכרטיס הזה בחודש הנבחר</p>
      )}
    </div>
  );
}
