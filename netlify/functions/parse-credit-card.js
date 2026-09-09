const { createClient } = require('@supabase/supabase-js');

// Reads a credit-card statement PDF and returns a structured breakdown per
// card: description, monthly installment amount, installments remaining out
// of total, and the full charge amount. The caller must be a logged-in
// Supabase user (verified via their JWT) so this can't be hit anonymously.
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
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!SUPABASE_URL || !ANON_KEY || !ANTHROPIC_API_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration — missing env vars (need ANTHROPIC_API_KEY)' }) };
    }

    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const callerJwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!callerJwt) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized — no token' }) };
    }

    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { data: userData, error: authError } = await supabase.auth.getUser(callerJwt);
    if (authError || !userData?.user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized — invalid session' }) };
    }

    let pdfBase64;
    try {
        ({ pdfBase64 } = JSON.parse(event.body || '{}'));
    } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }
    if (!pdfBase64) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing pdfBase64' }) };
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
            return { statusCode: 502, headers, body: JSON.stringify({ error: `AI service error: ${errText.slice(0, 300)}` }) };
        }

        const result = await resp.json();
        const raw = (result.content || []).map(b => b.text || '').join('').trim();
        const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            return { statusCode: 502, headers, body: JSON.stringify({ error: 'לא הצלחתי לפענח את תשובת ה-AI כ-JSON תקין', raw: cleaned.slice(0, 500) }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
