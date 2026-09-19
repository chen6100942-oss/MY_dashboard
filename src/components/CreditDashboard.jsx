import React, { useMemo, useState } from 'react';
import CreditCardPanel from './CreditCardPanel.jsx';
import { getMockCreditCards, getCreditRowsForMonth, fmtILS } from '../lib/mockCreditData.js';
import { getRealCreditCards, getRealCreditRows } from '../lib/realCreditData.js';
import { effectiveActive, setCardActiveOverride } from '../lib/cardStatusOverrides.js';

const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const monthLabel = key => { const [y, m] = key.split('-').map(Number); return `${HE_MONTHS[m - 1]} ${y}`; };
const shiftMonth = (key, delta) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + delta, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const monthKeyNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const QUICK_MONTHS = ['2026-08', '2026-09'];

// אזור "אשראי" בתוך חשבונות מחוברים: סיכום כללי + כרטיסייה נפרדת לכל כרטיס אשראי.
// אם יש כרטיסי אשראי אמיתיים מחוברים ב-Financy (accounts מגיע מ-LiveBankDashboard) - נשתמש
// בעסקאות האמיתיות (src/lib/realCreditData.js). אחרת, נופלים חזרה לנתוני הדגמה
// (src/lib/mockCreditData.js) כדי שהמסך תמיד יראה איך זה עובד, גם בלי חיבור.
export default function CreditDashboard({ accounts, transactions }) {
  const [month, setMonth] = useState(monthKeyNow);
  const [overrideTick, setOverrideTick] = useState(0);

  const realCards = useMemo(() => getRealCreditCards(accounts), [accounts]);
  const useReal = realCards.length > 0;

  const allRows = useMemo(() => {
    if (useReal) return getRealCreditRows(transactions);
    return null; // mock נבנה per-month בנפרד, ר' למטה
  }, [useReal, transactions]);

  const cards = useMemo(() => {
    const base = useReal ? realCards : getMockCreditCards();
    return base.map(c => ({ ...c, active: useReal ? effectiveActive(c) : c.active }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useReal, realCards, overrideTick]);

  const toggleCardActive = card => {
    setCardActiveOverride(card.last4, !card.active);
    setOverrideTick(t => t + 1);
  };

  const rows = useMemo(() => {
    if (useReal) return allRows.filter(r => r.date.slice(0, 7) === month);
    return getCreditRowsForMonth(month);
  }, [useReal, allRows, month]);

  const nextMonthRows = useMemo(() => {
    const nextMonth = shiftMonth(month, 1);
    if (useReal) return allRows.filter(r => r.date.slice(0, 7) === nextMonth);
    return getCreditRowsForMonth(nextMonth);
  }, [useReal, allRows, month]);

  const rowsByCard = id => rows.filter(r => (useReal ? r.cardId === id : r.card === id));
  const nextRowsByCard = id => nextMonthRows.filter(r => (useReal ? r.cardId === id : r.card === id));

  const overall = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.monthlyAmount, 0);
    const byCard = cards.map(c => ({ name: c.name + (c.last4 ? ` ${c.last4}` : ''), total: rowsByCard(c.id).reduce((s, r) => s + r.monthlyAmount, 0) }));
    const futureTotal = nextMonthRows.reduce((s, r) => s + r.monthlyAmount, 0);
    const remainingLiability = rows.filter(r => r.isInstallment).reduce((s, r) => s + r.installmentsRemaining * r.monthlyAmount, 0);
    return { total, byCard, txCount: rows.length, futureTotal, remainingLiability };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, nextMonthRows, cards]);

  return (
    <div className="space-y-4">
      {!useReal && (
        <div className="card p-3 text-center text-xs text-amber-700 bg-amber-50 border border-amber-200">
          לא נמצאו כרטיסי אשראי מחוברים דרך Financy כרגע — מוצגים נתוני דוגמה בלבד.
        </div>
      )}

      <div className="card p-3 flex items-center justify-between flex-wrap gap-2">
        <button onClick={() => setMonth(m => shiftMonth(m, -1))} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg font-semibold text-xs text-violet-700 transition-all">→ חודש קודם</button>
        <div className="flex items-center gap-2">
          {QUICK_MONTHS.map(mk => (
            <button key={mk} onClick={() => setMonth(mk)} className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${month === mk ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {monthLabel(mk)}
            </button>
          ))}
          <h4 className="text-sm font-bold text-slate-700 px-2">{monthLabel(month)}</h4>
        </div>
        <button onClick={() => setMonth(m => shiftMonth(m, 1))} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg font-semibold text-xs text-violet-700 transition-all">חודש הבא ←</button>
      </div>

      <div className="card p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
        <p className="text-xs font-bold text-slate-400 uppercase mb-3">סיכום כל כרטיסי האשראי · {monthLabel(month)}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-violet-100">
            <div className="text-xl font-extrabold text-rose-600">{fmtILS(overall.total)}</div>
            <div className="text-[11px] text-slate-400 mt-1">סה"כ חיובי אשראי</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-violet-100">
            <div className="text-xl font-extrabold text-slate-800">{overall.txCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">סה"כ עסקאות</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-violet-100">
            <div className="text-xl font-extrabold text-violet-600">{fmtILS(overall.futureTotal)}</div>
            <div className="text-[11px] text-slate-400 mt-1">חיובים עתידיים (חודש הבא)</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-violet-100">
            <div className="text-xl font-extrabold text-amber-600">{fmtILS(overall.remainingLiability)}</div>
            <div className="text-[11px] text-slate-400 mt-1">התחייבות שנותרה מתשלומים</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-violet-100 text-xs text-slate-600">
          {overall.byCard.map(c => (
            <span key={c.name}>{c.name}: <b className="text-slate-800">{fmtILS(c.total)}</b></span>
          ))}
        </div>
      </div>

      {cards
        // כרטיס לא בשימוש בלי אף עסקה בחודש הנבחר לא מוצג בכלל - וברגע שהתשלום האחרון שלו
        // עובר, החודש שאחריו הוא ריק ונעלם אוטומטית מהתצוגה (אין צורך בלוגיקת "חודש חסד" נפרדת).
        .filter(card => card.active || rowsByCard(card.id).length > 0)
        .map(card => (
          <CreditCardPanel
            key={card.id}
            card={card}
            monthKey={month}
            rows={rowsByCard(card.id)}
            nextMonthRows={nextRowsByCard(card.id)}
            onToggleActive={useReal ? () => toggleCardActive(card) : undefined}
          />
        ))}
    </div>
  );
}
