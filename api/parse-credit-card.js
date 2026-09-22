import { createClient } from '@supabase/supabase-js';

// Reads a credit-card statement PDF and returns a structured breakdown per
// card: description, monthly installment amount, installments remaining out
// of total, and the full charge amount. The caller must be a logged-in
// Supabase user (verified via their JWT) so this can't be hit anonymously.
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
    const { pdfBase64 } = body || {};
    if (!pdfBase64) {
        res.status(400).json({ error: 'Missing pdfBase64' });
        return;
    }

    const CATEGORIES = ['דלק', 'ביטוחים', 'סופר/קניות', 'בריאות', 'בילויים ומסעדות', 'ביגוד', 'תחבורה ורכב', 'חינוך', 'מנויים ותקשורת', 'שונות'];

    const schemaPrompt = `את קוראת דף/י פירוט חיוב של כרטיס/י אשראי (PDF, עברית). \
החזירי אך ורק JSON תקין (בלי טקסט נוסף, בלי markdown fences) במבנה הבא:
{
  "cards": [
    {
      "card_name": "שם הכרטיס כפי שמופיע במסמך, כולל 4 ספרות אחרונות אם יש",
      "items": [
        {
          "description": "תיאור העסקה/העמדה",
          "category": "אחת מהרשימה: ${CATEGORIES.join(', ')}",
          "monthly_amount": 0,
          "installments_remaining": 1,
          "installments_total": 1,
          "full_amount": 0
        }
      ]
    }
  ]
}
סיווגי כל עסקה לתחום המתאים ביותר מהרשימה הסגורה שלמעלה (לפי שם בית העסק) — אם אין התאמה ברורה, שימי "שונות". \
אם עסקה היא תשלום בודד (לא תשלומים), installments_remaining=1 ו-installments_total=1 ו-full_amount=monthly_amount. \
אם לא ברור שדה מסוים, שימי 0 או 1 לפי ההקשר — אל תמציאי נתונים, ואל תדלגי על עסקאות.`;

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
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
                        { type: 'text', text: schemaPrompt },
                    ],
                }],
            }),
        });

        if (!resp.ok) {
            const errText = await resp.text();
            res.status(502).json({ error: `AI service error: ${errText.slice(0, 300)}` });
            return;
        }

        const result = await resp.json();
        const raw = (result.content || []).map(b => b.text || '').join('').trim();
        const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            res.status(502).json({ error: 'לא הצלחתי לפענח את תשובת ה-AI כ-JSON תקין', raw: cleaned.slice(0, 500) });
            return;
        }

        res.status(200).json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
