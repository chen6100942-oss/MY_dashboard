exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SERVICE_ROLE_KEY || !SUPABASE_URL || !ANON_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration — missing env vars' }) };
    }

    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const callerJwt = authHeader.replace(/^Bearer\s+/i, '');

    if (!callerJwt) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized — no token' }) };
    }

    let email;
    try {
        ({ email } = JSON.parse(event.body || '{}'));
    } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!email || !email.includes('@')) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email address' }) };
    }

    // Verify caller is admin — use anon key + caller JWT so RLS lets them read only their own profile
    const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=role&limit=1`,
        {
            headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${callerJwt}`,
                'Accept': 'application/json',
            },
        }
    );

    if (!profileRes.ok) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Could not verify admin status' }) };
    }

    const profiles = await profileRes.json();
    if (!Array.isArray(profiles) || !profiles[0] || profiles[0].role !== 'admin') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) };
    }

    // Send invite via Supabase Admin API
    const inviteRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/invite`,
        {
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        }
    );

    const rawText = await inviteRes.text();
    console.log('Invite API response:', inviteRes.status, rawText.substring(0, 200));

    if (!inviteRes.ok) {
        let msg = 'שגיאה בשליחת ההזמנה';
        try {
            const parsed = JSON.parse(rawText);
            msg = parsed.msg || parsed.message || parsed.error_description || parsed.error || msg;
        } catch {}
        return { statusCode: inviteRes.status, headers, body: JSON.stringify({ error: msg }) };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: `הזמנה נשלחה ל-${email} ✉️` }),
    };
};
