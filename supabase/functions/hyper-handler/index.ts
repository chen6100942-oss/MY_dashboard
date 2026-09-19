import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const OAUTH_URL = 'https://api.open-finance.ai/oauth/token';
const DATA_BASE = 'https://api.open-finance.ai/v2/data';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
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
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
