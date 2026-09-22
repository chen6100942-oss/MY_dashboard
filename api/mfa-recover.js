import { createClient } from '@supabase/supabase-js';

// Account recovery when a user has 2FA enabled but lost access to their
// authenticator app. Redeems a one-time backup code (server-side, via the
// redeem_mfa_backup_code RPC — the code's hash never leaves Postgres), and
// on success removes the user's TOTP factor(s) using the service-role Admin
// API so she can log in again without a code and re-enroll a fresh one.
// The caller only needs an aal1 session (a normal password login) — that's
// the whole point: she can't reach aal2 without the device she lost.
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
        res.status(500).json({ error: 'Server misconfiguration — missing env vars' });
        return;
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const callerJwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!callerJwt) {
        res.status(401).json({ error: 'Unauthorized — no token' });
        return;
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { res.status(400).json({ error: 'Invalid JSON body' }); return; }
    }
    const { code } = body || {};
    if (!code || !String(code).trim()) {
        res.status(400).json({ error: 'Missing code' });
        return;
    }

    // Client acting AS the caller (their own JWT) — auth.uid() inside the RPC
    // resolves to them, and RLS/ownership stays exactly as tight as normal use.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${callerJwt}` } },
    });

    const { data: userData, error: authError } = await callerClient.auth.getUser(callerJwt);
    if (authError || !userData?.user) {
        res.status(401).json({ error: 'Unauthorized — invalid session' });
        return;
    }
    const userId = userData.user.id;

    const { data: redeemed, error: rpcError } = await callerClient.rpc('redeem_mfa_backup_code', { candidate_code: String(code).trim() });
    if (rpcError) {
        res.status(500).json({ error: rpcError.message });
        return;
    }
    if (!redeemed) {
        res.status(400).json({ error: 'קוד גיבוי שגוי או שכבר נוצל' });
        return;
    }

    // Redeemed successfully — now remove her TOTP factor(s) with the admin
    // client. This bypasses the normal aal2-to-unenroll requirement, which
    // is exactly why it has to happen server-side with the service role key.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
        const { data: userRecord, error: getUserError } = await adminClient.auth.admin.getUserById(userId);
        if (getUserError) throw getUserError;
        const factors = userRecord?.user?.factors || [];
        for (const factor of factors) {
            if (factor.factor_type === 'totp') {
                await adminClient.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
            }
        }
    } catch (err) {
        res.status(500).json({ error: `הקוד אושר אך הסרת האימות הדו-שלבי נכשלה: ${err.message}` });
        return;
    }

    res.status(200).json({ success: true, message: 'האימות הדו-שלבי הוסר מהחשבון. אפשר להתחבר עכשיו בלי קוד — מומלץ להפעיל 2FA מחדש בהקדם.' });
}
