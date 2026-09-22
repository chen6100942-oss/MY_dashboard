import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// מסך נעילה לפני כניסה לכרטיסיית "פיננסים". כשמחוברת לענן, הקוד נבדק
// לגמרי בצד השרת (Supabase RPC — ר' supabase-security-schema.sql):
// ה-hash של הקוד לא נגיש בשום צורה לדפדפן, ההשוואה קורית בתוך Postgres,
// ויש הגבלת ניסיונות (5 ניסיונות שגויים = נעילה ל-10 דקות). כשלא מחוברת
// (מצב מקומי/תצוגה מקדימה בלבד) נשמר קוד מקומי חלש יותר ב-localStorage,
// כי אין שרת לבדוק מולו. ננעל מחדש בכל טעינה מחדש של הדף (sessionStorage).
const LOCAL_KEY = 'finance_pin_hash_local';
const UNLOCK_KEY = 'finance_unlocked';

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function FinancePinGate({ user, children }) {
  const isCloud = !!(supabase && user?.uid && user.uid !== 'local');
  const [loaded, setLoaded] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (isCloud) {
        try {
          const { data } = await supabase.rpc('has_finance_pin');
          setHasPin(!!data);
        } catch { setHasPin(false); }
      } else {
        setHasPin(!!localStorage.getItem(LOCAL_KEY));
      }
      setLoaded(true);
    })();
  }, [isCloud, user?.uid]);

  const createPin = async () => {
    if (pin.length < 4) { setError('הקוד חייב להיות לפחות 4 ספרות'); return; }
    if (pin !== confirmPin) { setError('הקודים לא תואמים'); return; }
    setBusy(true); setError('');
    try {
      if (isCloud) {
        const { error: err } = await supabase.rpc('set_finance_pin', { new_pin: pin });
        if (err) throw err;
      } else {
        localStorage.setItem(LOCAL_KEY, await sha256(pin));
      }
      setHasPin(true);
      sessionStorage.setItem(UNLOCK_KEY, '1');
      setUnlocked(true);
    } catch (err) {
      setError(err.message || 'שגיאה בשמירת הקוד');
    } finally {
      setBusy(false);
    }
  };

  const tryUnlock = async () => {
    setBusy(true); setError('');
    try {
      if (isCloud) {
        const { data, error: err } = await supabase.rpc('verify_finance_pin', { candidate_pin: pin });
        if (err) throw err;
        if (data) { sessionStorage.setItem(UNLOCK_KEY, '1'); setUnlocked(true); }
        else setError('קוד שגוי');
      } else {
        const hash = await sha256(pin);
        if (hash === localStorage.getItem(LOCAL_KEY)) { sessionStorage.setItem(UNLOCK_KEY, '1'); setUnlocked(true); }
        else setError('קוד שגוי');
      }
    } catch (err) {
      setError(err.message || 'שגיאה באימות הקוד');
    } finally {
      setBusy(false);
    }
  };

  const resetPin = async () => {
    if (!window.confirm('לאפס את הקוד ולהגדיר קוד חדש?')) return;
    setBusy(true); setError('');
    try {
      if (isCloud) { await supabase.rpc('clear_finance_pin'); }
      else { localStorage.removeItem(LOCAL_KEY); }
      setHasPin(false);
      setPin(''); setConfirmPin('');
    } catch (err) {
      setError(err.message || 'שגיאה באיפוס הקוד');
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <div className="card p-8 text-center text-sm text-slate-400">טוענת...</div>;
  if (unlocked) return children;

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="card p-6 space-y-4 text-center border-t-[3px] border-violet-200">
        <div className="text-3xl">🔒</div>
        {!hasPin ? (
          <>
            <h3 className="font-bold text-slate-800">הגדרת קוד כניסה לפיננסים</h3>
            <p className="text-xs text-slate-500">הקוד נבדק בצד השרת ולא נשמר גלוי — {isCloud ? 'כולל הגבלת ניסיונות אוטומטית.' : 'במצב לא-מחוברת נשמר מקומית בלבד.'}</p>
            <input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="קוד חדש (4+ ספרות)" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center text-lg tracking-widest" dir="ltr" />
            <input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="אימות קוד" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center text-lg tracking-widest" dir="ltr" />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button onClick={createPin} disabled={busy} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50">שמירת קוד וכניסה</button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-slate-800">כרטיסיית פיננסים נעולה</h3>
            <input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} onKeyDown={e => e.key === 'Enter' && tryUnlock()} placeholder="הזיני קוד" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center text-lg tracking-widest" dir="ltr" autoFocus />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button onClick={tryUnlock} disabled={busy} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50">כניסה</button>
            <button onClick={resetPin} disabled={busy} className="text-xs text-slate-400 hover:text-slate-600">שכחתי את הקוד — איפוס</button>
          </>
        )}
      </div>
    </div>
  );
}
