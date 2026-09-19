// ============================================================
// דריסה ידנית של סטטוס "פעיל/לא בשימוש" לכרטיס אמיתי, לפי 4 ספרות אחרונות.
// ברירת המחדל היא הסטטוס האמיתי מ-Financy (a.status === 'enabled') - הדריסה
// כאן קיימת רק לכרטיסים שבהם Financy טועה (למשל כרטיס "enabled" ב-Financy
// שכבר לא בשימוש בפועל). נשמר מקומית בדפדפן, לא ב-Financy עצמו.
// ============================================================
const STORAGE_KEY = 'real_card_active_overrides';

// אומת ישירות מול המשתמשת (2026-09) - Financy מדווחת "enabled" גם על 1018 ו-7317,
// אבל בפועל רק שלושת אלה בשימוש.
const DEFAULT_OVERRIDES = {
  '0484': true, '1520': true, '1547': true,
  '1018': false, '7317': false, '6106': false, '1627': false, '6891': false, '8390': false,
};

function readOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored) return stored;
  } catch { /* fall through to defaults */ }
  return { ...DEFAULT_OVERRIDES };
}

export function getCardActiveOverride(last4) {
  if (!last4) return undefined;
  const overrides = readOverrides();
  return last4 in overrides ? overrides[last4] : undefined;
}

export function setCardActiveOverride(last4, active) {
  if (!last4) return;
  const overrides = readOverrides();
  overrides[last4] = active;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch { /* ignore quota errors */ }
}

// סטטוס בפועל: דריסה ידנית אם קיימת, אחרת מה ש-Financy מדווחת.
export function effectiveActive(card) {
  const override = getCardActiveOverride(card.last4);
  return override !== undefined ? override : card.active;
}
