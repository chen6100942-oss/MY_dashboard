import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon.jsx';
import MarketTicker from './MarketTicker.jsx';
import FinancialGoals from './FinancialGoals.jsx';
import { supabase } from '../lib/supabaseClient.js';

// ── קטגוריות ברירת מחדל (ניתנות לעריכה מלאה בתוך הטבלה) ──
const DEFAULT_INCOME_CATEGORIES = ['הכנסות חן', 'הכנסות דניאל', 'קצבת ילדים', 'מזומן מההורים', 'עסק חן', 'עסק דניאל'];
const DEFAULT_EXPENSE_CATEGORIES = ['שכר דירה / משכנתא', 'ארנונה', 'ועד בית', 'מים', 'חשמל', 'גז', 'תיקונים וטכנאים', 'עזרת בית', 'תחזוקת הגינה'];
const DEFAULT_FUNDS = ['קרן השתלמות עצמאית', 'חסכון בבנק', 'מניות בבנק', 'השקעות נוספות'];
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
  let category = 'שונות';
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hit = keywords.find(kw => remaining.includes(kw));
    if (hit) { category = cat; remaining = remaining.split(hit).join(' '); break; }
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

function TrendChart({ data, onMonthClick }) {
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

function CategoryBars({ data, month }) {
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
  const [incomeCategories, setIncomeCategories] = useState(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [editingCats, setEditingCats] = useState(null); // 'income' | 'expense' | null
  const [loaded, setLoaded] = useState(false);
  const [quickCardName, setQuickCardName] = useState(() => localStorage.getItem('finance_last_card_name') || '');
  const [quickText, setQuickText] = useState('');
  const [quickListening, setQuickListening] = useState(false);
  const renameBefore = useRef({});
  const quickRecognitionRef = useRef(null);

  // ── טעינה ראשונית ──
  useEffect(() => {
    (async () => {
      let e = [], f = [], l = [], c = [], g = [];
      if (isCloud) {
        try {
          const [r1, r2, r3, r4, r5] = await Promise.all([
            supabase.from('finance_entries').select('*').eq('user_id', user.uid),
            supabase.from('finance_funds').select('*').eq('user_id', user.uid),
            supabase.from('finance_loans').select('*').eq('user_id', user.uid),
            supabase.from('finance_credit_cards').select('*').eq('user_id', user.uid),
            supabase.from('finance_goals').select('*').eq('user_id', user.uid),
          ]);
          e = r1.data || []; f = r2.data || []; l = r3.data || []; c = r4.data || []; g = r5.data || [];
        } catch (err) { console.warn('Finance cloud load error:', err.message); }
      }
      if (!isCloud) {
        try { e = JSON.parse(localStorage.getItem('finance_entries') || '[]'); } catch { e = []; }
        try { f = JSON.parse(localStorage.getItem('finance_funds') || '[]'); } catch { f = []; }
        try { l = JSON.parse(localStorage.getItem('finance_loans') || '[]'); } catch { l = []; }
        try { c = JSON.parse(localStorage.getItem('finance_cards') || '[]'); } catch { c = []; }
        try { g = JSON.parse(localStorage.getItem('finance_goals') || '[]'); } catch { g = []; }
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

      setEntries(e); setFunds(f); setLoans(l); setCards(c); setGoals(g);
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
      const copied = midInstallmentCards.map(c => ({ ...c, id: uid(), month, installments_remaining: (Number(c.installments_remaining) || 1) - 1 }));
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
    return map;
  }, [monthCards]);

  const addCardRowManually = () => {
    const card_name = window.prompt('שם הכרטיס:');
    if (!card_name || !card_name.trim()) return;
    const row = { id: uid(), month, card_name: card_name.trim(), description: 'עסקה חדשה', category: 'שונות', monthly_amount: 0, installments_remaining: 1, installments_total: 1, full_amount: 0 };
    setCards(prev => [...prev, row]);
    pushRow('finance_credit_cards', row);
  };

  // ── הוספה מהירה: הקלדה או הקראה של הוצאה, פענוח אוטומטי לשדות (כרטיס, קטגוריה, סכום, תשלומים) ──
  const addParsedRow = (parsed, fallbackCardName) => {
    const card_name = parsed.card_name || fallbackCardName || 'כללי';
    const { card_name: _drop, ...rest } = parsed;
    const row = { id: uid(), month, card_name, ...rest };
    setCards(prev => [...prev, row]);
    pushRow('finance_credit_cards', row);
    return card_name;
  };

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
        <h2 className="text-xl font-bold text-slate-800">מעקב פיננסי</h2>
      </div>

      <MarketTicker />

      {!isCloud && (
        <div className="card p-3 text-center text-xs text-amber-700 bg-amber-50 border border-amber-200">
          את לא מחוברת לחשבון — הנתונים נשמרים רק במחשב הזה ולא מסונכרנים לענן.
        </div>
      )}

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button onClick={() => setView('overview')} className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${view === 'overview' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>סקירה כללית</button>
        <button onClick={() => setView('monthly')} className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${view === 'monthly' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>תזרים חודשי</button>
        <button onClick={() => setView('cards')} className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${view === 'cards' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>כרטיסי אשראי</button>
        <button onClick={() => setView('loans')} className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${view === 'loans' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>הלוואות ומשכנתא</button>
        <button onClick={() => setView('funds')} className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${view === 'funds' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>נכסים ושווי נקי</button>
        <button onClick={() => setView('goals')} className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${view === 'goals' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🎯 יעד פיננסי</button>
        {/* "מדריך" הוסר זמנית — יוחזר לפני השקה לציבור (ר' פרויקט "לפני השקה לציבור") */}
      </div>

      {(view === 'overview' || view === 'monthly' || view === 'cards') && (
        <div className="card p-4 flex items-center justify-between">
          <button onClick={() => setMonth(m => shiftMonth(m, -1))} className="px-4 py-2 bg-violet-100 hover:bg-violet-200 rounded-xl font-semibold text-sm text-violet-700 transition-all">→ חודש קודם</button>
          <h3 className="text-lg font-bold text-slate-800">{monthLabel(month)}</h3>
          <button onClick={() => setMonth(m => shiftMonth(m, 1))} className="px-4 py-2 bg-violet-100 hover:bg-violet-200 rounded-xl font-semibold text-sm text-violet-700 transition-all">חודש הבא ←</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="card p-4 text-center">
            <div className={`text-xl font-extrabold ${k.cls}`}>{fmtILS(k.value)}</div>
            <div className="text-xs text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {view === 'overview' && (
        <div className="space-y-4">
          <TrendChart data={trendData} onMonthClick={setMonth} />
          <CategoryBars data={categoryBreakdown} month={month} />
        </div>
      )}

      {view === 'monthly' && (
        <div className="grid md:grid-cols-2 gap-4">
          <CatTable
            type="income" title="הכנסות" color="emerald" categories={categoriesFor('income')}
            monthEntries={monthEntries} sumBy={sumBy}
            setAmount={setAmount} commitAmount={commitAmount} renameCategory={renameCategory}
            deleteCategory={deleteCategory} addCategory={addCategory} renameBefore={renameBefore}
          />
          <CatTable
            type="expense" title="הוצאות מהחשבון (הוראות קבע וכו')" color="rose" categories={categoriesFor('expense')}
            monthEntries={monthEntries} sumBy={sumBy}
            setAmount={setAmount} commitAmount={commitAmount} renameCategory={renameCategory}
            deleteCategory={deleteCategory} addCategory={addCategory} renameBefore={renameBefore}
          />
        </div>
      )}

      {view === 'cards' && (
        <>
          <div className="card p-5 space-y-3 border-t-[3px] border-violet-200">
            <h4 className="font-bold text-slate-700 text-sm">הוספה מהירה — הקלדה או הקראה</h4>
            <p className="text-xs text-slate-500">
              אפשר להקליד או ללחוץ על המיקרופון ולומר, למשל: <b>"כרטיס ישראכרט זהב, דלק, 250 שקל"</b> או <b>"ביטוח רכב 300 שקל, 3 תשלומים"</b>.
              שם הכרטיס, הקטגוריה, הסכום והתשלומים מזוהים אוטומטית — ואפשר לתקן אחר כך בטבלה.
              אם לא מציינים שם כרטיס, נשמר תחת הכרטיס האחרון שצוין (רשום כרגע כאן: <b>{quickCardName || 'כללי'}</b>).
              אפשר להקריא כמה עסקאות ברצף — פשוט אומרים <b>"שורה חדשה"</b> בין אחת לשנייה.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input value={quickCardName} onChange={e => setQuickCardName(e.target.value)} placeholder="שם הכרטיס" className="w-28 px-2 py-2 rounded-lg border border-slate-200 outline-none text-sm" />
              <input
                value={quickText} onChange={e => setQuickText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addQuickExpense(); }}
                placeholder='לדוגמה: כרטיס ישראכרט זהב, דלק, 250 שקל'
                className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm"
              />
              <button
                onClick={startQuickDictation} title="הקראה"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${quickListening ? 'text-white animate-pulse' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                style={quickListening ? { backgroundColor: '#f43f5e' } : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>
              <button onClick={addQuickExpense} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm">הוספה</button>
            </div>
            {quickListening && <p className="text-xs text-rose-500 animate-pulse">🎙️ מקשיבה — אפשר להמשיך לדבר, כולל "שורה חדשה" בין עסקאות. לחצי שוב על המיקרופון לסיום.</p>}
          </div>

          {Object.keys(cardsByName).length === 0 && (
            <div className="card p-8 text-center text-sm text-slate-400">אין עדיין נתונים לחודש הזה — השתמשי בהוספה המהירה למעלה או הוסיפי שורה ידנית.</div>
          )}

          {Object.entries(cardsByName).map(([cardName, rows]) => (
            <div key={cardName} className="card overflow-hidden">
              <div className="bg-slate-700 px-4 py-2 flex items-center justify-between">
                <span className="text-white font-bold text-sm">{cardName}</span>
                <span className="text-white font-bold text-sm">{fmtILS(rows.reduce((s, r) => s + (Number(r.monthly_amount) || 0), 0))}</span>
              </div>
              <div className="grid grid-cols-[1fr_110px_100px_90px_90px_100px_28px] gap-2 px-4 py-2 bg-slate-100 text-[11px] font-bold text-slate-500">
                <span>תיאור</span><span>תחום</span><span>תשלום</span><span>תשלומים שנותרו</span><span>סה"כ תשלומים</span><span>סכום מלא</span><span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {rows.map(row => (
                  <div key={row.id} className="grid grid-cols-[1fr_110px_100px_90px_90px_100px_28px] gap-2 items-center px-4 py-2">
                    <input value={row.description} onChange={e => updateCardRow(row.id, { description: e.target.value })} onBlur={() => commitCardRow(row.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" />
                    <select value={row.category || 'שונות'} onChange={e => { updateCardRow(row.id, { category: e.target.value }); pushRow('finance_credit_cards', { ...row, category: e.target.value }); }} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm bg-white">
                      {CREDIT_CARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" value={row.monthly_amount || ''} onChange={e => updateCardRow(row.id, { monthly_amount: Number(e.target.value) || 0 })} onBlur={() => commitCardRow(row.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                    <input type="number" value={row.installments_remaining || ''} onChange={e => updateCardRow(row.id, { installments_remaining: Number(e.target.value) || 0 })} onBlur={() => commitCardRow(row.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                    <input type="number" value={row.installments_total || ''} onChange={e => updateCardRow(row.id, { installments_total: Number(e.target.value) || 0 })} onBlur={() => commitCardRow(row.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                    <input type="number" value={row.full_amount || ''} onChange={e => updateCardRow(row.id, { full_amount: Number(e.target.value) || 0 })} onBlur={() => commitCardRow(row.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                    <button onClick={() => removeCardRow(row.id)} className="text-rose-400 hover:text-rose-600">×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={addCardRowManually} className="w-full py-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all card">+ הוספת שורה ידנית</button>

          {Object.keys(cardsByName).length > 0 && (
            <div className="card p-5 flex items-center justify-between border-t-[3px] border-slate-300">
              <span className="font-bold text-slate-700 text-sm">סה"כ כל כרטיסי האשראי ({monthLabel(month)})</span>
              <span className="text-xl font-extrabold text-rose-600">{fmtILS(totalCardsMonth)}</span>
            </div>
          )}
        </>
      )}

      {view === 'loans' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1fr_110px_110px_110px_28px] gap-2 px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500">
            <span>שם ההלוואה / משכנתא</span><span>סכום כולל</span><span>תשלום חודשי</span><span>יתרה לסילוק</span><span></span>
          </div>
          <div className="divide-y divide-slate-100">
            {loans.map(l => (
              <div key={l.id} className="grid grid-cols-[1fr_110px_110px_110px_28px] gap-2 items-center px-4 py-2">
                <input value={l.loan_name} onChange={e => updateLoan(l.id, { loan_name: e.target.value })} onBlur={() => commitLoan(l.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" />
                <input type="number" value={l.total_amount || ''} placeholder="0" onChange={e => updateLoan(l.id, { total_amount: Number(e.target.value) || 0 })} onBlur={() => commitLoan(l.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                <input type="number" value={l.monthly_payment || ''} placeholder="0" onChange={e => updateLoan(l.id, { monthly_payment: Number(e.target.value) || 0 })} onBlur={() => commitLoan(l.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                <input type="number" value={l.remaining_balance || ''} placeholder="0" onChange={e => updateLoan(l.id, { remaining_balance: Number(e.target.value) || 0 })} onBlur={() => commitLoan(l.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                <button onClick={() => removeLoan(l.id)} className="text-rose-400 hover:text-rose-600">×</button>
              </div>
            ))}
            {loans.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-400">עוד לא הוספת הלוואות או משכנתא למעקב</div>}
          </div>
          <button onClick={addLoan} className="w-full py-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">+ הוספת הלוואה / משכנתא</button>
        </div>
      )}

      {view === 'funds' && (
        <>
          <div className="card p-5 text-center">
            <div className={`text-2xl font-extrabold ${netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtILS(netWorth)}</div>
            <div className="text-sm text-slate-500 mt-1">שווי נקי (סה"כ נכסים פחות סה"כ התחייבויות)</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* נכסים */}
            <div className="card overflow-hidden border-t-[3px] border-violet-200">
              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#8b5cf6' }}>
                <span className="text-white font-bold text-sm">נכסים</span>
                <span className="text-white font-bold text-sm">{fmtILS(totalFundsValue)}</span>
              </div>
              <div className="grid grid-cols-[1fr_120px_28px] gap-2 px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500">
                <span>נכס</span><span>שווי מוערך</span><span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {funds.map(f => (
                  <div key={f.id} className="grid grid-cols-[1fr_120px_28px] gap-2 items-center px-4 py-2">
                    <input value={f.fund_name} onChange={e => updateFund(f.id, { fund_name: e.target.value })} onBlur={() => commitFund(f.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" />
                    <input type="number" value={f.current_value || ''} placeholder="0" onChange={e => updateFund(f.id, { current_value: Number(e.target.value) || 0 })} onBlur={() => commitFund(f.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                    <button onClick={() => removeFund(f.id)} className="text-rose-400 hover:text-rose-600">×</button>
                  </div>
                ))}
              </div>
              <button onClick={addFund} className="w-full py-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">+ הוספת נכס</button>
            </div>

            {/* התחייבויות */}
            <div className="card overflow-hidden border-t-[3px] border-rose-200">
              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#f43f5e' }}>
                <span className="text-white font-bold text-sm">התחייבויות</span>
                <span className="text-white font-bold text-sm">{fmtILS(totalLoansRemaining)}</span>
              </div>
              <div className="grid grid-cols-[1fr_120px_28px] gap-2 px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500">
                <span>התחייבות</span><span>יתרה לסילוק</span><span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {loans.map(l => (
                  <div key={l.id} className="grid grid-cols-[1fr_120px_28px] gap-2 items-center px-4 py-2">
                    <input value={l.loan_name} onChange={e => updateLoan(l.id, { loan_name: e.target.value })} onBlur={() => commitLoan(l.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" />
                    <input type="number" value={l.remaining_balance || ''} placeholder="0" onChange={e => updateLoan(l.id, { remaining_balance: Number(e.target.value) || 0 })} onBlur={() => commitLoan(l.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
                    <button onClick={() => removeLoan(l.id)} className="text-rose-400 hover:text-rose-600">×</button>
                  </div>
                ))}
              </div>
              <button onClick={addLoan} className="w-full py-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">+ הוספת התחייבות</button>
              <p className="text-[10px] text-slate-400 px-4 pb-3">לצורך תשלום חודשי מפורט על כל הלוואה — יש טבלה ייעודית ב"הלוואות ומשכנתא".</p>
            </div>
          </div>
        </>
      )}

      {view === 'goals' && (
        <FinancialGoals
          goals={goals} currentMonth={monthKey(new Date())}
          onCreate={addGoal} onUpdate={updateGoal} onCommit={commitGoal} onDelete={removeGoal}
        />
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
    </div>
  );
}
