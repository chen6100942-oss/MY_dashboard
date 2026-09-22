import React, { useMemo, useState } from 'react';
import RealCashflowTable from './RealCashflowTable.jsx';
import { getBankIncomeRows, getBankExpenseRows } from '../lib/realCashflowData.js';
import { monthLabelHe, shiftMonthHe } from '../lib/realOverviewData.js';

const monthKeyNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

// "תזרים חודשי" אמיתי בתוך חשבונות מחוברים: הכנסות והוצאות מהחשבון (עו"ש) בלבד -
// לא כולל עסקאות כרטיס אשראי (הן בטאב "אשראי" הנפרד). כל שורה היא תנועה אמיתית
// בתאריך אמיתי, לא סיכום קטגוריה.
export default function RealCashflowDashboard({ transactions }) {
  const [month, setMonth] = useState(monthKeyNow);
  const income = useMemo(() => getBankIncomeRows(transactions, month), [transactions, month]);
  const expenses = useMemo(() => getBankExpenseRows(transactions, month), [transactions, month]);

  return (
    <div className="space-y-4">
      <div className="card p-3 flex items-center justify-between">
        <button onClick={() => setMonth(m => shiftMonthHe(m, -1))} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg font-semibold text-xs text-violet-700 transition-all">→ חודש קודם</button>
        <h4 className="text-sm font-bold text-slate-700">{monthLabelHe(month)}</h4>
        <button onClick={() => setMonth(m => shiftMonthHe(m, 1))} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg font-semibold text-xs text-violet-700 transition-all">חודש הבא ←</button>
      </div>

      <p className="text-xs text-slate-400 text-center">מציג רק תנועות שעברו דרך חשבון הבנק (עו"ש) — לא כולל עסקאות כרטיס אשראי, שנמצאות בטאב "אשראי".</p>

      <div className="grid md:grid-cols-2 gap-4">
        <RealCashflowTable title="הכנסות" color="border-emerald-200" headHex="#10b981" bg="bg-emerald-50" rows={income} />
        <RealCashflowTable title="הוצאות מהחשבון" color="border-rose-200" headHex="#f43f5e" bg="bg-rose-50" rows={expenses} />
      </div>
    </div>
  );
}
