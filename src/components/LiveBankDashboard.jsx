import React, { useState, useEffect, useCallback } from 'react';
import Icon from './Icon.jsx';
import { supabase } from '../lib/supabaseClient.js';
import CreditDashboard from './CreditDashboard.jsx';
import RealOverviewDashboard from './RealOverviewDashboard.jsx';
import RealCashflowDashboard from './RealCashflowDashboard.jsx';
import RealLoansDashboard from './RealLoansDashboard.jsx';
import RealAssetsDashboard from './RealAssetsDashboard.jsx';
import RealGoalsDashboard from './RealGoalsDashboard.jsx';
import { unwrapAmount, accountBalance, isLiability } from '../lib/realCreditData.js';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

// Special categories that don't live in the regular income/expense lists —
// picking one of these forces a specific finance_entries `type` regardless
// of which list it would otherwise match.
const LOAN_CATEGORY = 'הורדת משכנתא';

// ── ניווט חודשי לעסקאות שנמשכות מ-Financy (אותו עיקרון כמו ב"כרטיסי אשראי") ──
const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const pad = n => String(n).padStart(2, '0');
const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const monthLabel = key => { const [y, m] = key.split('-').map(Number); return `${HE_MONTHS[m - 1]} ${y}`; };
const shiftMonth = (key, delta) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + delta, 1); return monthKey(d); };

// Displays live, read-only bank/credit-card data pulled through the
// financy-proxy Supabase Edge Function (see supabase/functions/financy-proxy),
// and lets each real transaction be filed straight into the "תזרים חודשי"
// (monthly cash flow) table (finance_entries) with one click.
export default function LiveBankDashboard({ user, incomeCategories = [], expenseCategories = [], onImported, funds, addFund, updateFund, commitFund, removeFund, goals, addGoal, updateGoal, commitGoal, removeGoal }) {
  const [accounts, setAccounts] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryDraft, setCategoryDraft] = useState({});
  const [assigned, setAssigned] = useState({});
  const [savingId, setSavingId] = useState('');
  const [expandedCard, setExpandedCard] = useState('');
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [subView, setSubView] = useState('overview'); // overview | credit

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // טווח תאריכים מפורש (13 חודשים אחרונים) במקום הגבלת limit=100 המוגבלת ל"ישנות ביותר" -
      // ר' תיקון ב-supabase/functions/hyper-handler/index.ts שמוסיף תמיכה ב-dateFrom/dateTo.
      const today = new Date();
      const dateTo = today.toISOString().slice(0, 10);
      const from = new Date(today.getFullYear(), today.getMonth() - 13, today.getDate());
      const dateFrom = from.toISOString().slice(0, 10);

      const [accountsRes, bankRes, cardRes] = await Promise.all([
        supabase.functions.invoke('hyper-handler', { body: { resource: 'accounts' } }),
        supabase.functions.invoke('hyper-handler', { body: { resource: 'transactions', type: 'BANK', dateFrom, dateTo, sort: -1 } }),
        supabase.functions.invoke('hyper-handler', { body: { resource: 'transactions', type: 'CARD', dateFrom, dateTo, sort: -1 } }),
      ]);
      if (accountsRes.error) throw accountsRes.error;
      if (bankRes.error) throw bankRes.error;
      if (cardRes.error) throw cardRes.error;
      // Financy's v2 API wraps every list in { items: [...], nextPage }.
      setAccounts(accountsRes.data?.items || []);
      const merged = [...(bankRes.data?.items || []), ...(cardRes.data?.items || [])];
      const dateOf = (t) => t.date?.valueDate || t.date?.bookingDate || t.date?.transactionDate || '';
      merged.sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
      setTransactions(merged);
    } catch (err) {
      // Supabase's client-side error message is generic ("non-2xx status
      // code") — the real detail from our function (and from Financy) is in
      // the response body, which we have to read separately.
      let detail = err.message || '';
      try {
        const body = await err.context?.json();
        if (body?.error) detail = body.error;
      } catch (_) { /* body wasn't JSON or already consumed */ }
      setError(detail || 'שגיאה בטעינת הנתונים מ-Financy');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accountsBalance = (accounts || []).reduce((sum, a) => sum + (isLiability(a) ? -accountBalance(a) : accountBalance(a)), 0);

  // Extra assets Financy has no way of knowing about (a home's market value,
  // etc.) — kept locally so the net-worth total can include them too.
  const [extraAssets, setExtraAssets] = useState(() => {
    try { return Number(localStorage.getItem('finance-extra-assets')) || 0; } catch { return 0; }
  });
  useEffect(() => { try { localStorage.setItem('finance-extra-assets', String(extraAssets)); } catch (_) {} }, [extraAssets]);
  const totalBalance = accountsBalance + extraAssets;

  const txLabel = (tx) => tx.description?.description || tx.merchantName || tx.financialInstrument?.name || tx.details || 'עסקה';
  const txAmount = (tx) => unwrapAmount(tx.amount?.chargedAmount ?? tx.amount?.originalAmount ?? 0);
  const txMonth = (tx) => {
    const d = tx.date?.valueDate || tx.date?.bookingDate || tx.date?.transactionDate;
    return (typeof d === 'string' && d.length >= 7) ? d.slice(0, 7) : new Date().toISOString().slice(0, 7);
  };
  // רק העסקאות של החודש הנבחר - Financy מחזיר בד"כ עסקאות אחרונות בלבד, כך שחודשים ישנים
  // עשויים לא להופיע אם Financy עצמו לא שולח אותם ב"עסקאות אחרונות" (ר' הודעת האזהרה למטה)
  const monthTransactions = (transactions || []).filter(t => txMonth(t) === month);

  // A first-pass guess so most transactions don't need manual category
  // hunting — she still confirms (or changes it) before anything is saved.
  const guessCategory = (label) => {
    const l = label || '';
    if (l.includes('משכנתא')) return LOAN_CATEGORY;
    if (l.includes('שיק') || l.includes('צ\'ק')) return 'שכר דירה';
    const allCats = [...incomeCategories, ...expenseCategories];
    return allCats.find(c => l.includes(c) || c.includes(l)) || '';
  };

  const categoryFor = (tx) => {
    if (tx.id in categoryDraft) return categoryDraft[tx.id];
    return guessCategory(txLabel(tx));
  };

  const typeForCategory = (category) => {
    if (category === LOAN_CATEGORY) return 'loan_payment';
    if (incomeCategories.includes(category)) return 'income';
    return 'expense';
  };

  const assignTransaction = async (tx) => {
    const category = categoryFor(tx);
    if (!category || !user?.uid) return;
    setSavingId(tx.id);
    const row = {
      id: uid(),
      user_id: user.uid,
      month: txMonth(tx),
      type: typeForCategory(category),
      category,
      amount: Math.abs(txAmount(tx)),
      note: txLabel(tx),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const { error: insertError } = await supabase.from('finance_entries').insert(row);
      if (insertError) throw insertError;
      setAssigned(prev => ({ ...prev, [tx.id]: category }));
      onImported?.(row);
    } catch (err) {
      setError(`שגיאה בשיוך לתזרים: ${err.message || err}`);
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Icon name="trending-up" size={16} className="text-emerald-500" />
          חשבונות מחוברים (Financy — קריאה בלבד)
        </h3>
        <button onClick={load} disabled={loading} className="text-xs font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-50 flex items-center gap-1">
          <Icon name="undo" size={13} /> רענון
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setSubView('overview')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${subView === 'overview' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>סקירה</button>
        <button onClick={() => setSubView('cashflow')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${subView === 'cashflow' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>תזרים חודשי</button>
        <button onClick={() => setSubView('loans')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${subView === 'loans' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>הלוואות ומשכנתא</button>
        <button onClick={() => setSubView('assets')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${subView === 'assets' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>נכסים ושווי נקי</button>
        <button onClick={() => setSubView('goals')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${subView === 'goals' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🎯 יעד פיננסי</button>
        <button onClick={() => setSubView('credit')} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${subView === 'credit' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>💳 אשראי</button>
      </div>

      {loading && <div className="card p-6 text-center text-sm text-slate-400">טוענת נתונים...</div>}
      {!loading && error && (
        <div className="card p-4 bg-rose-50 border border-rose-200 text-sm text-rose-600">{error}</div>
      )}

      {!loading && !error && (
        <>
          {subView === 'credit' && <CreditDashboard accounts={accounts} transactions={(transactions || []).filter(t => t.type === 'CARD')} />}
          {subView === 'overview' && <RealOverviewDashboard accounts={accounts} transactions={transactions} />}
          {subView === 'cashflow' && <RealCashflowDashboard transactions={transactions} />}
          {subView === 'loans' && <RealLoansDashboard accounts={accounts} />}
          {subView === 'assets' && <RealAssetsDashboard accounts={accounts} funds={funds} addFund={addFund} updateFund={updateFund} commitFund={commitFund} removeFund={removeFund} />}
          {subView === 'goals' && <RealGoalsDashboard goals={goals} addGoal={addGoal} updateGoal={updateGoal} commitGoal={commitGoal} removeGoal={removeGoal} transactions={transactions} />}
        </>
      )}
    </div>
  );
}
