const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

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

    // Verify caller is admin using their JWT + anon key (RLS enforced)
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${callerJwt}` } },
        realtime: { transport: WebSocket },
    });

    const { data: profiles, error: profileError } = await callerClient
        .from('profiles')
        .select('role')
        .limit(1);

    if (profileError || !profiles || !profiles[0] || profiles[0].role !== 'admin') {
        console.log('Admin check failed:', profileError?.message, profiles);
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) };
    }

    // Send invite using Supabase admin client with service role key
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: WebSocket },
    });

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://inside-out-byhenzerah.netlify.app',
    });

    if (inviteError) {
        console.log('Invite error:', inviteError.message);
        return { statusCode: 400, headers, body: JSON.stringify({ error: inviteError.message }) };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: `הזמנה נשלחה ל-${email} ✉️` }),
    };
};
