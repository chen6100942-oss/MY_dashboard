import React, { useState } from 'react';

const supabase = window.supabase;

const LoginScreen = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const signInWithGoogle = async () => {
        setLoading(true); setError('');
        try {
            const { error: err } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: 'https://chen6100942-oss.github.io/MY_dashboard/' }
            });
            if (err) throw err;
        }
        catch (err) { setError('שגיאה בהתחברות: ' + (err.message || 'נסי שוב.')); setLoading(false); }
    };
    return (
        <div className="min-h-screen soft-bg flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8 text-center animate-slide-in-up">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center"><span className="text-3xl">✨</span></div>
                <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 gradient-text">מרכז הבקרה של חיי</h1>
                <p className="text-slate-500 mb-8">התחברי כדי להתחיל לעבוד על היעדים שלך</p>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
                <button onClick={signInWithGoogle} disabled={loading} className="w-full px-6 py-3.5 bg-white border-2 border-slate-200 hover:border-violet-400 rounded-xl font-bold text-slate-700 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50">
                    {loading ? <span>מתחבר...</span> : (<><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg><span>התחברות עם Google</span></>)}
                </button>
                <p className="mt-6 text-xs text-slate-400">🔒 הנתונים שלך מאובטחים ופרטיים לחלוטין</p>
            </div>
        </div>
    );
};

export default LoginScreen;
