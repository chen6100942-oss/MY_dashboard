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
const INTERACTION_TYPES = [
  { id: 'call', label: 'שיחה', icon: 'phone' },
  { id: 'meeting', label: 'פגישה', icon: 'users' },
  { id: 'note', label: 'הערה', icon: 'edit-3' },
  { id: 'email', label: 'מייל', icon: 'send' },
  { id: 'other', label: 'אחר', icon: 'star' },
];
const interactionMeta = id => INTERACTION_TYPES.find(t => t.id === id) || INTERACTION_TYPES[2];
const uid = () => `c-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
const emptyDraft = () => ({ name: '', phone: '', email: '', service: '', status: 'lead', value: '', notes: '', nextFollowUp: '' });
const fileToDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
const formatBytes = bytes => bytes < 1024 ? `${bytes} B` : bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;

export default function ClientsTab() {
  const [clients, setClients] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm-clients')) || []; } catch { return []; }
  });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [noteType, setNoteType] = useState('call');
  const [noteText, setNoteText] = useState('');

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

  const addInteraction = (clientId, type, text) => {
    if (!text.trim()) return;
    const entry = { id: uid(), type, text: text.trim(), date: new Date().toISOString() };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, interactions: [entry, ...(c.interactions || [])] } : c));
  };
  const deleteInteraction = (clientId, entryId) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, interactions: (c.interactions || []).filter(i => i.id !== entryId) } : c));

  const addFiles = async (clientId, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const tooBig = files.filter(f => f.size > 4 * 1024 * 1024);
    if (tooBig.length) alert(`הקבצים הבאים גדולים מדי לשמירה מקומית (מעל 4MB) ולא יועלו: ${tooBig.map(f=>f.name).join(', ')}`);
    const okFiles = files.filter(f => f.size <= 4 * 1024 * 1024);
    const uploaded = await Promise.all(okFiles.map(async f => ({ id: uid(), name: f.name, size: f.size, type: f.type, dataUrl: await fileToDataUrl(f) })));
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, files: [...(c.files || []), ...uploaded] } : c));
  };
  const deleteFile = (clientId, fileId) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, files: (c.files || []).filter(f => f.id !== fileId) } : c));

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
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">הערות כלליות</label>
                      <textarea value={c.notes||''} onChange={e => updateClient(c.id, {notes: e.target.value})} rows={2} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none resize-none"/>
                    </div>

                    {/* Interaction log */}
                    <div className="border-t border-slate-100 pt-3">
                      <label className="text-[10px] font-bold text-slate-400 block mb-2">יומן אינטראקציות — שיחה, פגישה, הערה...</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {INTERACTION_TYPES.map(t => (
                          <button key={t.id} onClick={() => setNoteType(t.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${noteType===t.id ? 'bg-slate-700 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                            <Icon name={t.icon} size={12}/> {t.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={openId===c.id ? noteText : ''}
                          onChange={e => setNoteText(e.target.value)}
                          onKeyDown={e => { if (e.key==='Enter') { addInteraction(c.id, noteType, noteText); setNoteText(''); } }}
                          placeholder={`תיאור ה${interactionMeta(noteType).label}...`}
                          className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        />
                        <button onClick={() => { addInteraction(c.id, noteType, noteText); setNoteText(''); }} disabled={!noteText.trim()} className="px-3 bg-slate-700 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg text-xs font-bold shrink-0">הוספה</button>
                      </div>
                      {(c.interactions||[]).length > 0 && (
                        <div className="space-y-1.5 mt-3">
                          {c.interactions.map(entry => {
                            const im = interactionMeta(entry.type);
                            return (
                              <div key={entry.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg group">
                                <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500"><Icon name={im.icon} size={12}/></span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <b className="text-[10px] font-bold text-slate-500">{im.label}</b>
                                    <small className="text-[9px] text-slate-400">{new Date(entry.date).toLocaleDateString('he-IL', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</small>
                                  </div>
                                  <p className="text-xs text-slate-700 mt-0.5">{entry.text}</p>
                                </div>
                                <button onClick={() => deleteInteraction(c.id, entry.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 shrink-0">✕</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="border-t border-slate-100 pt-3">
                      <label className="text-[10px] font-bold text-slate-400 block mb-2">מסמכים</label>
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg text-xs font-bold text-slate-400 hover:border-emerald-300 hover:text-emerald-500 cursor-pointer transition-all">
                        <Icon name="paperclip" size={14}/> להעלאת מסמך (עד 4MB לקובץ)
                        <input type="file" multiple className="hidden" onChange={e => { addFiles(c.id, e.target.files); e.target.value = ''; }}/>
                      </label>
                      {(c.files||[]).length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          {c.files.map(f => (
                            <div key={f.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                              <Icon name="paperclip" size={13} className="text-slate-400 shrink-0"/>
                              <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">{f.name}</span>
                              <small className="text-[9px] text-slate-400 shrink-0">{formatBytes(f.size)}</small>
                              <a href={f.dataUrl} download={f.name} className="text-slate-400 hover:text-slate-600 shrink-0"><Icon name="download" size={13}/></a>
                              <button onClick={() => deleteFile(c.id, f.id)} className="text-slate-300 hover:text-rose-500 shrink-0">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
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
