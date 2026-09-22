// ============================================================
// ממפה נתונים אמיתיים שכבר נמשכים מ-Financy (דרך הפונקציה hyper-handler,
// ר' LiveBankDashboard.jsx) לצורת הנתונים האחידה שרכיבי דשבורד "אשראי" צורכים
// (אותה צורה בדיוק כמו mockCreditData.js, כדי שרכיבי ה-UI לא ידעו את ההבדל).
// ============================================================

const PROVIDER_LABELS = {
  max: 'MAX',
  isracard: 'ישראכרט',
  cal: 'כאל',
  hapoalim: 'הפועלים',
  mizrahi: 'מזרחי',
  leumi: 'לאומי',
  discount: 'דיסקונט',
};

const CATEGORY_LABELS = {
  // כרטיס אשראי - MCC
  'FOOD_&_DRINKS': 'מזון ומסעדות',
  'RESTAURANT': 'מסעדות ובתי קפה',
  'SHOPPING': 'קניות',
  'GROCERIES': 'סופר/קניות',
  'CLOTHES_&_ACCESSORIES': 'ביגוד',
  'ELECTRONICS': 'אלקטרוניקה',
  'SHOPPING_OTHER': 'קניות שונות',
  'HEALTH_&_BEAUTY': 'בריאות ויופי',
  'BEAUTY': 'טיפוח ויופי',
  'TRANSPORTATION': 'תחבורה',
  'UTILITIES': 'חשבונות ותשתיות',
  'ENTERTAINMENT': 'בילויים ופנאי',
  'TRAVEL': 'נסיעות ותיירות',
  'EDUCATION': 'חינוך',
  'FINANCIAL': 'פיננסי',
  'INCOME': 'הכנסה',
  // חשבון בנק
  'SALARY': 'משכורת',
  'NATIONAL_INSURANCE': 'קצבאות ביטוח לאומי',
  'INSURANCE': 'ביטוח',
  'DEPOSIT': 'הפקדה',
  'CHQ_INCOME': 'שיק שהופקד',
  'TRANSFER': 'העברה',
  'BIT_PAYBOX': 'ביט/פייבוקס',
  'BANK_TRANSFER': 'העברה בנקאית',
  'INCOMES_EXPENSES': 'תנועה כללית בחשבון',
  'BUSINESS_EXPENSES': 'הוצאות עסקיות',
  'MORTGAGE': 'משכנתא',
  'CAR_&_FUEL': 'רכב ודלק',
  'FINANCE_OTHER': 'פיננסי אחר',
  'INSURANCE_&_FEES': 'ביטוח ועמלות',
  'LOAN': 'הלוואה',
  'GOVERNMENT_SERVICES': 'שירותי ממשלה',
  'FEES': 'עמלות',
  'FURNITURE_&_INTERIOR': 'ריהוט ועיצוב הבית',
  'COMMUNICATIONS': 'תקשורת',
  'RECENT_PENSION': 'פנסיה',
  'OTHER': 'שונות',
  'SPORTS_&_FITNESS': 'ספורט וכושר',
  'TRANSPORT_OTHER': 'תחבורה אחר',
};

// קטגוריות בנק שמייצגות תנועת כסף פנימית (למשל סילוק חיוב כרטיס אשראי מהעו"ש) -
// לא כוללים אותן בסכומי הכנסה/הוצאה כי הן היו כבר נספרות פעם אחת בעסקאות הכרטיס עצמן.
export const INTERNAL_SETTLEMENT_CATEGORIES = new Set(['CREDIT_CARD_CHECKING']);

const providerLabel = providerId => PROVIDER_LABELS[providerId] || (providerId || 'כרטיס');
// מנרמלת רווחים למקף תחתון לפני חיפוש - Financy לא עקבית (לפעמים "A_B", לפעמים "A B") בערכי הקטגוריה.
const normalizeCatKey = s => (s || '').trim().toUpperCase().replace(/\s+/g, '_');
export const categoryLabel = cat => {
  const sub = normalizeCatKey(cat?.sub), main = normalizeCatKey(cat?.main);
  return CATEGORY_LABELS[sub] || CATEGORY_LABELS[main] || cat?.sub || cat?.main || 'שונות';
};
export const isInternalSettlement = cat => INTERNAL_SETTLEMENT_CATEGORIES.has(normalizeCatKey(cat?.sub)) || INTERNAL_SETTLEMENT_CATEGORIES.has(normalizeCatKey(cat?.main));
const last4Of = accountNumber => (accountNumber || '').replace(/[^0-9]/g, '').slice(-4) || null;

// Financy מקננת סכומי כסף בצורה לא אחידה בין משאבים - לפעמים { amount: 5 }, לפעמים
// { amount: { amount: 5, currency } }. פירוק לכל העומק עד למספר פשוט.
export const unwrapAmount = v => {
  for (let i = 0; i < 3 && v && typeof v === 'object'; i++) v = v.amount;
  return Number(v ?? 0);
};
// כל איבר ב-balances[] נראה כמו { balanceType: 'closingBooked' | 'interimAvailable', balanceAmount, referenceDate }
// - מעדיפים 'closingBooked' (היתרה הסגורה/מסולקת), ונופלים לראשון אם אין.
export const accountBalance = a => {
  const balances = a.balances || [];
  const best = balances.find(b => b.balanceType === 'closingBooked') || balances[0];
  return unwrapAmount(best?.balanceAmount ?? a.balance ?? 0);
};
// יתרות LOAN/CARD הן חוב (לא מזומן בקופה) - צריכות להקטין שווי נקי, לא להגדיל אותו.
export const isLiability = a => a.accountType === 'LOAN' || a.accountType === 'CARD';

// כרטיסי אשראי אמיתיים בלבד (accountType === 'CARD') מתוך רשימת החשבונות שכבר נמשכת ב-LiveBankDashboard.
export function getRealCreditCards(accounts) {
  return (accounts || [])
    .filter(a => a.accountType === 'CARD')
    .map(a => ({
      id: a.id,
      name: providerLabel(a.providerId),
      nickname: a.accountName && a.accountName !== providerLabel(a.providerId) ? a.accountName : null,
      last4: last4Of(a.accountNumber),
      active: a.status === 'enabled',
    }));
}

// כל שורות העסקאות האמיתיות (מכל הכרטיסים, כל החודשים) בצורה האחידה.
// כל התאריכים והתשלומים כאן אמיתיים כפי ש-Financy מחזירה - אין צורך לחשב תשלומים בעצמנו,
// כי כל תשלום בפועל מגיע כשורה נפרדת עם ה-valueDate האמיתי שלו.
export function getRealCreditRows(transactions) {
  return (transactions || []).map(tx => {
    const monthlyAmount = Math.abs(tx.amount?.chargedAmount?.amount ?? 0);
    const totalAmount = Math.abs(tx.amount?.originalAmount?.amount ?? monthlyAmount);
    const inst = tx.installments;
    const isInstallment = !!tx.isCreditCardInstallment && !!inst;
    return {
      id: tx.id,
      cardId: tx.accountId,
      date: tx.date?.valueDate || tx.date?.bookingDate || tx.date?.transactionDate || '',
      merchant: tx.merchantName || tx.description?.description || 'עסקה',
      category: categoryLabel(tx.category),
      totalAmount,
      monthlyAmount,
      installmentsTotal: isInstallment ? inst.total : 1,
      installmentCurrent: isInstallment ? inst.number : 1,
      installmentsRemaining: isInstallment ? Math.max(inst.total - inst.number, 0) : 0,
      isInstallment,
      note: '',
    };
  });
}
