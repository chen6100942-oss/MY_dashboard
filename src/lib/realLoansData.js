// ============================================================
// הלוואות ומשכנתא אמיתיות, מתוך accounts שכבר נמשכים מ-Financy.
// Financy מבדילה loanType: MORTGAGE (משכנתא, מפוצלת למסלולים) / RETAIL_LOAN
// (הלוואה רגילה) / CREDIT_LIMIT (מסגרת אשראי/עו"ש - לא כלולה כאן, זו לא הלוואה
// עם לוח סילוקין, היא כבר נספרת בהתחייבויות הכלליות ב"סקירה"/"נכסים ושווי נקי").
// ============================================================
import { unwrapAmount } from './realCreditData.js';

const closingBalances = a => (a.balances || []).filter(b => b.balanceType === 'closingBooked').sort((x, y) => x.referenceDate.localeCompare(y.referenceDate));
const remainingOf = a => { const b = closingBalances(a); return b.length ? unwrapAmount(b[b.length - 1].balanceAmount) : 0; };
const originalOf = a => { const b = closingBalances(a); return b.length ? unwrapAmount(b[0].balanceAmount) : 0; };

const trackNameOf = accountName => {
  const m = (accountName || '').match(/מסלול\s*:\s*(.+)$/);
  return m ? m[1].trim() : (accountName || '').trim();
};

const interestLabel = a => (a.interest || []).map(i => {
  const pct = i.rate?.[0]?.percentage;
  if (i.type === 'FIXD') return `${pct}% קבועה`;
  if (i.type === 'INDE') { const note = i.relatedIndices?.[0]?.additionalInformation; return note ? `+ ${note}` : `+ ${pct}% משתנה`; }
  return null;
}).filter(Boolean).join(' ');

function safeDetails(a) {
  try { return JSON.parse(a.details || '{}'); } catch { return {}; }
}

// משכנתא מקובצת לפי accountNumber - כל קבוצה = הסכם משכנתא אחד, מפוצל למסלולים.
export function getRealMortgages(accounts) {
  const mortgageAccounts = (accounts || []).filter(a => a.loanType === 'MORTGAGE');
  const byAccountNumber = {};
  mortgageAccounts.forEach(a => { (byAccountNumber[a.accountNumber] ||= []).push(a); });

  return Object.entries(byAccountNumber).map(([accountNumber, group]) => {
    const parent = group.find(a => a.product === 'תיק משכנתה');
    const tracks = group.filter(a => a.product !== 'תיק משכנתה');
    const totalRemaining = parent ? remainingOf(parent) : tracks.reduce((s, t) => s + remainingOf(t), 0);
    const totalOriginal = parent ? originalOf(parent) : tracks.reduce((s, t) => s + originalOf(t), 0);
    return {
      id: accountNumber,
      name: parent?.accountName || group[0].accountName || 'משכנתא',
      startDate: parent?.relatedDates?.contractStartDate || tracks[0]?.relatedDates?.contractStartDate,
      endDate: parent?.relatedDates?.contractEndDate || tracks[0]?.relatedDates?.contractEndDate,
      totalRemaining,
      totalOriginal,
      paidPct: totalOriginal > 0 ? Math.round(((totalOriginal - totalRemaining) / totalOriginal) * 100) : 0,
      tracks: tracks.map(t => ({
        id: t.id,
        name: trackNameOf(t.accountName),
        remaining: remainingOf(t),
        original: originalOf(t),
        interest: interestLabel(t),
        endDate: t.relatedDates?.contractEndDate,
      })),
    };
  });
}

// הלוואות רגילות (לא משכנתא, לא מסגרת אשראי).
export function getRealLoans(accounts) {
  return (accounts || []).filter(a => a.loanType === 'RETAIL_LOAN').map(a => {
    const remaining = remainingOf(a);
    const original = originalOf(a);
    const details = safeDetails(a);
    return {
      id: a.id,
      name: a.accountName || 'הלוואה',
      original,
      remaining,
      paidPct: original > 0 ? Math.round(((original - remaining) / original) * 100) : 0,
      startDate: a.relatedDates?.contractStartDate,
      endDate: a.relatedDates?.contractEndDate,
      monthlyPayment: details.nextPaymentAmount ? Number(details.nextPaymentAmount) : null,
      nextPaymentDate: details.nextPaymentDate || null,
      interest: interestLabel(a) || (details.effectiveInterest ? `${details.effectiveInterest}%` : ''),
      linkage: details.linkageType || null,
    };
  });
}
