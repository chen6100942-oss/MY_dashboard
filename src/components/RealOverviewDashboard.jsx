import React, { useMemo, useState } from 'react';
import { TrendChart } from './FinanceTracker.jsx';
import CategoryDonut from './CategoryDonut.jsx';
import { fmtILS } from '../lib/mockCreditData.js';
import { monthTotals, realAssetsTotal, realLiabilitiesTotal, trailing12MonthsTrend, categoryBreakdownFor, realDataCoverage, monthLabelHe, shiftMonthHe } from '../lib/realOverviewData.js';

const monthKeyNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

// "סקירה" אמיתית בתוך חשבונות מחוברים - אותו מבנה בדיוק כמו "סקירה כללית" הידנית
// (מעקב פיננסי), אבל כל מספר כאן מחושב מ-accounts/transactions אמיתיים מ-Financy.
// שווי נקי/סה"כ נכסים הם יתרות "עכשיו" (Financy לא נותן היסטוריית יתרות לפי חודש) -
// הכנסות/הוצאות/מגמה כן ממוקדות לחודש הנבחר, כי אלה תנועות עם תאריך אמיתי.
export default function RealOverviewDashboard({ accounts, transactions }) {
  const [month, setMonth] = useState(monthKeyNow);

  const assetsTotal = useMemo(() => realAssetsTotal(accounts), [accounts]);
  const liabilitiesTotal = useMemo(() => realLiabilitiesTotal(accounts), [accounts]);
  const netWorth = assetsTotal - liabilitiesTotal;

  const { income, expense } = useMemo(() => monthTotals(transactions, month), [transactions, month]);
  const netCashflow = income - expense;

  const trendData = useMemo(() => trailing12MonthsTrend(transactions, month), [transactions, month]);
  const categoryBreakdown = useMemo(() => categoryBreakdownFor(transactions, month), [transactions, month]);
  const coverage = useMemo(() => realDataCoverage(transactions), [transactions]);

  const kpis = [
    { label: 'סה"כ הכנסות', value: income, cls: 'text-emerald-600' },
    { label: 'סה"כ הוצאות (הכל)', value: expense, cls: 'text-rose-600' },
    { label: 'סה"כ נכסים', value: assetsTotal, cls: 'text-violet-600' },
    { label: 'תזרים נותר לחודש', value: netCashflow, cls: netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600' },
    { label: 'שווי נקי', value: netWorth, cls: netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-3 flex items-center justify-between">
        <button onClick={() => setMonth(m => shiftMonthHe(m, -1))} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg font-semibold text-xs text-violet-700 transition-all">→ חודש קודם</button>
        <h4 className="text-sm font-bold text-slate-700">{monthLabelHe(month)}</h4>
        <button onClick={() => setMonth(m => shiftMonthHe(m, 1))} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg font-semibold text-xs text-violet-700 transition-all">חודש הבא ←</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="card p-4 text-center">
            <div className={`text-xl font-extrabold ${k.cls}`}>{fmtILS(k.value)}</div>
            <div className="text-xs text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {coverage && (coverage.to < month || coverage.from > shiftMonthHe(month, -11)) && (
        <div className="card p-3 text-center text-xs text-amber-700 bg-amber-50 border border-amber-200">
          שימי לב: הנתונים האמיתיים שנמשכו כרגע מ-Financy מכסים את הטווח {monthLabelHe(coverage.from)} עד {monthLabelHe(coverage.to)} בלבד — חודשים מחוץ לטווח הזה יוצגו כ-0, לא בהכרח כי לא הייתה בהם פעילות.
        </div>
      )}

      <TrendChart data={trendData} onMonthClick={setMonth} />
      <CategoryDonut data={categoryBreakdown} month={monthLabelHe(month)} title="הוצאות לפי תחום" />
    </div>
  );
}
