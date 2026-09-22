import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Shown after a successful email/password (or Google) login when the account
// has 2FA enabled but the current session hasn't completed the MFA challenge
// yet (aal1, needs aal2). Blocks entry to the dashboard until a valid code —
// from the authenticator app, or a one-time backup code — is provided.
export default function MfaChallenge({ onVerified }) {
  const [factorId, setFactorId] = useState(null);
  const [mode, setMode] = useState('code'); // 'code' | 'backup'
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFactor, setLoadingFactor] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.auth.mfa.listFactors();
      if (err) { setError(err.message); setLoadingFactor(false); return; }
      const totp = (data?.totp || []).find(f => f.status === 'verified');
      setFactorId(totp?.id || null);
      setLoadingFactor(false);
    })();
  }, []);

  const verifyCode = async () => {
    if (!factorId || code.length < 6) return;
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setLoading(false);
    if (err) { setError('קוד שגוי — נסי שוב'); return; }
    onVerified();
  };

  const verifyBackupCode = async () => {
    if (!backupCode.trim()) return;
    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/mfa-recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ code: backupCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'שגיאה'); setLoading(false); return; }
      alert(data.message || 'האימות הדו-שלבי הוסר. מתחברת מחדש...');
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-violet-400 transition-all text-slate-700 bg-white text-center text-lg tracking-widest";

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center animate-slide-in-up space-y-4">
        <div className="text-3xl">🔐</div>
        <h2 className="font-bold text-slate-800 text-lg">אימות דו-שלבי</h2>

        {loadingFactor ? (
          <p className="text-sm text-slate-400">טוענת...</p>
        ) : mode === 'code' ? (
          <>
            <p className="text-sm text-slate-500">הזיני את הקוד בן 6 הספרות מאפליקציית האימות שלך</p>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyCode()} placeholder="000000" dir="ltr" autoFocus
              className={inputClass} />
            {error && <p className="text-rose-500 text-sm font-semibold">{error}</p>}
            <button onClick={verifyCode} disabled={loading || code.length < 6}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">
              {loading ? 'בודקת...' : 'אימות ✓'}
            </button>
            <button onClick={() => { setMode('backup'); setError(''); }} className="text-sm text-slate-400 hover:text-violet-500">
              איבדתי את הטלפון — קוד גיבוי
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500">הזיני אחד מ-10 קודי הגיבוי שקיבלת כשהפעלת 2FA. שימוש בקוד גיבוי <b>יסיר את האימות הדו-שלבי</b> מהחשבון — תוכלי להפעיל אותו מחדש אחר כך מהגדרות.</p>
            <input value={backupCode} onChange={e => setBackupCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && verifyBackupCode()} placeholder="XXXX-XXXX" dir="ltr" autoFocus
              className={inputClass} />
            {error && <p className="text-rose-500 text-sm font-semibold">{error}</p>}
            <button onClick={verifyBackupCode} disabled={loading || !backupCode.trim()}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">
              {loading ? 'מאמתת...' : 'שחזור גישה'}
            </button>
            <button onClick={() => { setMode('code'); setError(''); }} className="text-sm text-slate-400 hover:text-violet-500">
              ← יש לי את הטלפון, חזרה לקוד רגיל
            </button>
          </>
        )}

        <button onClick={() => supabase.auth.signOut()} className="text-xs text-slate-300 hover:text-slate-500 block mx-auto pt-2">
          התנתקות
        </button>
      </div>
    </div>
  );
}
