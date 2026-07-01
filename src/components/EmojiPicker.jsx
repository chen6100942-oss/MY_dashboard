import React, { useState, useEffect, useRef } from 'react';
import { EMOJI_CATEGORIES } from '../data/emojiCategories.js';

const EmojiPicker = ({ value, onChange, size = 'md' }) => {
    const [open, setOpen] = useState(false);
    const [catIdx, setCatIdx] = useState(0);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const allEmojis = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    const filtered = search ? allEmojis.filter(e => e.includes(search)) : EMOJI_CATEGORIES[catIdx].emojis;

    const btnSize = size === 'lg' ? 'text-2xl w-12 h-12' : size === 'sm' ? 'text-sm w-7 h-7' : 'text-xl w-10 h-10';

    return React.createElement('div', { style:{position:'relative',display:'inline-flex',alignItems:'center'}, ref },
        React.createElement('button', {
            type:'button',
            onClick: ()=>setOpen(p=>!p),
            className: `${btnSize} rounded-xl border-2 ${open?'border-violet-400 bg-violet-50':'border-slate-200 bg-white hover:border-violet-300'} flex items-center justify-center transition-all cursor-pointer shadow-sm`,
            title: 'בחרי אימוג\'י'
        }, value || '😊'),
        open && React.createElement('div', {
            style:{position:'absolute',top:'110%',right:0,zIndex:9999,background:'#fff',borderRadius:'16px',boxShadow:'0 8px 40px rgba(0,0,0,0.18)',width:'280px',padding:'12px',border:'1px solid #e2e8f0'}
        },
            React.createElement('input', { type:'text', value:search, onChange:e=>setSearch(e.target.value), placeholder:'🔍 חיפוש...', autoFocus:true, style:{width:'100%',padding:'6px 10px',borderRadius:'10px',border:'1px solid #e2e8f0',outline:'none',fontSize:'13px',marginBottom:'8px',direction:'rtl'} }),
            !search && React.createElement('div', { style:{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'} },
                EMOJI_CATEGORIES.map((cat, i) =>
                    React.createElement('button', { key:i, type:'button', onClick:()=>setCatIdx(i),
                        style:{fontSize:'14px',padding:'3px 6px',borderRadius:'8px',border:'none',cursor:'pointer',background: i===catIdx?'#8b5cf6':'#f1f5f9',color: i===catIdx?'#fff':'#64748b',transition:'all 0.15s'}
                    }, cat.emojis[0])
                )
            ),
            React.createElement('div', { style:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',maxHeight:'200px',overflowY:'auto'} },
                filtered.map((em, i) =>
                    React.createElement('button', { key:i, type:'button',
                        onClick:()=>{ onChange(em); setOpen(false); setSearch(''); },
                        style:{fontSize:'20px',padding:'4px',borderRadius:'8px',border:'none',cursor:'pointer',background:'transparent',transition:'background 0.1s'},
                        onMouseEnter:e=>e.target.style.background='#f1f5f9',
                        onMouseLeave:e=>e.target.style.background='transparent'
                    }, em)
                )
            )
        )
    );
};

export default EmojiPicker;
