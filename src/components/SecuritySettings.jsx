import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// 2FA (TOTP) enrollment and management. Lives in Settings. Disabling an
// active factor requires an aal2 session — which she already has if 2FA is
// on, since MfaChallenge (see App.jsx) blocks the dashboard until she's
// passed the challenge for this session.
export default function SecuritySettings({ user }) {
  const [loading, setLoading] = useState(true);
  const [activeFactor, setActiveFactor] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [savedAck, setSavedAck] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [unusedBackupCount, setUnusedBackupCount] = useState(null);

  const refreshFactors = async () => {
    const { data, error: err } = await supabase.auth.mfa.listFactors();
    if (err) { setError(err.message); setLoading(false); return; }
    const verified = (data?.totp || []).find(f => f.status === 'verified');
    setActiveFactor(verified || null);
    setLoading(false);
    if (verified) {
      const { data: count } = await supabase.rpc('count_unused_mfa_backup_codes');
      setUnusedBackupCount(typeof count === 'number' ? count : null);
    }
  };

  useEffect(() => { refreshFactors(); }, []);

  const startEnroll = async () => {
    setError(''); setBusy(true);
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(true);
  };

  const confirmEnroll = async () => {
    if (verifyCodeInput.length < 6) return;
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: verifyCodeInput });
    if (err) { setBusy(false); setError('קוד שגוי — נסי שוב'); return; }
    const { data: codes, error: codesErr } = await supabase.rpc('generate_mfa_backup_codes');
    setBusy(false);
    if (codesErr) { setError(codesErr.message); return; }
    setBackupCodes(codes || []);
    setEnrolling(false);
    setVerifyCodeInput('');
    await refreshFactors();
  };

  const disable2FA = async () => {
    if (!window.confirm('לבטל אימות דו-שלבי? החשבון שלך יהיה מוגן רק בסיסמה.')) return;
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId: activeFactor.id });
    setBusy(false);
    if (err) { setError(err.message); return; }
    await refreshFactors();
  };

  const regenerateBackupCodes = async () => {
    if (!window.confirm('ליצור קודי גיבוי חדשים? הקודים הישנים יפסיקו לעבוד.')) return;
    setBusy(true); setError('');
    const { data: codes, error: err } = await supabase.rpc('generate_mfa_backup_codes');
    setBusy(false);
    if (err) { setError(err.message); return; }
    setBackupCodes(codes || []);
    setSavedAck(false);
    setUnusedBackupCount(codes?.length || 0);
  };

  if (loading) return <div className="card p-6 text-center text-sm text-slate-400">טוענת...</div>;

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-4 border-t-[3px] border-violet-400">
        <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">🔐 אימות דו-שלבי (2FA)</h3>

        {backupCodes ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-emerald-700">✓ 2FA הופעל בהצלחה!</p>
            <p className="text-xs text-slate-500">שמרי את 10 קודי הגיבוי האלה במקום בטוח (לא בתמונה בטלפון שנעול באותו מכשיר...). כל קוד ניתן לשימוש פעם אחת, במקרה שתאבדי גישה לאפליקציית האימות.</p>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-4 font-mono text-sm" dir="ltr">
              {backupCodes.map(c => <div key={c} className="text-center">{c}</div>)}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={savedAck} onChange={e => setSavedAck(e.target.checked)} />
              שמרתי את הקודים במקום בטוח
            </label>
            <button disabled={!savedAck} onClick={() => setBackupCodes(null)}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm disabled:opacity-40">
              סיימתי
            </button>
          </div>
        ) : enrolling ? (
          <div className="space-y-3 text-center">
            <p className="text-xs text-slate-500">סרקי את קוד ה-QR עם אפליקציית אימות (Google Authenticator / Authy), או הזיני את הקוד הידני</p>
            {qrCode && <img src={qrCode} alt="QR" className="mx-auto w-40 h-40" />}
            {secret && <p className="font-mono text-xs text-slate-400 break-all" dir="ltr">{secret}</p>}
            <input value={verifyCodeInput} onChange={e => setVerifyCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && confirmEnroll()} placeholder="קוד בן 6 ספרות" dir="ltr"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none text-center text-lg tracking-widest" autoFocus />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={confirmEnroll} disabled={busy || verifyCodeInput.length < 6} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm disabled:opacity-40">אישור והפעלה</button>
              <button onClick={() => { setEnrolling(false); setError(''); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm">ביטול</button>
            </div>
          </div>
        ) : activeFactor ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700 font-semibold">✓ אימות דו-שלבי פעיל</p>
            {unusedBackupCount !== null && <p className="text-xs text-slate-500">{unusedBackupCount} קודי גיבוי לא-מנוצלים נותרו</p>}
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <div className="flex gap-2 flex-wrap">
              <button onClick={regenerateBackupCodes} disabled={busy} className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-bold transition-all">יצירת קודי גיבוי חדשים</button>
              <button onClick={disable2FA} disabled={busy} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all">כיבוי 2FA</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">מוסיף שכבת הגנה נוספת: בכל כניסה, בנוסף לסיסמה, תתבקשי קוד בן 6 ספרות מאפליקציית אימות בטלפון.</p>
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button onClick={startEnroll} disabled={busy} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm disabled:opacity-40">הפעלת אימות דו-שלבי</button>
          </div>
        )}
      </div>
    </div>
  );
}
