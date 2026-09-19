// ============================================================
// נתוני דוגמה (mock) לדשבורד "אשראי" בתוך "חשבונות מחוברים".
// ------------------------------------------------------------
// זו נקודת החיבור העתידית ל-API אמיתי של בנקים/חברות אשראי:
// getCreditRowsForMonth(monthKey) היא הפונקציה היחידה שרכיבי ה-UI קוראים לה.
// כשיהיה חיבור אמיתי (למשל דרך Financy, כמו ב-LiveBankDashboard.jsx),
// אפשר להחליף את הגוף של הפונקציה הזו כדי שתחזיר נתונים אמיתיים באותה
// צורת נתונים בדיוק (card, date, merchant, category, monthlyAmount וכו'),
// בלי לגעת ברכיבי ה-UI בכלל.
// ============================================================

const monthIndex = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  return y * 12 + (m - 1);
};

// כל "זרע" מייצג עסקה אחת (חד-פעמית או בתשלומים) שהחלה בחודש/יום נתון.
// installments: כמה תשלומים סה"כ (1 = עסקה רגילה, לא בתשלומים).
const SEEDS = [
  // ── כאל ──
  { card: 'כאל', merchant: 'רמי לוי', category: 'סופר/קניות', totalAmount: 900, installments: 3, startMonth: '2026-08', day: 2 },
  { card: 'כאל', merchant: 'פז', category: 'דלק', totalAmount: 280, installments: 1, startMonth: '2026-08', day: 10 },
  { card: 'כאל', merchant: 'פז', category: 'דלק', totalAmount: 300, installments: 1, startMonth: '2026-09', day: 8 },
  { card: 'כאל', merchant: 'סופר פארם', category: 'בריאות', totalAmount: 150, installments: 1, startMonth: '2026-09', day: 15 },
  { card: 'כאל', merchant: 'Wolt', category: 'בילויים ומסעדות', totalAmount: 120, installments: 1, startMonth: '2026-08', day: 20 },
  { card: 'כאל', merchant: 'Wolt', category: 'בילויים ומסעדות', totalAmount: 95, installments: 1, startMonth: '2026-09', day: 5 },

  // ── MAX ──
  { card: 'MAX', merchant: 'ביטוח ישיר - רכב', category: 'ביטוחים', totalAmount: 1800, installments: 6, startMonth: '2026-06', day: 5 },
  { card: 'MAX', merchant: 'AliExpress', category: 'סופר/קניות', totalAmount: 220, installments: 1, startMonth: '2026-08', day: 12 },
  { card: 'MAX', merchant: 'נטפליקס', category: 'מנויים ותקשורת', totalAmount: 55, installments: 1, startMonth: '2026-08', day: 1 },
  { card: 'MAX', merchant: 'נטפליקס', category: 'מנויים ותקשורת', totalAmount: 55, installments: 1, startMonth: '2026-09', day: 1 },
  { card: 'MAX', merchant: 'איקאה', category: 'ביגוד', totalAmount: 2400, installments: 4, startMonth: '2026-07', day: 18 },
  { card: 'MAX', merchant: 'סלקום', category: 'מנויים ותקשורת', totalAmount: 120, installments: 1, startMonth: '2026-09', day: 25 },

  // ── ישראכרט ──
  { card: 'ישראכרט', merchant: 'ביטוח בריאות פרטי', category: 'ביטוחים', totalAmount: 3600, installments: 12, startMonth: '2026-01', day: 3 },
  { card: 'ישראכרט', merchant: 'שופרסל', category: 'סופר/קניות', totalAmount: 540, installments: 1, startMonth: '2026-08', day: 6 },
  { card: 'ישראכרט', merchant: 'שופרסל', category: 'סופר/קניות', totalAmount: 610, installments: 1, startMonth: '2026-09', day: 4 },
  { card: 'ישראכרט', merchant: 'Booking.com', category: 'בילויים ומסעדות', totalAmount: 2100, installments: 3, startMonth: '2026-09', day: 1 },
  { card: 'ישראכרט', merchant: 'פרטנר', category: 'מנויים ותקשורת', totalAmount: 89, installments: 1, startMonth: '2026-08', day: 14 },
  { card: 'ישראכרט', merchant: 'פרטנר', category: 'מנויים ותקשורת', totalAmount: 89, installments: 1, startMonth: '2026-09', day: 14 },
];

const CARD_LAST4 = { 'כאל': '4821', 'MAX': '7350', 'ישראכרט': '1193' };

export function getCreditCardNames() {
  return [...new Set(SEEDS.map(s => s.card))];
}

export function getCardLast4(cardName) {
  return CARD_LAST4[cardName] || null;
}

// אותה צורת נתונים כמו getRealCreditCards (ר' realCreditData.js) - כדי שרכיבי ה-UI יוכלו
// להתייחס לכרטיסי mock וכרטיסים אמיתיים באותה צורה בדיוק.
export function getMockCreditCards() {
  return getCreditCardNames().map(name => ({ id: name, name, nickname: null, last4: getCardLast4(name), active: true }));
}

// כל השורות (מכל הכרטיסים) של חודש נתון, בצורת נתונים אחידה שרכיבי ה-UI צורכים.
export function getCreditRowsForMonth(monthKey) {
  const targetIdx = monthIndex(monthKey);
  return SEEDS.flatMap(seed => {
    const startIdx = monthIndex(seed.startMonth);
    const offset = targetIdx - startIdx;
    if (offset < 0 || offset >= seed.installments) return [];
    const monthlyAmount = Math.round((seed.totalAmount / seed.installments) * 100) / 100;
    const installmentCurrent = offset + 1;
    const installmentsRemaining = seed.installments - installmentCurrent;
    return [{
      id: `${seed.card}__${seed.merchant}__${seed.startMonth}__${seed.day}`,
      cardId: seed.card,
      card: seed.card,
      date: `${monthKey}-${String(seed.day).padStart(2, '0')}`,
      merchant: seed.merchant,
      category: seed.category,
      totalAmount: seed.totalAmount,
      monthlyAmount,
      installmentsTotal: seed.installments,
      installmentCurrent,
      installmentsRemaining,
      isInstallment: seed.installments > 1,
      note: '',
    }];
  });
}

// ── עיצוב משותף ──
export const fmtILS = n => `₪${(Number(n) || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
export const fmtDateHe = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };

// ── סטטוס עסקה יחסית להיום האמיתי: ירד (עבר/היום) / ממתין (עוד לא נגבה החודש) / עתידי (חודש הבא ואילך) ──
export function txStatus(row, monthKey, todayISO = new Date().toISOString().slice(0, 10)) {
  const currentMonth = todayISO.slice(0, 7);
  if (monthKey < currentMonth) return 'ירד';
  if (monthKey > currentMonth) return 'עתידי';
  return row.date <= todayISO ? 'ירד' : 'ממתין';
}
