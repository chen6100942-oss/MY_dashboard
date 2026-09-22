import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OAUTH_URL = 'https://api.open-finance.ai/oauth/token';
const DATA_BASE = 'https://api.open-finance.ai/v2/data';

// רשימת מקורות מותרים בלבד - לא '*'. הפונקציה הזו מחזירה נתונים פיננסיים אמיתיים
// (יתרות, מספרי חשבון, שם בעלים) ואסור שדפדפן מכל אתר אחר יוכל לקרוא לה.
const ALLOWED_ORIGINS = [
  'https://my-dashboard-fawn-tau.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
];
function corsHeadersFor(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}

async function getAccessToken() {
  const clientId = Deno.env.get('FINANCY_CLIENT_ID');
  const clientSecret = Deno.env.get('FINANCY_CLIENT_SECRET');
  const userId = Deno.env.get('FINANCY_USER_ID');
  if (!clientId || !clientSecret || !userId) {
    throw new Error('חסרים סודות: FINANCY_CLIENT_ID / FINANCY_CLIENT_SECRET / FINANCY_USER_ID');
  }
  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userId }),
  });
  if (!res.ok) throw new Error(`כשל בקבלת טוקן: ${res.status}`);
  const json = await res.json();
  return json.accessToken || json.access_token || json.token;
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // אימות: חובה session תקף של Supabase, וחובה שהמשתמש יהיה admin (החשבון האישי היחיד
  // שאמור לראות את נתוני הבנק האלה - הם משותפים לכל מי שקורא לפונקציה, לא מסוננים
  // לפי משתמש, כך שגישה של "כל מי שמחובר" עדיין הייתה חושפת אותם לכל מי שנרשם לאתר).
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { resource = 'transactions', type, dateFrom, dateTo, sort, nextPage, accountId, includeDuplicates } = await req.json().catch(() => ({}));
    if (resource !== 'transactions' && resource !== 'accounts') {
      return new Response(JSON.stringify({ error: `resource לא מוכר: ${resource}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // dateFrom/dateTo ו-limit הם mutually exclusive ב-API - אם ביקשו טווח תאריכים, לא שולחים limit בכלל.
    const params = new URLSearchParams();
    if (dateFrom || dateTo) {
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
    } else {
      params.set('limit', '100');
    }
    if (type) params.set('type', type);
    if (sort) params.set('sort', String(sort));
    if (nextPage) params.set('nextPage', nextPage);
    if (accountId) params.set('accountId', accountId);
    if (includeDuplicates !== undefined) params.set('includeDuplicates', String(includeDuplicates));
    const url = `${DATA_BASE}/${resource}?${params.toString()}`;

    const token = await getAccessToken();
    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await upstream.json();

    return new Response(JSON.stringify(data), { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    // לא מחזירים את פרטי השגיאה הפנימיים ללקוח (יכולים לחשוף מבנה פנימי/סודות בטעות) - רק ללוג של הפונקציה.
    console.error('hyper-handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
