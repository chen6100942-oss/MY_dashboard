import React, { useState } from 'react';

// ── כרטיסיית "יעד פיננסי" — רשימת יעדים לחיסכון (דירה, טיול, רכב וכו') עם התקדמות, טיפים ומוטיבציה ──

const fmtILS = n => (Number(n) || 0).toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

// סוג יעד → אמוג'י + טיפים מותאמים. "אחר" מכסה כל מטרה שלא ברשימה.
const GOAL_TYPES = {
  home: {
    label: 'דירה למגורים', emoji: '🏠', tips: [
      'בדקי מסלולי חיסכון ייעודיים לרכישת דירה ראשונה מול הבנק שלך.',
      'הפקדה חודשית קבועה בהוראת קבע עוזרת יותר מהפקדות מזדמנות.',
      'בדקי זכאות לתוכניות ממשלתיות כמו "מחיר למשתכן" או סיוע ממשרד השיכון.',
      'שקלי להעביר את הסכום לחשבון או פיקדון נפרד כדי לא "לגעת" בו בטעות.',
    ],
  },
  investment: {
    label: 'דירה להשקעה', emoji: '🏢', tips: [
      'חשבי את התשואה הצפויה משכירות מול עלות המימון לפני שקובעים סכום יעד.',
      'בדקי כמה הון עצמי נדרש בפועל מול אחוז המינוף המקסימלי שתקבלי מהבנק.',
      'שימי לב לעלויות נלוות (מס רכישה, עו"ד, שיפוץ) שלא תמיד נכנסות לתקציב הראשוני.',
      'הפרידי את החיסכון הזה מהחיסכון השוטף כדי לעקוב אחרי ההתקדמות בבירור.',
    ],
  },
  trip: {
    label: 'טיול', emoji: '✈️', tips: [
      'תקצבי לפי כל הסעיפים מראש: טיסות, לינה, ביטוח נסיעות וכסף כיס.',
      'פתחי קופת חיסכון נפרדת מהחשבון השוטף כדי לא לבזבז בטעות מהיעד.',
      'מעקב מוקדם אחרי מחירי טיסות יכול לחסוך המון — הזמינו מראש כשאפשר.',
      'חיסכון חודשי קבוע וקטן קל יותר מסכום גדול בבת אחת בסוף.',
    ],
  },
  car: {
    label: 'רכב', emoji: '🚗', tips: [
      'השוואת ליסינג מול קנייה יכולה לשנות משמעותית את הסכום הדרוש.',
      'אל תשכחי לתקצב גם ביטוח, טסט ותחזוקה שוטפת — לא רק את מחיר הרכב.',
      'בדיקת רכב יד שנייה ע"י מכונאי מהימן לפני קנייה חוסכת הפתעות יקרות.',
    ],
  },
  emergency: {
    label: 'קרן חירום', emoji: '🛟', tips: [
      'קרן חירום בריאה מכסה בדרך כלל 3–6 חודשי הוצאות מחיה.',
      'חשוב שהכסף יהיה נזיל וזמין — לא מושקע במקום שקשה למשוך ממנו במהירות.',
      'זו הקרן הראשונה שכדאי להשלים לפני יעדים אחרים — היא רשת הביטחון שלך.',
    ],
  },
  other: {
    label: 'אחר', emoji: '🎯', tips: [
      'פרקי את היעד לסכום חודשי קבוע — קל יותר לעמוד בו לאורך זמן.',
      'הפרידי את החיסכון הזה משאר הכסף כדי לראות בבירור כמה כבר נחסך.',
    ],
  },
};

function monthsBetween(targetMonth, fromMonth) {
  if (!targetMonth) return null;
  const [ty, tm] = targetMonth.split('-').map(Number);
  const [fy, fm] = fromMonth.split('-').map(Number);
  if (!ty || !tm || !fy || !fm) return null;
  return (ty - fy) * 12 + (tm - fm);
}

function motivationFor(pct) {
  if (pct >= 100) return '🎉 הגעת ליעד! כל הכבוד על ההתמדה.';
  if (pct >= 75) return 'כמעט שם — עוד קצת ותגיעי! 💪';
  if (pct >= 50) return 'כבר מעל חצי הדרך — יופי של התקדמות!';
  if (pct >= 25) return 'את בדרך הנכונה, תמשיכי כך!';
  return 'כל התחלה היא הישג — צעד ראשון כבר נעשה 🌱';
}

function AddGoalForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('home');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full py-3 text-sm text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all card border-2 border-dashed border-slate-200">
        + הוספת יעד פיננסי חדש
      </button>
    );
  }

  const submit = () => {
    if (!targetAmount || Number(targetAmount) <= 0) return;
    onCreate({
      id: uid(),
      goal_name: name.trim() || GOAL_TYPES[type].label,
      goal_type: type,
      target_amount: Number(targetAmount) || 0,
      target_date: targetDate || '',
      current_amount: Number(currentAmount) || 0,
    });
    setOpen(false); setName(''); setTargetAmount(''); setTargetDate(''); setCurrentAmount(''); setType('home');
  };

  return (
    <div className="card p-5 space-y-4 border-t-[3px] border-violet-200">
      <h4 className="font-bold text-slate-700 text-sm">יעד חדש — כמה שאלות קצרות</h4>
      <div>
        <label className="text-xs text-slate-500 block mb-1.5">למה מיועד החיסכון?</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GOAL_TYPES).map(([key, t]) => (
            <button key={key} onClick={() => setType(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${type === key ? 'bg-violet-600 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 block mb-1">שם היעד (אופציונלי)</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={GOAL_TYPES[type].label}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">כמה צריך לחסוך בסה"כ?</label>
          <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">עד מתי? (אופציונלי)</label>
          <input type="month" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">כמה כבר חסכת עד היום?</label>
          <input type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600">ביטול</button>
        <button onClick={submit} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm">יצירת יעד</button>
      </div>
    </div>
  );
}

function GoalCard({ goal, currentMonth, onUpdate, onCommit, onDelete }) {
  const type = GOAL_TYPES[goal.goal_type] || GOAL_TYPES.other;
  const target = Number(goal.target_amount) || 0;
  const current = Number(goal.current_amount) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  const monthsLeft = monthsBetween(goal.target_date, currentMonth);
  const monthlyNeeded = monthsLeft && monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : null;

  const commitField = (patch) => { onUpdate(goal.id, patch); onCommit(goal.id); };

  return (
    <div className="card overflow-hidden border-t-[3px] border-violet-200">
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl shrink-0">{type.emoji}</span>
            <input defaultValue={goal.goal_name} onBlur={e => commitField({ goal_name: e.target.value })}
              className="font-bold text-slate-800 text-sm flex-1 min-w-0 outline-none border-b border-transparent focus:border-violet-300 bg-transparent" />
          </div>
          <button onClick={() => onDelete(goal.id)} className="text-rose-400 hover:text-rose-600 shrink-0">×</button>
        </div>

        <div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#10b981' : '#8b5cf6' }} />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
            <span>{pct}%</span>
            <span>{fmtILS(current)} מתוך {fmtILS(target)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">נחסך עד היום</label>
            <input type="number" value={goal.current_amount || ''} placeholder="0"
              onChange={e => onUpdate(goal.id, { current_amount: Number(e.target.value) || 0 })}
              onBlur={() => onCommit(goal.id)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">סכום יעד</label>
            <input type="number" value={goal.target_amount || ''} placeholder="0"
              onChange={e => onUpdate(goal.id, { target_amount: Number(e.target.value) || 0 })}
              onBlur={() => onCommit(goal.id)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">עד מתי</label>
            <input type="month" value={goal.target_date || ''}
              onChange={e => onUpdate(goal.id, { target_date: e.target.value })}
              onBlur={() => onCommit(goal.id)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 outline-none text-sm" dir="ltr" />
          </div>
        </div>

        {remaining > 0 && (
          <p className="text-xs text-slate-500">
            נשאר לחסוך <b className="text-violet-600">{fmtILS(remaining)}</b>
            {monthlyNeeded ? <> — כדי להגיע בזמן כדאי לחסוך כ-<b className="text-violet-600">{fmtILS(monthlyNeeded)}</b> לחודש</> : null}
          </p>
        )}

        <p className="text-sm font-semibold text-emerald-600">{motivationFor(pct)}</p>

        <div className="bg-violet-50 rounded-xl p-3 space-y-1">
          <p className="text-xs font-bold text-violet-700">טיפים להצלחה</p>
          <ul className="text-xs text-slate-600 space-y-1 pr-4" style={{ listStyle: 'disc' }}>
            {type.tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function FinancialGoals({ goals, currentMonth, onCreate, onUpdate, onCommit, onDelete }) {
  return (
    <div className="space-y-4">
      {goals.length === 0 && (
        <div className="card p-8 text-center text-sm text-slate-400">
          עוד אין יעדים פיננסיים — כל טיול, דירה או חלום אחר מתחיל מיעד אחד ברור. אפשר להוסיף למטה 🎯
        </div>
      )}
      {goals.map(goal => (
        <GoalCard key={goal.id} goal={goal} currentMonth={currentMonth} onUpdate={onUpdate} onCommit={onCommit} onDelete={onDelete} />
      ))}
      <AddGoalForm onCreate={onCreate} />
    </div>
  );
}
