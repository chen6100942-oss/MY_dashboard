import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';

const STATUSES = [
  { id: 'lead', label: 'ליד חדש', color: '#9a7b52', bg: '#f3ede2' },
  { id: 'contact', label: 'בשיחה', color: '#6f8bab', bg: '#e9eff5' },
  { id: 'active', label: 'לקוח פעיל', color: '#6b8f5f', bg: '#eaf1e6' },
  { id: 'done', label: 'הושלם', color: '#8a6c9a', bg: '#f1eaf4' },
  { id: 'lost', label: 'לא רלוונטי', color: '#a97a6f', bg: '#f5eae7' },
];
const statusMeta = id => STATUSES.find(s => s.id === id) || STATUSES[0];
const uid = () => `c-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
const emptyDraft = () => ({ name: '', phone: '', email: '', service: '', status: 'lead', value: '', notes: '', nextFollowUp: '' });

export default function ClientsTab() {
  const [clients, setClients] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm-clients')) || []; } catch { return []; }
  });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  useEffect(() => { localStorage.setItem('crm-clients', JSON.stringify(clients)); }, [clients]);

  const filtered = useMemo(() => clients
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => !query.trim() || [c.name, c.phone, c.email, c.service].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
  [clients, query, statusFilter]);

  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === 'active').length;
    const leads = clients.filter(c => c.status === 'lead' || c.status === 'contact').length;
    const totalValue = clients.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    return { total: clients.length, active, leads, totalValue };
  }, [clients]);

  const addClient = () => {
    if (!draft.name.trim()) return;
    setClients(prev => [...prev, { ...draft, id: uid(), createdAt: Date.now() }]);
    setDraft(emptyDraft());
    setShowAdd(false);
  };
  const updateClient = (id, patch) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  const deleteClient = id => { if (window.confirm('למחוק את הלקוח הזה?')) { setClients(prev => prev.filter(c => c.id !== id)); if (openId === id) setOpenId(null); } };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ניהול לקוחות</h1>
          <p className="text-sm text-slate-500 mt-1">כל הלקוחות, הלידים וההזדמנויות של העסק שלך — במקום אחד.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all">
          <Icon name="plus" size={16}/> לקוח חדש
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-700">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">סה"כ לקוחות</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold" style={{color:statusMeta('active').color}}>{stats.active}</p>
          <p className="text-xs text-slate-400 mt-1">לקוחות פעילים</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold" style={{color:statusMeta('lead').color}}>{stats.leads}</p>
          <p className="text-xs text-slate-400 mt-1">לידים בטיפול</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-700">{stats.totalValue.toLocaleString('he-IL')} ₪</p>
          <p className="text-xs text-slate-400 mt-1">היקף עסקאות משוער</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon name="search" size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="חיפוש לפי שם, טלפון, מייל..." className="w-full pr-9 pl-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-400 transition-all"/>
        </div>
        <button onClick={() => setStatusFilter('all')} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter==='all' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>הכל ({clients.length})</button>
        {STATUSES.map(s => (
          <button key={s.id} onClick={() => setStatusFilter(s.id)} className="px-3 py-2 rounded-xl text-xs font-bold transition-all border" style={statusFilter===s.id ? {background:s.color, color:'#fff', borderColor:s.color} : {background:s.bg, color:s.color, borderColor:'transparent'}}>
            {s.label} ({clients.filter(c=>c.status===s.id).length})
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card p-5 border-2 border-emerald-200 bg-emerald-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-700">➕ הוספת לקוח חדש</h3>
            <button onClick={() => { setShowAdd(false); setDraft(emptyDraft()); }} className="text-slate-400 hover:text-slate-600 text-sm">ביטול</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={draft.name} onChange={e => setDraft(d => ({...d, name: e.target.value}))} placeholder="שם מלא *" className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"/>
            <input value={draft.phone} onChange={e => setDraft(d => ({...d, phone: e.target.value}))} placeholder="טלפון" className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm" dir="ltr"/>
            <input value={draft.email} onChange={e => setDraft(d => ({...d, email: e.target.value}))} placeholder="אימייל" className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm" dir="ltr"/>
            <input value={draft.service} onChange={e => setDraft(d => ({...d, service: e.target.value}))} placeholder="שירות / פרויקט מבוקש" className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"/>
            <input value={draft.value} onChange={e => setDraft(d => ({...d, value: e.target.value}))} type="number" placeholder="שווי עסקה משוער (₪)" className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"/>
            <select value={draft.status} onChange={e => setDraft(d => ({...d, status: e.target.value}))} className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm">
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <textarea value={draft.notes} onChange={e => setDraft(d => ({...d, notes: e.target.value}))} placeholder="הערות..." rows={2} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm resize-none"/>
          <button onClick={addClient} disabled={!draft.name.trim()} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-all">שמירת לקוח</button>
        </div>
      )}

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <Icon name="users" size={32} className="mx-auto mb-2"/>
          <p className="text-sm font-medium">{clients.length === 0 ? 'עדיין אין לקוחות — נוסיף את הראשון?' : 'לא נמצאו לקוחות תואמים לחיפוש'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const meta = statusMeta(c.status);
            const isOpen = openId === c.id;
            return (
              <div key={c.id} className="card overflow-hidden">
                <button onClick={() => setOpenId(isOpen ? null : c.id)} className="w-full flex items-center gap-3 p-4 text-right">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background: meta.color}}/>
                  <span className="flex-1 min-w-0">
                    <b className="block text-sm font-bold text-slate-700 truncate">{c.name}</b>
                    {c.service && <small className="text-xs text-slate-400 truncate block">{c.service}</small>}
                  </span>
                  {c.value ? <span className="text-xs font-bold text-slate-500 shrink-0">{Number(c.value).toLocaleString('he-IL')} ₪</span> : null}
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{background: meta.bg, color: meta.color}}>{meta.label}</span>
                  <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} className="text-slate-400 shrink-0"/>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">טלפון</label>
                        <input value={c.phone||''} onChange={e => updateClient(c.id, {phone: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" dir="ltr"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">אימייל</label>
                        <input value={c.email||''} onChange={e => updateClient(c.id, {email: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" dir="ltr"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">שירות / פרויקט</label>
                        <input value={c.service||''} onChange={e => updateClient(c.id, {service: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">שווי עסקה (₪)</label>
                        <input type="number" value={c.value||''} onChange={e => updateClient(c.id, {value: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">סטטוס</label>
                        <select value={c.status} onChange={e => updateClient(c.id, {status: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">תזכורת מעקב הבאה</label>
                        <input type="date" value={c.nextFollowUp||''} onChange={e => updateClient(c.id, {nextFollowUp: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"/>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">הערות</label>
                      <textarea value={c.notes||''} onChange={e => updateClient(c.id, {notes: e.target.value})} rows={2} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none resize-none"/>
                    </div>
                    <button onClick={() => deleteClient(c.id)} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"><Icon name="trash-2" size={13}/> מחיקת לקוח</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
