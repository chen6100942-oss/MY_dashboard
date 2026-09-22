const { createClient } = require('@supabase/supabase-js');

// Answers a free-text question about the caller's own financial data, scoped to
// categories the client already matched against the question — the client sends
// only the relevant slice, not the full financial history. The caller must be a
// logged-in Supabase user (verified via their JWT) so this can't be hit anonymously.
module.exports = async (req, res) => {
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
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!SUPABASE_URL || !ANON_KEY || !ANTHROPIC_API_KEY) {
        res.status(500).json({ error: 'Server misconfiguration — missing env vars (need ANTHROPIC_API_KEY)' });
        return;
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const callerJwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!callerJwt) {
        res.status(401).json({ error: 'Unauthorized — no token' });
        return;
    }

    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { data: userData, error: authError } = await supabase.auth.getUser(callerJwt);
    if (authError || !userData?.user) {
        res.status(401).json({ error: 'Unauthorized — invalid session' });
        return;
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { res.status(400).json({ error: 'Invalid JSON body' }); return; }
    }
    const { question, categories, entries, cards } = body || {};
    if (!question || !String(question).trim()) {
        res.status(400).json({ error: 'Missing question' });
        return;
    }
    if (!Array.isArray(categories) || categories.length === 0) {
        res.status(400).json({ error: 'Missing categories — question must be scoped to at least one category' });
        return;
    }

    const prompt = `את עוזרת פיננסית אישית. עני על השאלה של המשתמשת אך ורק לפי הנתונים שסופקו למטה — אל תמציאי מספרים או פריטים שלא מופיעים בהם. \
אם הנתונים שסופקו לא מספיקים כדי לענות, אמרי זאת בפירוש במקום לנחש. עני בעברית, בקצרה ובפורמט רשימה כשמתאים.

קטגוריות שהשאלה עוסקת בהן: ${categories.join(', ')}

תנועות הכנסה/הוצאה רלוונטיות (JSON):
${JSON.stringify(entries || [], null, 2)}

פריטי כרטיס אשראי רלוונטיים (JSON):
${JSON.stringify(cards || [], null, 2)}

השאלה: ${question}`;

    try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-5',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!resp.ok) {
            const errText = await resp.text();
            res.status(502).json({ error: `AI service error: ${errText.slice(0, 300)}` });
            return;
        }

        const result = await resp.json();
        const answer = (result.content || []).map(b => b.text || '').join('').trim();
        res.status(200).json({ answer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
