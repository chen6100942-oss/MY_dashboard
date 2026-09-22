// ============================================================
// תזרים חודשי אמיתי: הכנסות והוצאות **מהחשבון בלבד** (type === 'BANK') -
// לא כולל עסקאות כרטיס אשראי בכלל (אלה נמצאות בטאב "אשראי" הנפרד).
// תשלום לכרטיס האשראי מהעו"ש (CREDIT_CARD_CHECKING) כן נכלל כאן כהוצאת בנק
// אמיתית - זה שונה מ"סקירה" שם הוצאנו אותו כדי לא לספור אותו פעמיים לצד
// עסקאות הכרטיס עצמן.
// ============================================================
import { unwrapAmount, categoryLabel } from './realCreditData.js';

const dateOf = tx => tx.date?.valueDate || tx.date?.bookingDate || tx.date?.transactionDate || '';
const chargedOf = tx => unwrapAmount(tx.amount?.chargedAmount ?? tx.amount?.originalAmount ?? 0);
const labelOf = tx => tx.description?.description || tx.merchantName || tx.details || 'תנועה';

// הערה חשובה: t.type על עסקת כרטיס הוא תמיד המחרוזת המדויקת 'CARD', אבל על עסקת בנק
// זה סוג החשבון הספציפי כפי ש-Financy מחזירה (למשל 'CHECKING'), לא המילה 'BANK' -
// לכן "לא כרטיס" הוא הבדיקה הנכונה ל"דרך החשבון", לא channel השוואה ל-'BANK'.
function bankRowsForMonth(transactions, month, sign) {
  return (transactions || [])
    .filter(t => t.type !== 'CARD' && dateOf(t).slice(0, 7) === month && (sign > 0 ? chargedOf(t) > 0 : chargedOf(t) < 0))
    .map(t => ({ id: t.id, date: dateOf(t), category: categoryLabel(t.category), label: labelOf(t), amount: Math.abs(chargedOf(t)) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getBankIncomeRows = (transactions, month) => bankRowsForMonth(transactions, month, 1);
export const getBankExpenseRows = (transactions, month) => bankRowsForMonth(transactions, month, -1);
