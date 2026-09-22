import React, { useMemo } from 'react';
import { fmtILS } from '../lib/mockCreditData.js';
import { accountBalance, isLiability } from '../lib/realCreditData.js';
import { realLiabilitiesTotal } from '../lib/realOverviewData.js';

// "נכסים ושווי נקי" אמיתי: תמונת מאקרו של מצב פיננסי. רק חסכונות/נכסים כאן (בירוק) -
// לא התחייבויות, אלה נמצאות ב"הלוואות ומשכנתא". שווי נקי בסוף כולל את שתי הצדדים.
// נכסים ידניים (דירה להשקעה, רכב, חסכונות שאין ל-Financy דרך לדעת עליהם) נשמרים
// באותה טבלת finance_funds הקיימת כבר בטאב הידני - אין קוד/מסד נתונים כפול.
export default function RealAssetsDashboard({ accounts, funds, addFund, updateFund, commitFund, removeFund }) {
  const realAssetAccounts = useMemo(() => (accounts || []).filter(a => !isLiability(a) && a.accountType !== 'LOAN'), [accounts]);
  const realAssetsTotal = realAssetAccounts.reduce((s, a) => s + accountBalance(a), 0);
  const manualAssetsTotal = (funds || []).reduce((s, f) => s + (Number(f.current_value) || 0), 0);
  const totalAssets = realAssetsTotal + manualAssetsTotal;
  const totalLiabilities = useMemo(() => realLiabilitiesTotal(accounts), [accounts]);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-4">
      <div className="card p-5 text-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
        <div className={`text-3xl font-extrabold ${netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtILS(netWorth)}</div>
        <div className="text-sm text-slate-500 mt-1">שווי נקי (כל הנכסים פחות כל ההתחייבויות)</div>
        <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-emerald-100 text-xs text-slate-500">
          <span>סה"כ נכסים: <b className="text-emerald-600">{fmtILS(totalAssets)}</b></span>
          <span>סה"כ התחייבויות: <b className="text-rose-500">{fmtILS(totalLiabilities)}</b></span>
        </div>
      </div>

      {realAssetAccounts.length > 0 && (
        <div className="card overflow-hidden border-t-[3px] border-emerald-200">
          <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#10b981' }}>
            <span className="text-white font-bold text-sm">חשבונות מחוברים (עו"ש, ניירות ערך)</span>
            <span className="text-white font-bold text-sm">{fmtILS(realAssetsTotal)}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {realAssetAccounts.map((a, i) => (
              <div key={a.id || i} className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 text-sm">
                <span className="text-slate-700">{a.accountName || a.product || a.providerId}</span>
                <span className="font-bold text-emerald-700" dir="ltr">{fmtILS(accountBalance(a))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden border-t-[3px] border-emerald-200">
        <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#10b981' }}>
          <span className="text-white font-bold text-sm">נכסים וחסכונות נוספים (הזנה ידנית)</span>
          <span className="text-white font-bold text-sm">{fmtILS(manualAssetsTotal)}</span>
        </div>
        <div className="grid grid-cols-[1fr_110px_110px_90px_28px] gap-2 px-4 py-2 bg-slate-100 text-[11px] font-bold text-slate-500">
          <span>נכס</span><span>שווי מוערך</span><span>הכנסה חודשית</span><span>תשואה שנתית</span><span></span>
        </div>
        <div className="divide-y divide-slate-100">
          {(funds || []).map(f => {
            const yieldPct = f.current_value > 0 && f.monthly_income > 0 ? ((f.monthly_income * 12) / f.current_value) * 100 : null;
            return (
              <div key={f.id} className="grid grid-cols-[1fr_110px_110px_90px_28px] gap-2 items-center px-4 py-2 bg-emerald-50">
                <input value={f.fund_name} onChange={e => updateFund(f.id, { fund_name: e.target.value })} onBlur={() => commitFund(f.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm bg-white" />
                <input type="number" value={f.current_value || ''} placeholder="0" onChange={e => updateFund(f.id, { current_value: Number(e.target.value) || 0 })} onBlur={() => commitFund(f.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm bg-white" dir="ltr" />
                <input type="number" value={f.monthly_income || ''} placeholder="0" onChange={e => updateFund(f.id, { monthly_income: Number(e.target.value) || 0 })} onBlur={() => commitFund(f.id)} className="px-2 py-1 rounded-lg border border-slate-200 outline-none text-sm bg-white" dir="ltr" />
                <span className="text-xs font-bold text-emerald-700 text-center">{yieldPct !== null ? `${yieldPct.toFixed(1)}%` : '—'}</span>
                <button onClick={() => removeFund(f.id)} className="text-rose-400 hover:text-rose-600">×</button>
              </div>
            );
          })}
          {!funds?.length && <p className="px-4 py-6 text-center text-sm text-slate-400">עוד לא הוספת נכסים ידנית</p>}
        </div>
        <button onClick={addFund} className="w-full py-2 text-xs text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">+ הוספת נכס/חיסכון</button>
        <p className="text-[10px] text-slate-400 px-4 pb-3">"הכנסה חודשית" רלוונטי לנכס כמו דירה להשכרה — הזיני שכירות חודשית כדי לראות תשואה שנתית משוערת. אפשר להשאיר 0 לנכסים בלי הכנסה שוטפת.</p>
      </div>
    </div>
  );
}
