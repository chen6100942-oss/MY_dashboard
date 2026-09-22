import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon.jsx';
import MarketTicker from './MarketTicker.jsx';
import LiveBankDashboard from './LiveBankDashboard.jsx';
import { supabase } from '../lib/supabaseClient.js';

// ── קטגוריות ברירת מחדל (ניתנות לעריכה מלאה בתוך הטבלה) ──
const DEFAULT_INCOME_CATEGORIES = ['הכנסות חן', 'הכנסות דניאל', 'קצבת ילדים', 'מזומן מההורים', 'עסק חן', 'עסק דניאל'];
const DEFAULT_EXPENSE_CATEGORIES = ['שכר דירה / משכנתא', 'ארנונה', 'ועד בית', 'מים', 'חשמל', 'גז', 'תיקונים וטכנאים', 'עזרת בית', 'תחזוקת הגינה'];
const DEFAULT_FUNDS = ['קרן השתלמות עצמאית', 'חסכון בבנק', 'מניות בבנק', 'השקעות נוספות'];
// זיהוי נכסי פנסיה/חיסכון פנסיוני מתוך רשימת הנכסים הכללית (funds), לפי שם — בלי טבלה נפרדת
const PENSION_FUND_NAMES = ['פנסיה', 'קרן השתלמות עצמאית', 'קופת גמל (משיכה רק בפנסיה)'];
const isPensionFund = name => /פנסיה|השתלמות|גמל/.test(name || '');
// רשימת נכסים מלאה למצג "שווי נקי" (בהשראת דף מעקב שווי נקי סטנדרטי)
const NET_WORTH_ASSET_CATEGORIES = [
  'יתרת עו"ש', 'בית', 'בית נוסף', 'כלי רכב', 'כלי רכב נוסף', 'תכשיטים', 'עבודת אומנות',
  'רהיטים', 'מכשירי חשמל', 'עתיקות', 'נכסים דיגיטליים', 'תיק השקעות',
  'קרן השתלמות', 'קרן פנסיה', 'קופת גמל להשקעה', 'חסכון יומי', 'אחר (ניתן לשינוי)',
];
// רשימת התחייבויות מלאה — נשמרות באותה טבלת ההלוואות (finance_loans), עמודת remaining_balance
const NET_WORTH_LIABILITY_CATEGORIES = [
  'הלוואת משכנתא', 'הלוואת הון דירה', 'הלוואה מגמל להשקעה', 'הלוואה מקרן השתלמות',
  'הלוואות לרכב', 'הלוואות נדל"ן אחרת', 'הלוואות סטודנטים אחרות', 'הלוואות אחרות',
  'חוב כרטיסי אשראי', 'אחר (ניתן לשינוי)',
];
const CREDIT_CARD_CATEGORIES = ['דלק', 'ביטוחים', 'סופר/קניות', 'בריאות', 'בילויים ומסעדות', 'ביגוד', 'תחבורה ורכב', 'חינוך', 'מנויים ותקשורת', 'שונות'];

// מדריך — קישורים למקורות מידע רשמיים/אמינים בלבד (בנק ישראל, רשות ניירות ערך, כל-זכות, גורמי ממשל, עמותת פעמונים)
const GUIDE_CATEGORIES = [
  {
    title: 'בנקאות, עמלות ודירוג אשראי', color: 'violet',
    links: [
      { label: 'בנק ישראל — מידע רשמי על עמלות בנקאיות והשוואת בנקים', url: 'https://boi.org.il/information/fees/' },
      { label: 'כל-זכות — בנקים, כרטיסי אשראי ואמצעי תשלום', url: 'https://www.kolzchut.org.il/he/%D7%91%D7%A0%D7%A7%D7%99%D7%9D,_%D7%9B%D7%A8%D7%98%D7%99%D7%A1%D7%99_%D7%90%D7%A9%D7%A8%D7%90%D7%99_%D7%95%D7%90%D7%9E%D7%A6%D7%A2%D7%99_%D7%AA%D7%A9%D7%9C%D7%95%D7%9D' },
      { label: 'מערכת נתוני אשראי — בדיקת דירוג אשראי אישי (בפיקוח בנק ישראל)', url: 'https://www.creditdata.org.il/' },
    ],
  },
  {
    title: 'חיסכון וניהול תקציב משפחתי', color: 'emerald',
    links: [
      { label: 'עמותת פעמונים — 12 כללי זהב לניהול תקציב', url: 'https://www.paamonim.org/he/12-%D7%9B%D7%9C%D7%9C%D7%99-%D7%96%D7%94%D7%91-%D7%9C%D7%A0%D7%99%D7%94%D7%95%D7%9C-%D7%AA%D7%A7%D7%A6%D7%99%D7%91/' },
      { label: 'עמותת פעמונים — מדריכים, כלים ומחשבונים לניהול כלכלת המשפחה', url: 'https://www.paamonim.org/he/%D7%9B%D7%9C%D7%99%D7%9D-%D7%95%D7%9E%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%99%D7%9D/' },
    ],
  },
  {
    title: 'השקעות למתחילים', color: 'amber',
    links: [
      { label: 'רשות ניירות ערך — הרשות הרשמית לפיקוח על שוק ההון', url: 'https://www.isa.gov.il' },
    ],
  },
  {
    title: 'עסק ועצמאים', color: 'rose',
    links: [
      { label: 'הסוכנות לעסקים קטנים ובינוניים (משרד הכלכלה) — צעדים בפתיחת עסק', url: 'https://www.sba.org.il/hb/Pages/default.aspx' },
      { label: 'כל-זכות — עסקים קטנים', url: 'https://www.kolzchut.org.il/he/%D7%A2%D7%A1%D7%A7%D7%99%D7%9D_%D7%A7%D7%98%D7%A0%D7%99%D7%9D' },
    ],
  },
  {
    title: 'מיסים', color: 'slate',
    links: [
      { label: 'כל-זכות — רשות המסים בישראל', url: 'https://www.kolzchut.org.il/he/%D7%A8%D7%A9%D7%95%D7%AA_%D7%94%D7%9E%D7%A1%D7%99%D7%9D_%D7%91%D7%99%D7%A9%D7%A8%D7%90%D7%9C' },
    ],
  },
];

const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const pad = n => String(n).padStart(2, '0');
const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const monthLabel = key => { const [y, m] = key.split('-').map(Number); return `${HE_MONTHS[m - 1]} ${y}`; };
const shiftMonth = (key, delta) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + delta, 1); return monthKey(d); };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtILS = n => (Number(n) || 0).toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });
// שמות כרטיסים נפוצים בישראל — מזוהים גם בלי המילה "כרטיס" לפניהם
const CARD_BRAND_KEYWORDS = ['ישראכרט', 'כאל', 'מקס', 'לאומי קארד', 'ויזה כאל', 'ויזה', 'מאסטרקארד', 'אמריקן אקספרס', 'דיינרס', 'הפועלים', 'פועלים', 'דיסקונט', 'מזרחי'];

// מילות מספר בעברית → ספרה (כדי שהכתבה קולית שאומרת "שלושה תשלומים" תיתפס גם כשלא הוכתבה כספרה)
const HEBREW_NUMBER_WORDS = {
  'אחד עשר': 11, 'שנים עשר': 12, 'שתים עשרה': 12,
  'אחד': 1, 'אחת': 1, 'שניים': 2, 'שתיים': 2, 'שני': 2, 'שתי': 2,
  'שלושה': 3, 'שלוש': 3, 'ארבעה': 4, 'ארבע': 4, 'חמישה': 5, 'חמש': 5,
  'שישה': 6, 'שש': 6, 'שבעה': 7, 'שבע': 7, 'שמונה': 8, 'תשעה': 9, 'תשע': 9,
  'עשרה': 10, 'עשר': 10,
};
function normalizeHebrewNumbers(text) {
  let t = text;
  Object.keys(HEBREW_NUMBER_WORDS).sort((a, b) => b.length - a.length).forEach(word => {
    t = t.split(word).join(` ${HEBREW_NUMBER_WORDS[word]} `);
  });
  return t.replace(/\s+/g, ' ').trim();
}

// ── פענוח טקסט חופשי (מוקלד או מוקרא) לשורת הוצאה מובנית: כרטיס, תיאור, קטגוריה, סכום, תשלומים ──
// דוגמאות שמזוהות: "כרטיס ישראכרט זהב דלק 250", "ביטוח רכב 300 תשלום 1 מתוך 3", "300 ש"ח סופר ב-3 תשלומים"
function parseQuickExpenseText(rawText) {
  let remaining = ` ${normalizeHebrewNumbers(rawText.trim())} `;

  // חשוב לפרק תשלומים/סכום/קטגוריה *לפני* שם הכרטיס, כדי ש"כרטיס X" לא "יבלע" בטעות
  // את מילת הקטגוריה שבאה מיד אחריו (למשל "כרטיס ישראכרט דלק" → הכרטיס הוא רק "ישראכרט")

  // תשלומים: "1/3", "1 מתוך 3", "3 תשלומים", "ב-3 תשלומים"
  let installments_remaining = 1, installments_total = 1;
  const instFraction = remaining.match(/(\d+)\s*(?:\/|מתוך|מ-)\s*(\d+)/);
  if (instFraction) {
    installments_remaining = Number(instFraction[1]) || 1;
    installments_total = Number(instFraction[2]) || 1;
    remaining = remaining.replace(instFraction[0], ' ');
  } else {
    const instTotalOnly = remaining.match(/(?:ב-?)?(\d+)\s*תשלומים/);
    if (instTotalOnly) {
      installments_total = Number(instTotalOnly[1]) || 1;
      installments_remaining = installments_total;
      remaining = remaining.replace(instTotalOnly[0], ' ');
    }
  }

  // סכום
  let amount = 0;
  const amtWithCurrency = remaining.match(/(\d+(?:\.\d+)?)\s*(?:₪|שקל|שקלים|ש"ח|ש''ח)/);
  if (amtWithCurrency) {
    amount = Number(amtWithCurrency[1]) || 0;
    remaining = remaining.replace(amtWithCurrency[0], ' ');
  } else {
    const anyNum = remaining.match(/\d+(?:\.\d+)?/);
    if (anyNum) { amount = Number(anyNum[0]) || 0; remaining = remaining.replace(anyNum[0], ' '); }
  }

  // קטגוריה
  const CATEGORY_KEYWORDS = {
    'דלק': ['דלק', 'תדלוק', 'פז', 'דור אלון', 'סונול'],
    'ביטוחים': ['ביטוח', 'ביטוחים'],
    'סופר/קניות': ['סופר', 'שופרסל', 'רמי לוי', 'קניות', 'ויקטורי'],
    'בריאות': ['בריאות', 'רופא', 'קופת חולים', 'תרופות', 'בית מרקחת'],
    'בילויים ומסעדות': ['מסעדה', 'בילוי', 'בילויים', 'קפה', 'בית קפה'],
    'ביגוד': ['ביגוד', 'בגדים', 'הנעלה', 'נעליים'],
    'תחבורה ורכב': ['תחבורה', 'רכב', 'חניה', 'כביש', 'רכבת', 'אוטובוס'],
    'חינוך': ['חינוך', 'בית ספר', 'גן', 'לימודים', 'חוג'],
    'מנויים ותקשורת': ['מנוי', 'מנויים', 'נטפליקס', 'סלולר', 'טלפון', 'אינטרנט', 'תקשורת'],
  };
  // חשוב: מילת הקטגוריה לא מוסרת מ-remaining - היא לרוב שם בית העסק עצמו (למשל "רמי לוי")
  // וצריכה להישאר כדי שתופיע בתיאור העסקה, ולא רק תיקבע את הקטגוריה בשקט.
  let category = 'שונות';
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hit = keywords.find(kw => remaining.includes(kw));
    if (hit) { category = cat; break; }
  }

  // שם כרטיס: "כרטיס X" מפורש, או שם מותג ידוע — נבדק אחרון, אחרי שהמספרים והקטגוריה כבר הוסרו
  let card_name = null;
  const explicitCard = remaining.match(/כרטיס\s+([֐-׿]+(?:\s+[֐-׿]+){0,1})/);
  if (explicitCard) {
    card_name = explicitCard[1].trim();
    remaining = remaining.replace(explicitCard[0], ' ');
  } else {
    const brandHit = CARD_BRAND_KEYWORDS.find(b => remaining.includes(b));
    if (brandHit) { card_name = brandHit; remaining = remaining.split(brandHit).join(' '); }
  }

  const description = remaining.replace(/תשלום(ים)?|מתוך|כרטיס/g, ' ').replace(/\s+/g, ' ').trim() || category;
  return { card_name, description, category, monthly_amount: amount, installments_remaining, installments_total, full_amount: amount * installments_total };
}

// ביטוי שמזהה פקודת "מעבר לשורה חדשה" בתוך הכתבה רציפה
const LINE_BREAK_RE = /(שורה חדשה|רד שורה|ירידת שורה|שורה הבאה)/;

// ── רכיבים ברמת המודול (לא בתוך FinanceTracker!) — כדי שלא ייווצרו מחדש בכל הקלדה,
// מה שהיה גורם ל-React לפרק ולבנות מחדש את שדות הקלט ולנתק את הפוקוס אחרי כל תו ──

// חשוב: הרקע כאן מוגדר ב-style מפורש (לא className כמו bg-violet-500), כי יש כלל CSS גלובלי
// באפליקציה שממיר כל bg-violet-*/bg-rose-*/bg-emerald-*/bg-amber-* (כל גוון) לצבע אחיד ומעומעם —
// וזה הופך כיתוב לבן על גביו לבלתי-קריא. style מפורש עוקף את זה.
const CAT_COLORS = {
  emerald: { border: 'border-emerald-200', headHex: '#10b981', bg: 'bg-emerald-50' },
  rose: { border: 'border-rose-200', headHex: '#f43f5e', bg: 'bg-rose-50' },
};

function CatTable({ type, title, color, categories, monthEntries, sumBy, setAmount, commitAmount, renameCategory, deleteCategory, addCategory, renameBefore }) {
  const c = CAT_COLORS[color];
  return (
    <div className={`card overflow-hidden border-t-[3px] ${c.border}`}>
      <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: c.headHex }}>
        <span className="text-white font-bold text-sm">{title}</span>
        <span className="text-white font-bold text-sm">{fmtILS(sumBy(type))}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {categories.map(category => {
          const row = monthEntries.find(e => e.type === type && e.category === category);
          return (
            <div key={category} className={`flex items-center gap-2 px-4 py-2 ${c.bg}`}>
              <input
                defaultValue={category}
                onFocus={() => { renameBefore.current[category] = category; }}
                onBlur={e => renameCategory(type, renameBefore.current[category] || category, e.target.value)}
                className="flex-1 text-sm px-2 py-1 rounded-lg border border-slate-200 outline-none bg-white"
              />
              <input
                type="number" value={row?.amount || ''} placeholder="0"
                onChange={e => setAmount(type, category, e.target.value)}
                onBlur={() => commitAmount(type, category)}
                className="w-24 text-left px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm bg-white" dir="ltr"
              />
              <button onClick={() => deleteCategory(type, category)} className="text-rose-400 hover:text-rose-600 shrink-0">×</button>
            </div>
          );
        })}
      </div>
      <button onClick={() => addCategory(type)} className="w-full py-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">+ הוספת קטגוריה</button>
    </div>
  );
}

export function TrendChart({ data, onMonthClick }) {
  const W = 640, H = 220;
  const padL = 46, padR = 16, padT = 16, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxVal = Math.max(1, ...data.flatMap(d => [d.income, d.expense]));
  const rawStep = maxVal / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const tickStep = niceResidual * magnitude;
  const niceMax = Math.ceil(maxVal / tickStep) * tickStep;
  // RTL: העמודה הראשונה (הכי ישנה) מימין, האחרונה (הנוכחית) משמאל — כיוון הקריאה בעברית
  const xFor = i => padL + plotW - (plotW * i) / (data.length - 1 || 1);
  const yFor = v => padT + plotH - (plotH * Math.min(v, niceMax)) / niceMax;
  const pathFor = key => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d[key])}`).join(' ');
  const ticks = [];
  for (let t = 0; t <= niceMax + 0.001; t += tickStep) ticks.push(Math.round(t));
  const fmtTick = t => (t >= 1000 ? `${Math.round(t / 1000)}K` : t);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="font-bold text-slate-700 text-sm">מגמה: הכנסות מול הוצאות (12 חודשים אחרונים)</h4>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><i style={{ display: 'inline-block', width: 12, height: 2, background: '#10b981', borderRadius: 2 }} />הכנסות</span>
          <span className="flex items-center gap-1.5"><i style={{ display: 'inline-block', width: 12, height: 0, borderTop: '2px dashed #f43f5e' }} />הוצאות</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={yFor(t)} y2={yFor(t)} stroke="#e1e0d9" strokeWidth="1" />
            <text x={padL - 8} y={yFor(t) + 3} textAnchor="end" fontSize="10" fill="#898781">{fmtTick(t)}</text>
          </g>
        ))}
        <path d={pathFor('income')} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathFor('expense')} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i} onClick={() => onMonthClick && onMonthClick(d.month)} style={{ cursor: onMonthClick ? 'pointer' : 'default' }}>
            {onMonthClick && <rect x={xFor(i) - 16} y={padT} width="32" height={plotH} fill="transparent" />}
            <circle cx={xFor(i)} cy={yFor(d.income)} r="4" fill="#10b981" stroke="#fff" strokeWidth="2" />
            <circle cx={xFor(i)} cy={yFor(d.expense)} r="4" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
            <text x={xFor(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="#898781">{monthLabel(d.month).split(' ')[0].slice(0, 3)}</text>
            {onMonthClick && <title>{monthLabel(d.month)} — לחצי לצפייה בסקירה של החודש</title>}
          </g>
        ))}
        {data.length > 0 && (
          <>
            <text x={xFor(data.length - 1) - 8} y={yFor(data[data.length - 1].income)} textAnchor="end" fontSize="10" fontWeight="bold" fill="#059669">{fmtILS(data[data.length - 1].income)}</text>
            <text x={xFor(data.length - 1) - 8} y={yFor(data[data.length - 1].expense) + 12} textAnchor="end" fontSize="10" fontWeight="bold" fill="#e11d48">{fmtILS(data[data.length - 1].expense)}</text>
          </>
        )}
      </svg>
    </div>
  );
}

export function CategoryBars({ data, month }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="card p-5">
      <h4 className="font-bold text-slate-700 text-sm mb-3">הוצאות לפי תחום ({monthLabel(month)})</h4>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">אין עדיין נתוני הוצאות לחודש הזה</p>
      ) : (
        <div className="space-y-2">
          {data.map(({ category, value }) => (
            <div key={category} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-slate-600 truncate">{category}</span>
              <div className="flex-1 h-5 bg-rose-50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: '#f43f5e' }} />
              </div>
              <span className="w-20 shrink-0 text-xs font-bold text-rose-600" dir="ltr">{fmtILS(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinanceTracker({ user }) {
  const isCloud = !!(supabase && user?.uid && user.uid !== 'local');
  const [view, setView] = useState('overview'); // overview | monthly | funds | loans | cards
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [entries, setEntries] = useState([]); // income + expense
  const [funds, setFunds] = useState([]);
  const [loans, setLoans] = useState([]);
  const [cards, setCards] = useState([]); // finance_credit_cards rows (all months)
  const [goals, setGoals] = useState([]); // finance_goals rows (יעדים פיננסיים - לא תלויי חודש)
  const [cardStatuses, setCardStatuses] = useState([]); // finance_card_status rows: {id, card_name, is_active} - עצמאי מחודש
  const [incomeCategories, setIncomeCategories] = useState(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [editingCats, setEditingCats] = useState(null); // 'income' | 'expense' | null
  const [loaded, setLoaded] = useState(false);
  const [quickCardName, setQuickCardName] = useState(() => localStorage.getItem('finance_last_card_name') || '');
  const [quickText, setQuickText] = useState('');
  const [quickListening, setQuickListening] = useState(false);
  const renameBefore = useRef({});
  const quickRecognitionRef = useRef(null);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askError, setAskError] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [advisorMessages, setAdvisorMessages] = useState([]);
  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(null);

  // ── טעינה ראשונית ──
  useEffect(() => {
    (async () => {
      let e = [], f = [], l = [], c = [], g = [], cs = [];
      if (isCloud) {
        try {
          const [r1, r2, r3, r4, r5, r6] = await Promise.all([
            supabase.from('finance_entries').select('*').eq('user_id', user.uid),
            supabase.from('finance_funds').select('*').eq('user_id', user.uid),
            supabase.from('finance_loans').select('*').eq('user_id', user.uid),
            supabase.from('finance_credit_cards').select('*').eq('user_id', user.uid),
            supabase.from('finance_goals').select('*').eq('user_id', user.uid),
            supabase.from('finance_card_status').select('*').eq('user_id', user.uid),
          ]);
          e = r1.data || []; f = r2.data || []; l = r3.data || []; c = r4.data || []; g = r5.data || []; cs = r6.data || [];
        } catch (err) { console.warn('Finance cloud load error:', err.message); }
      }
      if (!isCloud) {
        try { e = JSON.parse(localStorage.getItem('finance_entries') || '[]'); } catch { e = []; }
        try { f = JSON.parse(localStorage.getItem('finance_funds') || '[]'); } catch { f = []; }
        try { l = JSON.parse(localStorage.getItem('finance_loans') || '[]'); } catch { l = []; }
        try { c = JSON.parse(localStorage.getItem('finance_cards') || '[]'); } catch { c = []; }
        try { g = JSON.parse(localStorage.getItem('finance_goals') || '[]'); } catch { g = []; }
        try { cs = JSON.parse(localStorage.getItem('finance_card_status') || '[]'); } catch { cs = []; }
      }
      try {
        const savedIncomeCats = JSON.parse(localStorage.getItem('finance_income_categories') || 'null');
        const savedExpenseCats = JSON.parse(localStorage.getItem('finance_expense_categories') || 'null');
        if (savedIncomeCats) setIncomeCategories(savedIncomeCats);
        if (savedExpenseCats) setExpenseCategories(savedExpenseCats);
      } catch { /* keep defaults */ }

      // seed default funds on very first use only
      if (f.length === 0 && !localStorage.getItem('finance_funds_seeded')) {
        f = DEFAULT_FUNDS.map(name => ({ id: uid(), fund_name: name, current_value: 0, monthly_deposit: 0 }));
        localStorage.setItem('finance_funds_seeded', '1');
        if (isCloud) f.forEach(row => pushRow('finance_funds', row));
      }

      // one-time migration: add pension/property/vehicle asset rows for net-worth tracking (without touching existing funds)
      if (!localStorage.getItem('finance_assets_v2_seeded')) {
        const existingNames = new Set(f.map(x => x.fund_name));
        const toAdd = ['פנסיה', 'דירה - שווי', 'רכב - שווי'].filter(name => !existingNames.has(name)).map(name => ({ id: uid(), fund_name: name, current_value: 0, monthly_deposit: 0 }));
        if (toAdd.length) { f = [...f, ...toAdd]; if (isCloud) toAdd.forEach(row => pushRow('finance_funds', row)); }
        localStorage.setItem('finance_assets_v2_seeded', '1');
      }

      // one-time migration: full "net worth statement" category set (assets + liabilities), matching
      // synonyms from the earlier v2 pass so nothing gets duplicated for accounts that already migrated
      if (!localStorage.getItem('finance_assets_v3_seeded')) {
        const existingFundNames = new Set(f.map(x => x.fund_name));
        const ASSET_SYNONYMS = { 'קרן פנסיה': 'פנסיה', 'בית': 'דירה - שווי', 'כלי רכב': 'רכב - שווי' };
        const fundsToAdd = NET_WORTH_ASSET_CATEGORIES
          .filter(name => !existingFundNames.has(name) && !(ASSET_SYNONYMS[name] && existingFundNames.has(ASSET_SYNONYMS[name])))
          .map(name => ({ id: uid(), fund_name: name, current_value: 0, monthly_deposit: 0 }));
        if (fundsToAdd.length) { f = [...f, ...fundsToAdd]; if (isCloud) fundsToAdd.forEach(row => pushRow('finance_funds', row)); }

        const existingLoanNames = new Set(l.map(x => x.loan_name));
        const loansToAdd = NET_WORTH_LIABILITY_CATEGORIES
          .filter(name => !existingLoanNames.has(name))
          .map(name => ({ id: uid(), loan_name: name, total_amount: 0, monthly_payment: 0, remaining_balance: 0 }));
        if (loansToAdd.length) { l = [...l, ...loansToAdd]; if (isCloud) loansToAdd.forEach(row => pushRow('finance_loans', row, 'last_updated')); }

        localStorage.setItem('finance_assets_v3_seeded', '1');
      }

      // one-time migration: dedicated "הפנסיה שלי" starter rows (pension, independent study fund, gemel-for-retirement)
      if (!localStorage.getItem('finance_pension_v1_seeded')) {
        const existingFundNames = new Set(f.map(x => x.fund_name));
        const pensionToAdd = PENSION_FUND_NAMES
          .filter(name => !existingFundNames.has(name))
          .map(name => ({ id: uid(), fund_name: name, current_value: 0, monthly_deposit: 0 }));
        if (pensionToAdd.length) { f = [...f, ...pensionToAdd]; if (isCloud) pensionToAdd.forEach(row => pushRow('finance_funds', row)); }
        localStorage.setItem('finance_pension_v1_seeded', '1');
      }

      setEntries(e); setFunds(f); setLoans(l); setCards(c); setGoals(g); setCardStatuses(cs);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloud, user?.uid]);

  // ── מירור מקומי (מטמון מהיר + גיבוי במצב לא מחוברת) ──
  useEffect(() => { if (loaded) localStorage.setItem('finance_entries', JSON.stringify(entries)); }, [entries, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('finance_funds', JSON.stringify(funds)); }, [funds, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('finance_loans', JSON.stringify(loans)); }, [loans, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('finance_cards', JSON.stringify(cards)); }, [cards, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('finance_goals', JSON.stringify(goals)); }, [goals, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('finance_card_status', JSON.stringify(cardStatuses)); }, [cardStatuses, loaded]);
  useEffect(() => { localStorage.setItem('finance_income_categories', JSON.stringify(incomeCategories)); }, [incomeCategories]);
  useEffect(() => { localStorage.setItem('finance_expense_categories', JSON.stringify(expenseCategories)); }, [expenseCategories]);

  // ── שמירה גנרית לענן ──
  const pushRow = async (table, row, dateField) => {
    if (!isCloud) return;
    try {
      const patch = dateField ? { [dateField]: new Date().toISOString() } : {};
      const { error } = await supabase.from(table).upsert({ ...row, user_id: user.uid, ...patch }, { onConflict: 'id' });
      if (error) console.warn(`${table} save error:`, error.message);
    } catch (err) { console.warn(`${table} save error:`, err.message); }
  };
  const deleteRow = async (table, id) => {
    if (!isCloud) return;
    try { await supabase.from(table).delete().eq('id', id); } catch (err) { console.warn(err.message); }
  };

  // ══════════════════ שאלות חופשיות על הכספים (רק לפי קטגוריה רלוונטית — פרטיות) ══════════════════
  const askFinanceQuestion = async () => {
    if (!askQuestion.trim() || askLoading) return;
    setAskError(null);
    setAskAnswer('');
    const allCategories = [...new Set([...incomeCategories, ...expenseCategories, ...CREDIT_CARD_CATEGORIES])];
    const matchedCategories = allCategories.filter(cat => askQuestion.includes(cat));
    if (matchedCategories.length === 0) {
      setAskError('נסי לציין קטגוריה ספציפית בשאלה (למשל: ביטוחים, בריאות, רכב, חינוך...) כדי שאשלח רק את הנתונים הרלוונטיים.');
      return;
    }
    setAskLoading(true);
    try {
      const relevantEntries = entries.filter(e => matchedCategories.includes(e.category))
        .map(e => ({ type: e.type, category: e.category, amount: e.amount, month: e.month, note: e.note }));
      const relevantCards = cards.filter(c => matchedCategories.includes(c.category))
        .map(c => ({ card_name: c.card_name, description: c.description, category: c.category, monthly_amount: c.monthly_amount, month: c.month }));
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/finance-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ question: askQuestion, categories: matchedCategories, entries: relevantEntries, cards: relevantCards }),
      });
      const data = await response.json();
      if (response.ok) setAskAnswer(data.answer || 'לא התקבלה תשובה.');
      else setAskError(data.error || 'שגיאה בקבלת תשובה.');
    } catch (err) {
      setAskError(err.message);
    } finally {
      setAskLoading(false);
    }
  };

  // ══════════════════ היועץ הפיננסי האישי (CFO) — רואה את כל התמונה, לא רק קטגוריה ══════════════════
  const sendAdvisorMessage = async (textOverride) => {
    const text = (textOverride ?? advisorInput).trim();
    if (!text || advisorLoading) return;
    const newMessages = [...advisorMessages, { role: 'user', content: text }];
    setAdvisorMessages(newMessages);
    setAdvisorInput('');
    setAdvisorError(null);
    setAdvisorLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/finance-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ messages: newMessages, entries, cards, loans, funds, goals }),
      });
      const data = await response.json();
      if (response.ok) setAdvisorMessages(prev => [...prev, { role: 'assistant', content: data.answer || '' }]);
      else setAdvisorError(data.error || 'שגיאה בקבלת תשובה.');
    } catch (err) {
      setAdvisorError(err.message);
    } finally {
      setAdvisorLoading(false);
    }
  };

  // ══════════════════ תזרים חודשי (הכנסות / הוצאות) ══════════════════
  const monthEntries = useMemo(() => entries.filter(e => e.month === month), [entries, month]);

  const setAmount = (type, category, value) => {
    const amount = value === '' ? 0 : Number(value) || 0;
    setEntries(prev => {
      const idx = prev.findIndex(x => x.month === month && x.type === type && x.category === category);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], amount }; return next; }
      return [...prev, { id: uid(), month, type, category, amount, note: '' }];
    });
  };
  const commitAmount = (type, category) => {
    const row = entries.find(x => x.month === month && x.type === type && x.category === category);
    if (row) pushRow('finance_entries', row, 'updated_at');
  };

  const renameCategory = (type, oldName, newName) => {
    if (!newName.trim() || newName === oldName) return;
    const setCats = type === 'income' ? setIncomeCategories : setExpenseCategories;
    setCats(prev => prev.map(c => (c === oldName ? newName : c)));
    setEntries(prev => prev.map(e => (e.type === type && e.category === oldName ? { ...e, category: newName } : e)));
    if (isCloud) {
      supabase.from('finance_entries').update({ category: newName }).eq('user_id', user.uid).eq('type', type).eq('category', oldName)
        .then(({ error }) => { if (error) console.warn('rename error:', error.message); });
    }
  };
  const deleteCategory = (type, name) => {
    const setCats = type === 'income' ? setIncomeCategories : setExpenseCategories;
    setCats(prev => prev.filter(c => c !== name));
  };
  const addCategory = type => {
    const name = window.prompt('שם הקטגוריה החדשה:');
    if (!name || !name.trim()) return;
    const setCats = type === 'income' ? setIncomeCategories : setExpenseCategories;
    setCats(prev => [...prev, name.trim()]);
  };
  const categoriesFor = type => {
    const list = type === 'income' ? incomeCategories : expenseCategories;
    const custom = monthEntries.filter(e => e.type === type && !list.includes(e.category)).map(e => e.category);
    return [...list, ...custom];
  };

  // ── שכפול אוטומטי מהחודש הקודם כשעוברים לחודש ריק — מקל על מילוי הטבלה מדי חודש ──
  // חל רק על החודש הקודם ישירות (לא מחפש כמה חודשים אחורה אם דילגו על חודש).
  // בכרטיסי אשראי — רק שורות "באמצע" תשלומים (installments_total > 1 ונשאר יותר מתשלום 1) מועתקות,
  // עם הפחתת תשלום אחד; עסקאות חד-פעמיות ותשלום אחרון לא מועתקות.
  useEffect(() => {
    if (!loaded) return;
    const hasEntries = entries.some(en => en.month === month);
    const hasCards = cards.some(c => c.month === month);
    if (hasEntries || hasCards) return; // החודש כבר מולא - לא לגעת בו
    const prevMonth = shiftMonth(month, -1);
    const prevEntries = entries.filter(en => en.month === prevMonth);
    const prevCards = cards.filter(c => c.month === prevMonth);

    if (prevEntries.length > 0) {
      const copied = prevEntries.map(en => ({ ...en, id: uid(), month }));
      setEntries(prev => [...prev, ...copied]);
      copied.forEach(row => pushRow('finance_entries', row, 'updated_at'));
    }

    const midInstallmentCards = prevCards.filter(c => (Number(c.installments_total) || 1) > 1 && (Number(c.installments_remaining) || 1) > 1);
    if (midInstallmentCards.length > 0) {
      const copied = midInstallmentCards.map(c => ({ ...c, id: uid(), month, txn_date: `${month}-01`, installments_remaining: (Number(c.installments_remaining) || 1) - 1 }));
      setCards(prev => [...prev, ...copied]);
      copied.forEach(row => pushRow('finance_credit_cards', row));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, loaded]);

  // ══════════════════ קרנות השקעה ══════════════════
  const addFund = () => {
    const fund_name = window.prompt('שם הנכס/החיסכון (למשל: קרן, פנסיה, דירה, רכב):');
    if (!fund_name || !fund_name.trim()) return;
    const row = { id: uid(), fund_name: fund_name.trim(), current_value: 0, monthly_deposit: 0 };
    setFunds(prev => [...prev, row]);
    pushRow('finance_funds', row, 'last_updated');
  };
  const updateFund = (id, patch) => setFunds(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));
  const commitFund = id => { const row = funds.find(f => f.id === id); if (row) pushRow('finance_funds', row, 'last_updated'); };
  const removeFund = id => { setFunds(prev => prev.filter(f => f.id !== id)); deleteRow('finance_funds', id); };

  // ══════════════════ הלוואות ומשכנתא ══════════════════
  const addLoan = () => {
    const loan_name = window.prompt('שם ההלוואה/המשכנתא:');
    if (!loan_name || !loan_name.trim()) return;
    const row = { id: uid(), loan_name: loan_name.trim(), total_amount: 0, monthly_payment: 0, remaining_balance: 0 };
    setLoans(prev => [...prev, row]);
    pushRow('finance_loans', row, 'last_updated');
  };
  const updateLoan = (id, patch) => setLoans(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  const commitLoan = id => { const row = loans.find(l => l.id === id); if (row) pushRow('finance_loans', row, 'last_updated'); };
  const removeLoan = id => { setLoans(prev => prev.filter(l => l.id !== id)); deleteRow('finance_loans', id); };

  // ══════════════════ כרטיסי אשראי ══════════════════
  const monthCards = useMemo(() => cards.filter(c => c.month === month), [cards, month]);
  const cardsByName = useMemo(() => {
    const map = {};
    monthCards.forEach(row => { (map[row.card_name] ||= []).push(row); });
    // חדש לישן בתוך כל כרטיס - שורות בלי תאריך יורדות לסוף
    Object.values(map).forEach(rows => rows.sort((a, b) => (b.txn_date || '') < (a.txn_date || '') ? -1 : (b.txn_date || '') > (a.txn_date || '') ? 1 : 0));
    return map;
  }, [monthCards]);

  const addCardRowManually = () => {
    const card_name = window.prompt('שם הכרטיס:');
    if (!card_name || !card_name.trim()) return;
    const row = { id: uid(), month, card_name: card_name.trim(), txn_date: todayISO(), description: 'עסקה חדשה', category: 'שונות', monthly_amount: 0, installments_remaining: 1, installments_total: 1, full_amount: 0 };
    setCards(prev => [...prev, row]);
    pushRow('finance_credit_cards', row);
  };

  // ── הוספה מהירה: הקלדה או הקראה של הוצאה, פענוח אוטומטי לשדות (כרטיס, קטגוריה, סכום, תשלומים) ──
  const addParsedRow = (parsed, fallbackCardName) => {
    const card_name = parsed.card_name || fallbackCardName || 'כללי';
    const { card_name: _drop, ...rest } = parsed;
    const row = { id: uid(), month, card_name, txn_date: todayISO(), ...rest };
    setCards(prev => [...prev, row]);
    pushRow('finance_credit_cards', row);
    return card_name;
  };

  // ── סטטוס כרטיס (פעיל / לא בשימוש) - עצמאי מהחודש, ברירת מחדל: פעיל ──
  const isCardActive = cardName => {
    const row = cardStatuses.find(s => s.card_name === cardName);
    return row ? row.is_active !== false : true;
  };
  const toggleCardActive = cardName => {
    const existing = cardStatuses.find(s => s.card_name === cardName);
    const row = existing ? { ...existing, is_active: !isCardActive(cardName) } : { id: uid(), card_name: cardName, is_active: false };
    setCardStatuses(prev => (existing ? prev.map(s => (s.id === row.id ? row : s)) : [...prev, row]));
    pushRow('finance_card_status', row, 'updated_at');
  };

  // ── תווית תשלום ידידותית מהשדות הקיימים: "תשלום 1/2", חד-פעמי = בלי תווית, אחרון = 🎉 ──
  const installmentLabel = row => {
    const total = Number(row.installments_total) || 1;
    if (total <= 1) return null;
    const remaining = Number(row.installments_remaining) || 1;
    const current = total - remaining + 1;
    return remaining <= 1 ? { text: 'תשלום אחרון 🎉', last: true } : { text: `תשלום ${current}/${total}`, last: false };
  };

  // ── פילוח קטגוריות באחוזים לרשימת שורות כרטיס נתונה ──
  const percentBreakdown = rows => {
    const total = rows.reduce((s, r) => s + (Number(r.monthly_amount) || 0), 0);
    if (total <= 0) return [];
    const map = {};
    rows.forEach(r => { const cat = r.category || 'שונות'; map[cat] = (map[cat] || 0) + (Number(r.monthly_amount) || 0); });
    return Object.entries(map).map(([category, value]) => ({ category, pct: Math.round((value / total) * 100) })).sort((a, b) => b.pct - a.pct);
  };
  const allCardsPercentBreakdown = useMemo(() => percentBreakdown(monthCards), [monthCards]);

  const addQuickExpense = () => {
    if (!quickText.trim()) return;
    const parsed = parseQuickExpenseText(quickText);
    const usedCardName = addParsedRow(parsed, quickCardName);
    setQuickCardName(usedCardName);
    localStorage.setItem('finance_last_card_name', usedCardName);
    setQuickText('');
  };

  // הכתבה רציפה: אפשר להגיד כמה עסקאות ברצף ולהפריד ביניהן ב"שורה חדשה" / "רד שורה"
  const startQuickDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('הדפדפן הזה אינו תומך בהכתבה קולית. מומלץ להשתמש ב-Chrome או Edge.'); return; }
    if (quickRecognitionRef.current) { quickRecognitionRef.current.stop(); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.interimResults = true;
    recognition.continuous = true;
    let committedBuffer = '';
    let activeCardName = quickCardName.trim() || 'כללי';
    const commitSegment = text => {
      const trimmed = text.trim();
      if (!trimmed) return;
      activeCardName = addParsedRow(parseQuickExpenseText(trimmed), activeCardName);
      setQuickCardName(activeCardName);
      localStorage.setItem('finance_last_card_name', activeCardName);
    };
    recognition.onstart = () => setQuickListening(true);
    recognition.onresult = event => {
      let finalChunk = '', interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += `${t} `; else interimChunk += t;
      }
      if (finalChunk) {
        committedBuffer += finalChunk;
        let match;
        while ((match = committedBuffer.match(LINE_BREAK_RE))) {
          commitSegment(committedBuffer.slice(0, match.index));
          committedBuffer = committedBuffer.slice(match.index + match[0].length);
        }
      }
      setQuickText((committedBuffer + interimChunk).trim());
    };
    recognition.onerror = () => setQuickListening(false);
    recognition.onend = () => {
      setQuickListening(false);
      quickRecognitionRef.current = null;
      if (committedBuffer.trim()) commitSegment(committedBuffer);
      setQuickText('');
    };
    quickRecognitionRef.current = recognition;
    recognition.start();
  };
  const updateCardRow = (id, patch) => setCards(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  const commitCardRow = id => { const row = cards.find(c => c.id === id); if (row) pushRow('finance_credit_cards', row); };
  const removeCardRow = id => { setCards(prev => prev.filter(c => c.id !== id)); deleteRow('finance_credit_cards', id); };

  // ══════════════════ יעדים פיננסיים ══════════════════
  const addGoal = goal => { setGoals(prev => [...prev, goal]); pushRow('finance_goals', goal, 'updated_at'); };
  const updateGoal = (id, patch) => setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...patch } : g)));
  const commitGoal = id => { const row = goals.find(g => g.id === id); if (row) pushRow('finance_goals', row, 'updated_at'); };
  const removeGoal = id => { setGoals(prev => prev.filter(g => g.id !== id)); deleteRow('finance_goals', id); };

  // ══════════════════ סיכומים ══════════════════
  const sumBy = type => monthEntries.filter(e => e.type === type).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalIncome = sumBy('income');
  const totalBankExpense = sumBy('expense');
  const totalCardsMonth = monthCards.reduce((s, c) => s + (Number(c.monthly_amount) || 0), 0);
  const totalLoansMonthly = loans.reduce((s, l) => s + (Number(l.monthly_payment) || 0), 0);
  const totalExpenseAll = totalBankExpense + totalCardsMonth + totalLoansMonthly;
  const netCashflow = totalIncome - totalExpenseAll;
  const totalFundsValue = funds.reduce((s, f) => s + (Number(f.current_value) || 0), 0);
  const totalLoansRemaining = loans.reduce((s, l) => s + (Number(l.remaining_balance) || 0), 0);
  const netWorth = totalFundsValue - totalLoansRemaining;

  const kpis = [
    { label: 'סה"כ הכנסות', value: totalIncome, cls: 'text-emerald-600' },
    { label: 'סה"כ הוצאות (הכל)', value: totalExpenseAll, cls: 'text-rose-600' },
    { label: 'סה"כ נכסים', value: totalFundsValue, cls: 'text-violet-600' },
    { label: 'תזרים נותר לחודש', value: netCashflow, cls: netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600' },
    { label: 'שווי נקי', value: netWorth, cls: netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600' },
  ];

  // ══════════════════ סקירה כללית: מגמה 12 חודשים קדימה + פילוח לפי תחום ══════════════════
  // מהחודש הנוכחי ועוד 11 חודשים קדימה (לא לאחור) - חודשים עתידיים שעדיין אין בהם נתונים יוצגו כ-0.
  const trendMonths = useMemo(() => {
    const arr = [];
    let k = month;
    for (let i = 0; i < 12; i++) { arr.push(k); k = shiftMonth(k, 1); }
    return arr;
  }, [month]);

  const trendData = useMemo(() => trendMonths.map(mk => {
    const inc = entries.filter(e => e.month === mk && e.type === 'income').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const bankExp = entries.filter(e => e.month === mk && e.type === 'expense').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const cardExp = cards.filter(c => c.month === mk).reduce((s, c) => s + (Number(c.monthly_amount) || 0), 0);
    return { month: mk, income: inc, expense: bankExp + cardExp + totalLoansMonthly };
  }), [trendMonths, entries, cards, totalLoansMonthly]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    monthEntries.filter(e => e.type === 'expense').forEach(e => { map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0); });
    monthCards.forEach(c => { const cat = c.category || 'שונות'; map[cat] = (map[cat] || 0) + (Number(c.monthly_amount) || 0); });
    return Object.entries(map).filter(([, v]) => v > 0).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
  }, [monthEntries, monthCards]);

  return (
    <div className="finance-tracker max-w-6xl mx-auto space-y-6 animate-slide-in-up pb-16">
      <div className="card p-5 flex items-center gap-3 justify-center text-center">
        <Icon name="trending-up" size={26} />
        <h2 className="text-xl font-bold text-slate-800">פיננסים</h2>
      </div>

      <MarketTicker />

      {!isCloud && (
        <div className="card p-3 text-center text-xs text-amber-700 bg-amber-50 border border-amber-200">
          את לא מחוברת לחשבון — הנתונים נשמרים רק במחשב הזה ולא מסונכרנים לענן.
        </div>
      )}

      <div className="card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">❓</span>
          <h3 className="text-sm font-bold text-slate-700">שאלי על הכספים שלך</h3>
        </div>
        <div className="flex gap-2">
          <input value={askQuestion} onChange={e => setAskQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askFinanceQuestion()}
            placeholder="לדוגמה: תעשי לי רשימה של כל הביטוחים שיש לי" className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
          <button onClick={askFinanceQuestion} disabled={askLoading || !askQuestion.trim()} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40 shrink-0">{askLoading ? '...' : 'שאלי'}</button>
        </div>
        <p className="text-[10px] text-slate-400">לשמירה על פרטיות — ציינו קטגוריה בשאלה (למשל: ביטוחים, בריאות, רכב, חינוך); רק הנתונים של הקטגוריה הזו יישלחו לצורך התשובה.</p>
        {askError && <p className="text-xs text-rose-500">{askError}</p>}
        {askAnswer && <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl text-sm text-slate-700 whitespace-pre-line">{askAnswer}</div>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setView(v => v === 'pension' ? 'overview' : 'pension')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${view === 'pension' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>👵 הפנסיה שלי</button>
        <button onClick={() => setView(v => v === 'advisor' ? 'overview' : 'advisor')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${view === 'advisor' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🧑‍💼 היועץ הפיננסי שלי</button>
        <button onClick={() => setView(v => v === 'guide' ? 'overview' : 'guide')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${view === 'guide' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>📖 מדריך</button>
      </div>


      {view === 'pension' && (() => {
        const pensionFunds = funds.filter(f => isPensionFund(f.fund_name));
        const totalPension = pensionFunds.reduce((s, f) => s + (Number(f.current_value) || 0), 0);
        return (
          <div className="space-y-4">
            <div className="card p-5 text-center">
              <div className="text-2xl font-extrabold text-violet-600">{fmtILS(totalPension)}</div>
              <div className="text-sm text-slate-500 mt-1">סך חיסכון פנסיוני</div>
            </div>
            <div className="card overflow-hidden border-t-[3px] border-violet-200">
              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#8b5cf6' }}>
                <span className="text-white font-bold text-sm">👵 הפנסיה שלי</span>
                <span className="text-white font-bold text-sm">{fmtILS(totalPension)}</span>
              </div>
              <div className="grid grid-cols-[1fr_120px_28px] gap-2 px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500">
                <span>קופה / קרן</span><span>שווי מוערך</span><span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {pensionFunds.map(f => (
                  <div key={f.id} className="grid grid-cols-[1fr_120px_28px] gap-2 items-center px-4 py-2">
                    <input value={f.fund_name} onChange={e => updateFund(f.id, { fund_name: e.target.value })} onBlur={() => commitFund(f.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" />
                    <input type="number" value={f.current_value || ''} placeholder="0" onChange={e => updateFund(f.id, { current_value: Number(e.target.value) || 0 })} onBlur={() => commitFund(f.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                    <button onClick={() => removeFund(f.id)} className="text-rose-400 hover:text-rose-600">×</button>
                  </div>
                ))}
                {pensionFunds.length === 0 && <p className="text-xs text-slate-400 text-center py-4">אין עדיין קופות פנסיוניות ברשימה.</p>}
              </div>
              <button onClick={addFund} className="w-full py-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">+ הוספת קופה/קרן (פנסיה, השתלמות, גמל...)</button>
            </div>
            <p className="text-[11px] text-slate-400 px-1">שורות שהשם שלהן כולל "פנסיה", "השתלמות" או "גמל" מוצגות כאן אוטומטית, וגם ממשיכות להופיע בתוך "נכסים ושווי נקי" כחלק מהשווי הנקי הכולל.</p>
          </div>
        );
      })()}

      {view === 'advisor' && (
        <div className="space-y-3">
          <div className="card p-4 space-y-2 border-t-[3px] border-violet-400">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">🧑‍💼 היועץ הפיננסי האישי שלך</h3>
            <p className="text-xs text-slate-500">רואה את כל התמונה הפיננסית שלך בדשבורד (הכנסות/הוצאות, הלוואות, נכסים, יעדים) כדי לתת ניתוח וטיפים אמיתיים — אבל בלי גישה לחשבונות בנק ובלי יכולת לבצע פעולות בפועל. אם חסר לו נתון (כמו ריבית על הלוואה), הוא יבקש אותו.</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => sendAdvisorMessage('תעשה לי CFO Report')} disabled={advisorLoading} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-xs font-bold transition-all disabled:opacity-40">📊 תעשה לי CFO Report</button>
              <button onClick={() => sendAdvisorMessage('מה הדבר הכי חכם שאני יכולה לעשות כרגע עם הכסף שלי?')} disabled={advisorLoading} className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-xs font-bold transition-all disabled:opacity-40">💡 מה הכי חכם לעשות עכשיו?</button>
              {advisorMessages.length > 0 && <button onClick={() => { setAdvisorMessages([]); setAdvisorError(null); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-bold transition-all">🗑️ איפוס שיחה</button>}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            {advisorMessages.length === 0 && !advisorLoading && (
              <p className="text-sm text-slate-400 text-center py-6">התחילי שיחה — למשל "תעשה לי CFO Report", או שאלה חופשית על תזרים, חובות, משכנתא, השקעות או מינוף.</p>
            )}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pl-1">
              {advisorMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-line ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {advisorLoading && (
                <div className="flex justify-start"><div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-400">חושב...</div></div>
              )}
            </div>
            {advisorError && <p className="text-xs text-rose-500">{advisorError}</p>}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input value={advisorInput} onChange={e => setAdvisorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAdvisorMessage()}
                placeholder="שאלי כל דבר על המצב הפיננסי שלך..." className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
              <button onClick={() => sendAdvisorMessage()} disabled={advisorLoading || !advisorInput.trim()} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40 shrink-0">שליחה</button>
            </div>
          </div>
        </div>
      )}

      {view === 'guide' && (
        <>
          <div className="card p-5 text-center">
            <h4 className="font-bold text-slate-700 text-sm mb-1">מדריך פיננסי</h4>
            <p className="text-xs text-slate-500">קישורים למקורות מידע רשמיים ואמינים בלבד — בנק ישראל, רשות ניירות ערך, כל-זכות, גורמי ממשל ועמותת פעמונים. לא המלצות מסחריות.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {GUIDE_CATEGORIES.map(cat => {
              const c = {
                violet: { headHex: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-200' },
                emerald: { headHex: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                amber: { headHex: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200' },
                rose: { headHex: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200' },
                slate: { headHex: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200' },
              }[cat.color];
              return (
                <div key={cat.title} className={`card overflow-hidden border-t-[3px] ${c.border}`}>
                  <div className="px-4 py-2" style={{ backgroundColor: c.headHex }}><span className="text-white font-bold text-sm">{cat.title}</span></div>
                  <div className="divide-y divide-slate-100">
                    {cat.links.map(link => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:${c.bg} transition-all`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="flex-1">{link.label}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <LiveBankDashboard
        user={user}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        onImported={(newEntry) => setEntries(prev => [...prev, newEntry])}
        funds={funds} addFund={addFund} updateFund={updateFund} commitFund={commitFund} removeFund={removeFund}
        goals={goals} addGoal={addGoal} updateGoal={updateGoal} commitGoal={commitGoal} removeGoal={removeGoal}
      />
    </div>
  );
}

