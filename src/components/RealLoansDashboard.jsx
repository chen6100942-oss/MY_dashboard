import React, { useMemo } from 'react';
import { fmtILS, fmtDateHe } from '../lib/mockCreditData.js';
import { getRealMortgages, getRealLoans } from '../lib/realLoansData.js';

function ProgressBar({ pct }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-600 w-9 text-left" dir="ltr">{pct}%</span>
    </div>
  );
}

// "הלוואות ומשכנתא" אמיתי: משכנתא ברובריקה נפרדת (מפוצלת למסלולים אמיתיים), והלוואות
// רגילות בטבלה נפרדת - שתיהן מ-Financy, בלי מסגרות אשראי/עו"ש (אלה לא הלוואות עם
// לוח סילוקין, הן כבר נספרות בהתחייבויות הכלליות בטאבים האחרים).
export default function RealLoansDashboard({ accounts }) {
  const mortgages = useMemo(() => getRealMortgages(accounts), [accounts]);
  const loans = useMemo(() => getRealLoans(accounts), [accounts]);

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-slate-700 text-sm">משכנתא</h4>
      {!mortgages.length && <div className="card p-6 text-center text-sm text-slate-400">לא נמצאה משכנתא מחוברת</div>}
      {mortgages.map(m => (
        <div key={m.id} className="card overflow-hidden border-t-[3px] border-violet-200">
          <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: '#8b5cf6' }}>
            <span className="text-white font-bold text-sm">{m.name}</span>
            <span className="text-white font-bold text-sm">{fmtILS(m.totalRemaining)} <span className="font-normal text-violet-100 text-xs">מתוך {fmtILS(m.totalOriginal)}</span></span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3.5 bg-slate-50 border-b border-slate-100">
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
              <div className="text-sm font-extrabold text-slate-800">{fmtILS(m.totalOriginal)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">סכום מקורי</div>
            </div>
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
              <div className="text-sm font-extrabold text-rose-500">{fmtILS(m.totalRemaining)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">יתרה לסילוק</div>
            </div>
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
              <div className="text-sm font-extrabold text-slate-800" dir="ltr">{fmtDateHe(m.startDate)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">תאריך התחלה</div>
            </div>
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-100">
              <div className="text-sm font-extrabold text-slate-800" dir="ltr">{fmtDateHe(m.endDate)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">צפי סיום</div>
            </div>
          </div>
          <div className="px-4 py-2 bg-white">
            <ProgressBar pct={m.paidPct} />
          </div>
          <div className="grid grid-cols-[1fr_100px_100px_1fr_90px] gap-2 px-4 py-2 bg-slate-100 text-[11px] font-bold text-slate-500">
            <span>מסלול</span><span>סכום מקורי</span><span>יתרה</span><span>ריבית</span><span>סיום מסלול</span>
          </div>
          <div className="divide-y divide-slate-100">
            {m.tracks.map(t => (
              <div key={t.id} className="grid grid-cols-[1fr_100px_100px_1fr_90px] gap-2 items-center px-4 py-2 text-sm">
                <span className="text-slate-700">{t.name}</span>
                <span dir="ltr">{fmtILS(t.original)}</span>
                <span className="font-bold text-rose-500" dir="ltr">{fmtILS(t.remaining)}</span>
                <span className="text-xs text-slate-500">{t.interest}</span>
                <span className="text-xs text-slate-500" dir="ltr">{fmtDateHe(t.endDate)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <h4 className="font-bold text-slate-700 text-sm pt-2">הלוואות</h4>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_120px_100px_110px_100px] gap-2 px-4 py-2 bg-slate-100 text-[11px] font-bold text-slate-500">
          <span>שם ההלוואה</span><span>סכום מקורי</span><span>יתרה</span><span>% שולם</span><span>תשלום חודשי</span><span>תשלום הבא</span><span>צפי סיום</span>
        </div>
        <div className="divide-y divide-slate-100">
          {loans.map(l => (
            <div key={l.id} className="grid grid-cols-[1fr_100px_100px_120px_100px_110px_100px] gap-2 items-center px-4 py-2.5 text-sm">
              <span className="text-slate-700">{l.name}</span>
              <span dir="ltr">{fmtILS(l.original)}</span>
              <span className="font-bold text-rose-500" dir="ltr">{fmtILS(l.remaining)}</span>
              <ProgressBar pct={l.paidPct} />
              <span dir="ltr">{l.monthlyPayment ? fmtILS(l.monthlyPayment) : '—'}</span>
              <span className="text-xs text-slate-500" dir="ltr">{fmtDateHe(l.nextPaymentDate)}</span>
              <span className="text-xs text-slate-500" dir="ltr">{fmtDateHe(l.endDate)}</span>
            </div>
          ))}
          {!loans.length && <div className="px-4 py-8 text-center text-sm text-slate-400">לא נמצאו הלוואות מחוברות</div>}
        </div>
      </div>
    </div>
  );
}
