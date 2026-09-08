import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const LoginScreen = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'recovery'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setMode('recovery');
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true); setError('');
        const { error: err } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (err) { setError(err.message); setLoading(false); }
        // בהצלחה — הדפדפן מנותב ל-Google ואז חזרה, אין צורך לכבות loading כאן
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) setError('מייל או סיסמה שגויים — נסי שנית.');
        setLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setMessage('');
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) setError(err.message);
        else setMessage('נרשמת בהצלחה! אם נדרש אישור מייל — בדקי את תיבת הדואר, אחרת אפשר להתחבר עכשיו.');
        setLoading(false);
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (err) setError(err.message);
        else setMessage('נשלח מייל לאיפוס סיסמה! בדקי את תיבת הדואר שלך 📬');
        setLoading(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        const { error: err } = await supabase.auth.updateUser({ password: newPassword });
        if (err) setError(err.message);
        else setMessage('הסיסמה עודכנה בהצלחה! מתחברת...');
        setLoading(false);
    };

    const inputClass = "w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-violet-400 transition-all text-slate-700 bg-white";

    return (
        <div className="min-h-screen soft-bg flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8 text-center animate-slide-in-up">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                    <span className="text-3xl">✨</span>
                </div>
                <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 gradient-text">
                    Design Your Life
                </h1>

                {(mode === 'login' || mode === 'signup') && (
                    <div className="mt-6 space-y-3">
                        <button type="button" onClick={handleGoogleLogin} disabled={loading}
                            className="w-full py-3 flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-semibold text-sm text-slate-700 transition-all disabled:opacity-50">
                            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                            המשך עם Google
                        </button>
                        <div className="flex items-center gap-3 text-xs text-slate-300">
                            <div className="flex-1 h-px bg-slate-200" /><span>או</span><div className="flex-1 h-px bg-slate-200" />
                        </div>
                    </div>
                )}

                {mode === 'recovery' && (
                    <form onSubmit={handleUpdatePassword} className="space-y-4 mt-6 text-right">
                        <p className="text-slate-500 text-sm">הגדירי סיסמה חדשה</p>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            placeholder="סיסמה חדשה (לפחות 6 תווים)" required minLength={6} className={inputClass} dir="ltr" />
                        {error && <p className="text-rose-500 text-sm">{error}</p>}
                        {message && <p className="text-emerald-600 text-sm font-semibold">{message}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                            {loading ? 'מעדכן...' : 'עדכן סיסמה ✓'}
                        </button>
                    </form>
                )}

                {mode === 'forgot' && (
                    <form onSubmit={handleForgot} className="space-y-4 mt-6 text-right">
                        <p className="text-slate-500 text-sm">הזיני את המייל שלך ונשלח קישור לאיפוס</p>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="כתובת מייל" required className={inputClass} dir="ltr" />
                        {error && <p className="text-rose-500 text-sm">{error}</p>}
                        {message && <p className="text-emerald-600 text-sm font-semibold">{message}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                            {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
                        </button>
                        <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                            className="w-full py-2 text-slate-400 hover:text-violet-500 text-sm transition-all">
                            ← חזרה להתחברות
                        </button>
                    </form>
                )}

                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4 mt-6 text-right">
                        <p className="text-slate-500 text-sm mb-2">גישה לחשבון שלך</p>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="כתובת מייל" required className={inputClass} dir="ltr" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="סיסמה" required className={inputClass} dir="ltr" />
                        {error && <p className="text-rose-500 text-sm font-semibold">{error}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                            {loading ? 'מתחברת...' : 'התחברות ✨'}
                        </button>
                        <div className="flex items-center justify-between">
                            <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                                className="text-slate-400 hover:text-violet-500 text-sm transition-all">
                                שכחתי סיסמה
                            </button>
                            <button type="button" onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                                className="text-slate-400 hover:text-violet-500 text-sm transition-all">
                                יצירת חשבון חדש
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'signup' && (
                    <form onSubmit={handleSignup} className="space-y-4 mt-6 text-right">
                        <p className="text-slate-500 text-sm mb-2">יצירת חשבון חדש</p>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="כתובת מייל" required className={inputClass} dir="ltr" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="סיסמה (לפחות 6 תווים)" required minLength={6} className={inputClass} dir="ltr" />
                        {error && <p className="text-rose-500 text-sm font-semibold">{error}</p>}
                        {message && <p className="text-emerald-600 text-sm font-semibold">{message}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                            {loading ? 'יוצרת חשבון...' : 'יצירת חשבון ✨'}
                        </button>
                        <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                            className="w-full py-2 text-slate-400 hover:text-violet-500 text-sm transition-all">
                            ← חזרה להתחברות
                        </button>
                    </form>
                )}

                <p className="mt-8 text-xs text-slate-400">🔒 הנתונים שלך מאובטחים ופרטיים לחלוטין</p>
            </div>
        </div>
    );
};

export default LoginScreen;
