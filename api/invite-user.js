import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

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

    if (!SERVICE_ROLE_KEY || !SUPABASE_URL || !ANON_KEY) {
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
    const { email } = body || {};
    if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Invalid email address' });
        return;
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
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    // Send invite using Supabase admin client with service role key
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: WebSocket },
    });

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://my-dashboard-fawn-tau.vercel.app',
    });

    if (inviteError) {
        console.log('Invite error:', inviteError.message);
        res.status(400).json({ error: inviteError.message });
        return;
    }

    res.status(200).json({ success: true, message: `הזמנה נשלחה ל-${email} ✉️` });
};
