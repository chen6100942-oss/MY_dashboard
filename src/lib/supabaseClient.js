import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const readAuthCallbackType = () => {
    if (typeof window === 'undefined') return '';
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    return hash.get('type') || query.get('type') || '';
};

export const authCallbackType = readAuthCallbackType();

// An invite/recovery link opens an authenticated Supabase session. Clear any
// cached dashboard data before Supabase processes that link so a newly invited
// user can never inherit the previous user's browser data.
if (typeof window !== 'undefined' && ['invite', 'recovery'].includes(authCallbackType)) {
    localStorage.clear();
    sessionStorage.setItem('auth_password_setup_pending', authCallbackType);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
