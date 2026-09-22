import React, { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { fmtILS, fmtDateHe, txStatus } from '../lib/mockCreditData.js';

const STATUS_STYLE = {
  'ירד': { bg: 'bg-slate-100', text: 'text-slate-600' },
  'ממתין': { bg: 'bg-amber-50', text: 'text-amber-600' },
  'עתידי': { bg: 'bg-violet-50', text: 'text-violet-500' },
};

// טבלת עסקאות אחידה, ניתנת לשימוש חוזר לכל כרטיס אשראי — ממוינת, ניתנת לחיפוש וסינון.
// לא תלויה בכרטיס ספציפי: מקבלת rows מוכנות ומציגה אותן בלבד.
export default function CreditTransactionTable({ rows, monthKey }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('הכל');
  const [typeFilter, setTypeFilter] = useState('הכל'); // הכל | רגילות | תשלומים
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const categories = useMemo(() => ['הכל', ...new Set(rows.map(r => r.category))], [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) list = list.filter(r => r.merchant.toLowerCase().includes(search.trim().toLowerCase()));
    if (category !== 'הכל') list = list.filter(r => r.category === category);
    if (typeFilter === 'רגילות') list = list.filter(r => !r.isInstallment);
    if (typeFilter === 'תשלומים') list = list.filter(r => r.isInstallment);
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'amount') return (a.monthlyAmount - b.monthlyAmount) * dir;
      if (sortBy === 'category') return a.category.localeCompare(b.category, 'he') * dir;
      return a.date.localeCompare(b.date) * dir;
    });
  }, [rows, search, category, typeFilter, sortBy, sortDir]);

  const toggleSort = key => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, sortKey }) => (
    <button onClick={() => toggleSort(sortKey)} className="flex items-center gap-0.5 hover:text-violet-600 transition-all">
      {label}
      {sortBy === sortKey && <Icon name={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'} size={11} />}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="relative flex-1 min-w-[140px]">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי בית עסק..."
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none text-xs bg-white"
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 outline-none text-xs bg-white">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 outline-none text-xs bg-white">
          <option value="הכל">כל הסוגים</option>
          <option value="רגילות">עסקאות רגילות</option>
          <option value="תשלומים">בתשלומים</option>
        </select>
      </div>

      <div className="grid grid-cols-[85px_1fr_100px_80px_110px_75px] gap-2 px-4 py-2 bg-slate-100 text-[11px] font-bold text-slate-500">
        <SortHeader label="תאריך" sortKey="date" />
        <span>בית עסק</span>
        <SortHeader label="קטגוריה" sortKey="category" />
        <SortHeader label="סכום" sortKey="amount" />
        <span>תשלומים</span>
        <span>סטטוס</span>
      </div>

      <div className="divide-y divide-slate-100">
        {filtered.map(row => {
          const status = txStatus(row, monthKey);
          const style = STATUS_STYLE[status];
          return (
            <div key={row.id} className="grid grid-cols-[85px_1fr_100px_80px_110px_75px] gap-2 items-center px-4 py-2.5 text-sm">
              <span className="text-xs text-slate-500" dir="ltr">{fmtDateHe(row.date)}</span>
              <span className="text-slate-700 font-medium truncate">{row.merchant}</span>
              <span className="text-xs text-slate-500 truncate">{row.category}</span>
              <span className="font-bold text-slate-800" dir="ltr">{fmtILS(row.monthlyAmount)}</span>
              <span>
                {row.isInstallment ? (
                  <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    תשלום {row.installmentCurrent}/{row.installmentsTotal}
                    {row.installmentsRemaining === 0 && ' 🎉'}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300">חד-פעמי</span>
                )}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-center ${style.bg} ${style.text}`}>{status}</span>
            </div>
          );
        })}
        {!filtered.length && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">אין עסקאות תואמות</p>
        )}
      </div>
    </div>
  );
}
