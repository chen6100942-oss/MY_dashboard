import React, { useMemo } from 'react';
import FinancialGoals from './FinancialGoals.jsx';
import { fmtILS } from '../lib/mockCreditData.js';
import { monthTotals } from '../lib/realOverviewData.js';

const monthKeyNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

function monthsBetween(targetMonth, fromMonth) {
  if (!targetMonth) return null;
  const [ty, tm] = targetMonth.split('-').map(Number);
  const [fy, fm] = fromMonth.split('-').map(Number);
  if (!ty || !tm || !fy || !fm) return null;
  return (ty - fy) * 12 + (tm - fm);
}

// הערכת יכולת עמידה ביעד לפי התזרים החודשי האמיתי (הכנסות פחות הוצאות בפועל,
// לא מספרים ידניים) - הערכה כללית, לא ייעוץ מדויק (זה תפקיד "היועץ הפיננסי שלי").
function assessGoal(goal, netCashflow, currentMonth) {
  const remaining = Math.max(0, (Number(goal.target_amount) || 0) - (Number(goal.current_amount) || 0));
  if (remaining <= 0) return { verdict: '🎉 היעד כבר הושג', detail: '' };

  const monthsLeft = monthsBetween(goal.target_date, currentMonth);
  const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;

  if (netCashflow <= 0) {
    return {
      verdict: 'התזרים החודשי שלך כרגע שלילי או מאוזן',
      detail: 'קשה לעמוד ביעד בקצב הנוכחי בלי לצמצם הוצאות או להגדיל הכנסות — לא בגלל היעד עצמו, אלא בגלל מצב התזרים החודש הזה.',
    };
  }

  if (monthlyNeeded) {
    const ratio = monthlyNeeded / netCashflow;
    if (ratio <= 0.5) return { verdict: '✅ ריאלי מאוד', detail: `נדרש לחסוך כ-${fmtILS(monthlyNeeded)} לחודש מתוך תזרים פנוי של כ-${fmtILS(netCashflow)} — יש מרווח נוח.` };
    if (ratio <= 1) return { verdict: '🟡 ריאלי, אך הדוק', detail: `נדרש לחסוך כ-${fmtILS(monthlyNeeded)} לחודש — כמעט כל התזרים הפנוי הנוכחי (כ-${fmtILS(netCashflow)}). כדאי לוודא שההוצאות הקבועות לא יגדלו.` };
    const realisticMonths = Math.ceil(remaining / netCashflow);
    return {
      verdict: '🔴 לא ריאלי בקצב הנוכחי',
      detail: `נדרש כ-${fmtILS(monthlyNeeded)} לחודש כדי לעמוד בלוח הזמנים, אבל התזרים הפנוי הנוכחי הוא רק כ-${fmtILS(netCashflow)}. בקצב החיסכון האמיתי הנוכחי זה ייקח כ-${realisticMonths} חודשים במקום ${monthsLeft} — כדאי להאריך את הטווח, להגדיל חיסכון, או להקטין את סכום היעד.`,
    };
  }

  const monthsToGoal = Math.ceil(remaining / netCashflow);
  return {
    verdict: 'לא נקבע תאריך יעד',
    detail: `בקצב החיסכון הפנוי הנוכחי (כ-${fmtILS(netCashflow)} לחודש), היעד הזה ייקח כ-${monthsToGoal} חודשים.`,
  };
}

// "יעד פיננסי" בתוך חשבונות מחוברים: אותו רכיב יעדים בדיוק כמו בטאב הידני (אין קוד כפול),
// עם תוספת הערכת יכולת אמיתית מתחת לכל יעד - מבוססת על תזרים אמיתי מהחשבון, לא הזנה ידנית.
export default function RealGoalsDashboard({ goals, addGoal, updateGoal, commitGoal, removeGoal, transactions }) {
  const currentMonth = monthKeyNow();
  const { income, expense } = useMemo(() => monthTotals(transactions, currentMonth), [transactions, currentMonth]);
  const netCashflow = income - expense;

  return (
    <div className="space-y-4">
      <div className="card p-3 text-center text-xs text-slate-500 bg-violet-50 border border-violet-100">
        ההערכות למטה מבוססות על התזרים הפנוי האמיתי שלך החודש: <b className="text-violet-700">{fmtILS(netCashflow)}</b> (הכנסות פחות הוצאות בפועל, מ"תזרים חודשי")
      </div>

      <FinancialGoals goals={goals} currentMonth={currentMonth} onCreate={addGoal} onUpdate={updateGoal} onCommit={commitGoal} onDelete={removeGoal} />

      {goals.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-slate-700 text-sm">הערכת יכולת עמידה ביעדים</h4>
          {goals.map(goal => {
            const { verdict, detail } = assessGoal(goal, netCashflow, currentMonth);
            return (
              <div key={goal.id} className="card p-4 border-t-[3px] border-amber-200">
                <p className="text-sm font-bold text-slate-700">{goal.goal_name}: {verdict}</p>
                {detail && <p className="text-xs text-slate-500 mt-1">{detail}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
