// ============================================================
// חישובי "סקירה כללית" אמיתית: KPI-ים, מגמה חודשית ופילוח קטגוריות,
// מבוססים על transactions/accounts אמיתיים שכבר נמשכים מ-Financy
// (ר' LiveBankDashboard.jsx). אין כאן שום נתון מומצא - רק חישוב על מה שקיים.
// ============================================================
import { unwrapAmount, accountBalance, isLiability, categoryLabel, isInternalSettlement } from './realCreditData.js';

const monthOf = tx => {
  const d = tx.date?.valueDate || tx.date?.bookingDate || tx.date?.transactionDate;
  return typeof d === 'string' && d.length >= 7 ? d.slice(0, 7) : '';
};
const chargedOf = tx => unwrapAmount(tx.amount?.chargedAmount ?? tx.amount?.originalAmount ?? 0);
// מסננת תנועות בנק שהן בעצם סילוק חיוב כרטיס אשראי מהעו"ש - כבר נספרו כהוצאה
// בעסקאות הכרטיס עצמן, וספירה נוספת שלהן הייתה מכפילה את ההוצאה.
const relevantTx = list => (list || []).filter(t => !isInternalSettlement(t.category));

const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
export const monthLabelHe = key => { const [y, m] = key.split('-').map(Number); return `${HE_MONTHS[m - 1]} ${y}`; };
export const shiftMonthHe = (key, delta) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + delta, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

// הכנסה = תנועה חיובית (כסף שנכנס), הוצאה = תנועה שלילית - נכון גם לחשבון בנק וגם לכרטיס.
export function monthTotals(transactions, month) {
  const monthTx = relevantTx(transactions).filter(t => monthOf(t) === month);
  const income = monthTx.filter(t => chargedOf(t) > 0).reduce((s, t) => s + chargedOf(t), 0);
  const expense = monthTx.filter(t => chargedOf(t) < 0).reduce((s, t) => s + Math.abs(chargedOf(t)), 0);
  return { income, expense };
}

// נכסים אמיתיים (לא חוב) שכבר מגיעים מ-Financy - עו"ש, תיק ניירות ערך וכו'.
export function realAssetsTotal(accounts) {
  return (accounts || []).filter(a => !isLiability(a)).reduce((s, a) => s + accountBalance(a), 0);
}
// חובות/אשראי/הלוואות אמיתיים.
export function realLiabilitiesTotal(accounts) {
  return (accounts || []).filter(a => isLiability(a)).reduce((s, a) => s + accountBalance(a), 0);
}

// מגמה של 12 החודשים האחרונים (כולל החודש הנוכחי) - נתונים אמיתיים בלבד, אין הטיה קדימה
// כמו בטבלה הידנית, כי אין לנו עסקאות עתידיות אמיתיות.
export function trailing12MonthsTrend(transactions, currentMonth) {
  const months = [];
  for (let i = 11; i >= 0; i--) months.push(shiftMonthHe(currentMonth, -i));
  return months.map(m => ({ month: m, ...monthTotals(transactions, m) }));
}

// פילוח הוצאות לפי קטגוריה לחודש נתון.
export function categoryBreakdownFor(transactions, month) {
  const monthTx = relevantTx(transactions).filter(t => monthOf(t) === month && chargedOf(t) < 0);
  const map = {};
  monthTx.forEach(t => { const cat = categoryLabel(t.category); map[cat] = (map[cat] || 0) + Math.abs(chargedOf(t)); });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .map(([category, value]) => ({ category, value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
}

// טווח התאריכים שבאמת קיים בנתונים שנמשכו - כדי להציג בשקיפות אם חסר טווח (Financy
// מגביל כמות עסקאות שהיא מחזירה בכל קריאה, ולא תמיד זה מגיע עד היום).
export function realDataCoverage(transactions) {
  const dates = (transactions || []).map(monthOf).filter(Boolean).sort();
  if (!dates.length) return null;
  return { from: dates[0], to: dates[dates.length - 1] };
}
