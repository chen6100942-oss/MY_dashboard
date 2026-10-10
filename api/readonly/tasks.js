import { createClient } from '@supabase/supabase-js';

// Read-only endpoint for the Instinct WhatsApp assistant. Auth is a long
// opaque bearer token (not a Supabase user session) — see
// supabase-instinct-readonly.sql for how it's issued, hashed, and checked.
// GET only; no write path exists under /api/readonly/* at all. Uses the
// project's anon key only — service_role is never touched here, the actual
// data scoping happens inside the security-definer SQL function.
export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !ANON_KEY) {
        res.status(500).json({ error: 'Server misconfiguration' });
        return;
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { status, due_before, limit } = req.query || {};
    if (status !== undefined && status !== 'open' && status !== 'done') {
        res.status(400).json({ error: 'status must be "open" or "done"' });
        return;
    }

    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await supabase.rpc('instinct_get_tasks', {
        token_plain: token,
        status_filter: status || null,
        due_before: due_before || null,
        limit_n: limit ? Number(limit) : 100,
    });

    if (error) {
        const msg = error.message || '';
        if (msg.includes('unauthorized')) { res.status(401).json({ error: 'Unauthorized' }); return; }
        if (msg.includes('forbidden')) { res.status(403).json({ error: 'Forbidden' }); return; }
        if (msg.includes('rate_limited')) { res.status(429).json({ error: 'Too Many Requests' }); return; }
        res.status(500).json({ error: 'Internal error' });
        return;
    }

    res.status(200).json(data);
};
