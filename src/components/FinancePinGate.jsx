import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// מסך נעילה קל למשקל לפני כניסה לכרטיסיית "פיננסים" - קוד ספרות נשמר כ-hash (לא בטקסט
// גלוי), מסונכרן לענן דרך profiles.finance_pin_hash כשמחוברת, או מקומית ב-localStorage
// כשלא. חשוב: זו מסך פרטיות/הסחת דעת (למשל נגד קליק מקרי של ילד), לא הצפנה אמיתית -
// מי שיש לו גישה למכשיר/לחשבון יכול לעקוף אותה בקלות אם ירצה. ננעל מחדש בכל טעינה
// מחדש של הדף (נשמר רק ל-sessionStorage, לא לצמיתות).
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
  const [storedHash, setStoredHash] = useState(null);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (isCloud) {
        try {
          const { data } = await supabase.from('profiles').select('finance_pin_hash').eq('id', user.uid).single();
          setStoredHash(data?.finance_pin_hash || null);
        } catch { setStoredHash(null); }
      } else {
        setStoredHash(localStorage.getItem(LOCAL_KEY) || null);
      }
      setLoaded(true);
    })();
  }, [isCloud, user?.uid]);

  const saveHash = async hash => {
    if (isCloud) {
      try { await supabase.from('profiles').update({ finance_pin_hash: hash }).eq('id', user.uid); } catch { /* best-effort */ }
    } else {
      localStorage.setItem(LOCAL_KEY, hash);
    }
    setStoredHash(hash);
  };

  const createPin = async () => {
    if (pin.length < 4) { setError('הקוד חייב להיות לפחות 4 ספרות'); return; }
    if (pin !== confirmPin) { setError('הקודים לא תואמים'); return; }
    const hash = await sha256(pin);
    await saveHash(hash);
    sessionStorage.setItem(UNLOCK_KEY, '1');
    setUnlocked(true);
  };

  const tryUnlock = async () => {
    const hash = await sha256(pin);
    if (hash === storedHash) {
      sessionStorage.setItem(UNLOCK_KEY, '1');
      setUnlocked(true);
      setError('');
    } else {
      setError('קוד שגוי');
    }
  };

  const resetPin = async () => {
    if (!window.confirm('לאפס את הקוד ולהגדיר קוד חדש?')) return;
    await saveHash(null);
    setPin(''); setConfirmPin(''); setError('');
  };

  if (!loaded) return <div className="card p-8 text-center text-sm text-slate-400">טוענת...</div>;
  if (unlocked) return children;

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="card p-6 space-y-4 text-center border-t-[3px] border-violet-200">
        <div className="text-3xl">🔒</div>
        {!storedHash ? (
          <>
            <h3 className="font-bold text-slate-800">הגדרת קוד כניסה לפיננסים</h3>
            <p className="text-xs text-slate-500">קוד פרטיות קל — לא הצפנה אמיתית, רק כדי שלא כל אחת שמסתכלת במכשיר תיכנס בטעות.</p>
            <input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="קוד חדש (4+ ספרות)" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center text-lg tracking-widest" dir="ltr" />
            <input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="אימות קוד" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center text-lg tracking-widest" dir="ltr" />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button onClick={createPin} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm">שמירת קוד וכניסה</button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-slate-800">כרטיסיית פיננסים נעולה</h3>
            <input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} onKeyDown={e => e.key === 'Enter' && tryUnlock()} placeholder="הזיני קוד" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center text-lg tracking-widest" dir="ltr" autoFocus />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button onClick={tryUnlock} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm">כניסה</button>
            <button onClick={resetPin} className="text-xs text-slate-400 hover:text-slate-600">שכחתי את הקוד — איפוס</button>
          </>
        )}
      </div>
    </div>
  );
}
