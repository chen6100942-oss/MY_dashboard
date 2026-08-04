import React, { useMemo, useState, useEffect } from 'react';
import Icon from './Icon.jsx';

const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const startOfWeek=date=>{const d=new Date(date);d.setHours(12,0,0,0);d.setDate(d.getDate()-d.getDay());return d;};
const palette=['#8e6f61','#879b7b','#7b8fa7','#ad8292','#9a8866','#776f96','#6f9895','#b17b5e','#768b68','#9a7188','#6d849a','#a58a70'];
const defaults=['משרד שלסינגר','מדיטציה','טקס בוקר','אימון — הליכה / פילאטיס / חדר כושר','טיפול — אורלי 🪽','עיסוי גב — שמעונה','כתיבת ספר','פרויקט גמר','פיתוח העסק','קריאת ספר','תכנון בית 🏠','שעת AI'];

export default function WeeklyLifePlanner({onScheduleChange}){
  const [weekStart,setWeekStart]=useState(()=>startOfWeek(new Date()));
  const [domains,setDomains]=useState(()=>{try{return JSON.parse(localStorage.getItem('weeklyLifeDomains')||'null')||defaults.map((name,i)=>({id:`domain-${i}`,name,color:palette[i%palette.length]}));}catch{return defaults.map((name,i)=>({id:`domain-${i}`,name,color:palette[i%palette.length]}));}});
  const [events,setEvents]=useState(()=>{try{return JSON.parse(localStorage.getItem('weeklyLifeEvents')||'{}');}catch{return {};}});
  const [newDomain,setNewDomain]=useState('');
  const [editingDomains,setEditingDomains]=useState(false);
  const [freeNotes,setFreeNotes]=useState(()=>{try{return JSON.parse(localStorage.getItem('weeklyLifeFreeNotesByDay')||'{}');}catch{return {};}});
  useEffect(()=>localStorage.setItem('weeklyLifeDomains',JSON.stringify(domains)),[domains]);
  useEffect(()=>{localStorage.setItem('weeklyLifeEvents',JSON.stringify(events));onScheduleChange?.(events);},[events]);
  useEffect(()=>localStorage.setItem('weeklyLifeFreeNotesByDay',JSON.stringify(freeNotes)),[freeNotes]);
  const days=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d;}),[weekStart]);
  const hours=Array.from({length:17},(_,i)=>i+6);
  const dropInto=(e,date,hour)=>{e.preventDefault();let payload;try{payload=JSON.parse(e.dataTransfer.getData('text/plain'));}catch{return;}const key=`${dateKey(date)}-${hour}`;if(payload.kind==='event'){setEvents(p=>{const next={...p};const old=[...(next[payload.key]||[])].filter(x=>x.id!==payload.event.id);next[payload.key]=old;next[key]=[...(next[key]||[]),payload.event];return next;});}else{const domain=domains.find(x=>x.id===payload.id);if(domain)setEvents(p=>({...p,[key]:[...(p[key]||[]),{id:`event-${Date.now()}`,domainId:domain.id,title:domain.name,color:domain.color}]}));}};
  const removeEvent=(key,id)=>setEvents(p=>({...p,[key]:(p[key]||[]).filter(x=>x.id!==id)}));
  const moveWeek=amount=>setWeekStart(d=>{const n=new Date(d);n.setDate(n.getDate()+amount*7);return n;});
  return <section className="weekly-life-planner">
    <header><div><span>WEEKLY LIFE PLANNER</span><h2>לוח שבועי</h2><p>{days[0].toLocaleDateString('he-IL',{day:'numeric',month:'long'})} — {days[6].toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'})}</p></div><nav><button onClick={()=>moveWeek(-1)} aria-label="השבוע הקודם"><span aria-hidden="true">→</span></button><button onClick={()=>setWeekStart(startOfWeek(new Date()))}>השבוע</button><button className="plan-next-week" onClick={()=>{const next=startOfWeek(new Date());next.setDate(next.getDate()+7);setWeekStart(next);}}>תכנון השבוע הבא</button><button onClick={()=>moveWeek(1)} aria-label="השבוע הבא"><span aria-hidden="true">←</span></button></nav></header>
    <div className="weekly-planner-layout">
      <aside className="life-domain-dock"><div className="domain-dock-title"><div><Icon name="grip-vertical" size={14}/><b>תחומי החיים</b></div><button onClick={()=>setEditingDomains(p=>!p)}>{editingDomains?'סיום':'עריכה'}</button></div><p>גררי תחום אל היום והשעה הרצויים.</p><div className="domain-chips">{domains.map(domain=><div draggable onDragStart={e=>e.dataTransfer.setData('text/plain',JSON.stringify({kind:'domain',id:domain.id}))} className="domain-chip" style={{'--domain-color':domain.color}} key={domain.id}>{editingDomains?<input value={domain.name} onChange={e=>setDomains(p=>p.map(x=>x.id===domain.id?{...x,name:e.target.value}:x))}/>:<span>{domain.name}</span>}{editingDomains&&<button onClick={()=>setDomains(p=>p.filter(x=>x.id!==domain.id))}>×</button>}<i/></div>)}</div>{editingDomains&&<form onSubmit={e=>{e.preventDefault();if(!newDomain.trim())return;setDomains(p=>[...p,{id:`domain-${Date.now()}`,name:newDomain.trim(),color:palette[p.length%palette.length]}]);setNewDomain('');}}><input value={newDomain} onChange={e=>setNewDomain(e.target.value)} placeholder="תחום חיים חדש..."/><button>הוספה</button></form>}</aside>
      <div className="weekly-grid-wrap">
        <div className="weekly-grid">
          <div className="week-corner">שעה</div>
          {days.map(day=><div className={`week-day-head ${dateKey(day)===dateKey(new Date())?'today':''}`} key={dateKey(day)}><b>{day.toLocaleDateString('he-IL',{weekday:'long'})}</b><span>{day.getDate()}.{day.getMonth()+1}</span></div>)}
          {hours.map(hour=><React.Fragment key={hour}>
            <div className="week-hour">{pad(hour)}:00</div>
            {days.map(day=>{
              const key=`${dateKey(day)}-${hour}`;
              return <div className="week-cell" key={key} onDragOver={e=>e.preventDefault()} onDrop={e=>dropInto(e,day,hour)}>
                {(events[key]||[]).map(event=><article draggable onDragStart={e=>e.dataTransfer.setData('text/plain',JSON.stringify({kind:'event',key,event}))} style={{'--event-color':event.color}} key={event.id}><span>{event.title}</span><button onClick={()=>removeEvent(key,event.id)}>×</button></article>)}
                <textarea className={`week-cell-free-text ${freeNotes[key]?'has-text':''}`} value={freeNotes[key]||''} onChange={e=>setFreeNotes(p=>({...p,[key]:e.target.value}))} placeholder="" aria-label={`כתיבה בשעה ${pad(hour)}:00`} onDragOver={e=>e.preventDefault()}/>
              </div>;
            })}
          </React.Fragment>)}
        </div>
      </div>
    </div>
  </section>;
}
