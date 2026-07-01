import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const LoginScreen = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'recovery'
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) setError('מייל או סיסמה שגויים — נסי שנית.');
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
                    מרכז הבקרה של חיי
                </h1>

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
                        <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                            className="text-slate-400 hover:text-violet-500 text-sm transition-all">
                            שכחתי סיסמה
                        </button>
                    </form>
                )}

                <p className="mt-8 text-xs text-slate-400">🔒 הנתונים שלך מאובטחים ופרטיים לחלוטין</p>
            </div>
        </div>
    );
};

export default LoginScreen;
