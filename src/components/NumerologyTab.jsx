import React, { useState, useMemo, useEffect } from 'react';
import Icon from './Icon.jsx';

// ── גימטריה עברית: ערך מספרי לכל אות ──
const HEBREW_VALUES = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
  'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
};
const MASTER_NUMBERS = new Set([11, 22, 33]);

// מצמצמת מספר לספרה בודדת (1-9), אך עוצרת אם מגיעה למספר מאסטר (11/22/33)
function reduceNumber(num) {
  let n = num;
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

function destinyNumberFromName(name) {
  const sum = [...name].reduce((s, ch) => s + (HEBREW_VALUES[ch] || 0), 0);
  return sum > 0 ? reduceNumber(sum) : null;
}

function lifePathFromBirthdate(dateStr) {
  if (!dateStr) return null;
  const digits = dateStr.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const sum = digits.split('').reduce((s, d) => s + Number(d), 0);
  return reduceNumber(sum);
}

const MEANINGS = {
  1: { title: 'המנהיגה', text: 'עצמאות, יוזמה ופריצת דרך. את מי שפותחת שבילים חדשים ולא חוששת ללכת ראשונה. הייעוד שלך קשור להובלה, יצירה מהיסוד, ואמון ביכולת שלך לסמוך על עצמך.' },
  2: { title: 'המקשרת', text: 'רגישות, שיתוף פעולה ואיזון. את מי שיודעת להקשיב, לגשר ולהחזיק מרחב לאחרים. הייעוד שלך קשור לזוגיות, שותפויות, ויצירת הרמוניה סביבך.' },
  3: { title: 'היוצרת', text: 'ביטוי עצמי, יצירתיות ושמחת חיים. את מי שמביאה צבע, מילים ותקשורת לעולם. הייעוד שלך קשור לאמנות, כתיבה, השראה ולתת קול לדברים שבפנים.' },
  4: { title: 'הבונה', text: 'יסודות, סדר ועבודה מתמדת. את מי שבונה דברים שנשארים — יציבות, מבנה, אמינות. הייעוד שלך קשור להקמת דברים בני-קיימא, בעבודה קשה ובאורך רוח.' },
  5: { title: 'החופשיה', text: 'תנועה, שינוי והרפתקנות. את מי שזקוקה לחופש ולגיוון כדי לפרוח. הייעוד שלך קשור לחוויה, גמישות, ולראות את העולם מזוויות רבות.' },
  6: { title: 'המטפחת', text: 'אחריות, בית ואהבה. את מי שדואגת, מטפחת ומרפאת את הסובבים אותה. הייעוד שלך קשור למשפחה, קהילה, ויצירת מקום בטוח לאחרים.' },
  7: { title: 'המחפשת', text: 'תבונה, רוחניות והתבוננות פנימית. את מי שמחפשת משמעות מעבר לפני השטח. הייעוד שלך קשור למחקר, לימוד עמוק, ולחיבור לעולם הפנימי.' },
  8: { title: 'המגשימה', text: 'שאפתנות, שפע ועוצמה אישית. את מי שיודעת להפוך חזון למציאות מוחשית. הייעוד שלך קשור להנהגה בעולם המעשי — עסקים, כסף והשפעה.' },
  9: { title: 'הנותנת', text: 'חמלה, השלמה ותרומה לעולם. את מי שרואה תמונה רחבה ופועלת למען הכלל. הייעוד שלך קשור לנתינה, ריפוי וסגירת מעגלים.' },
  11: { title: 'המאסטרית הרוחנית', text: 'אינטואיציה חדה ורגישות גבוהה. מספר מאסטר — עוצמה רוחנית כפולה של המספר 2. הייעוד שלך קשור להשראה, הארה, והנחיית אחרים דרך תובנה פנימית.' },
  22: { title: 'הבנאית הגדולה', text: 'חזון ענק ויכולת מעשית להגשים אותו. מספר מאסטר — עוצמה כפולה של המספר 4. הייעוד שלך קשור ליצירת דברים גדולים שמשפיעים על הרבה אנשים.' },
  33: { title: 'המורה המרפאת', text: 'אהבה ללא תנאי ונתינה מרפאת. מספר מאסטר — עוצמה כפולה של המספר 6. הייעוד שלך קשור להוראה, ריפוי, ונתינה מהלב ברמה הרחבה ביותר.' },
};

export default function NumerologyTab() {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('numerology_profile') || 'null');
      if (saved) { setName(saved.name || ''); setBirthdate(saved.birthdate || ''); }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem('numerology_profile', JSON.stringify({ name, birthdate }));
  }, [name, birthdate, loaded]);

  const destinyNumber = useMemo(() => destinyNumberFromName(name), [name]);
  const lifePathNumber = useMemo(() => lifePathFromBirthdate(birthdate), [birthdate]);

  return (
    <div className="numerology-tab max-w-4xl mx-auto space-y-6 animate-slide-in-up pb-16">
      <div className="card p-5 flex items-center gap-3 justify-center text-center">
        <Icon name="sparkles" size={26} />
        <h2 className="text-xl font-bold text-slate-800">נומורולוגיה</h2>
      </div>

      <div className="card p-5 space-y-4">
        <p className="text-xs text-slate-500 text-center">מחשבון על בסיס גימטריה עברית (מהשם המלא) ותאריך לידה. מיועד להשראה והתבוננות עצמית — לא כמדע מדויק.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1 block">שם מלא (עברית)</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: חן כהן" className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1 block">תאריך לידה</span>
            <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" dir="ltr" />
          </label>
        </div>
      </div>

      {lifePathNumber && (
        <div className="card p-6 border-t-[3px] border-violet-300">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-extrabold text-violet-700 shrink-0">{lifePathNumber}</div>
            <div>
              <div className="text-xs font-bold text-violet-500">מספר נתיב החיים</div>
              <div className="text-lg font-bold text-slate-800">{MEANINGS[lifePathNumber]?.title}</div>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{MEANINGS[lifePathNumber]?.text}</p>
        </div>
      )}

      {destinyNumber && (
        <div className="card p-6 border-t-[3px] border-amber-300">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl font-extrabold text-amber-700 shrink-0">{destinyNumber}</div>
            <div>
              <div className="text-xs font-bold text-amber-500">מספר הייעוד (מהשם)</div>
              <div className="text-lg font-bold text-slate-800">{MEANINGS[destinyNumber]?.title}</div>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{MEANINGS[destinyNumber]?.text}</p>
        </div>
      )}

      {!lifePathNumber && !destinyNumber && (
        <div className="card p-8 text-center text-sm text-slate-400">מלאי שם ותאריך לידה כדי לראות את הייעוד שלך ✨</div>
      )}
    </div>
  );
}
