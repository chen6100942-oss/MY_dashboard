import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const todayKey = () => new Date().toISOString().slice(0, 10);
const emptyDay = () => ({
  meditationMinutes: 5, meditationDone: false, movementMinutes: 10, movementDone: false,
  pages: '', pagesStatus: '', gratitudes: ['', '', '', '', ''], gender: 'female', selectedMantra: ''
});

export default function MorningRitualJourney({ tracks, activeTrackId, onSelectTrack, affirmations, affirmationUrl, gameChangers, setGameChangers }) {
  const date = todayKey();
  const [day, setDay] = useState(() => {
    try { return {...emptyDay(), ...JSON.parse(localStorage.getItem(`morningJourney:${date}`) || '{}')}; } catch { return emptyDay(); }
  });
  const [archive, setArchive] = useState(() => { try { return JSON.parse(localStorage.getItem('morningPagesArchive') || '{}'); } catch { return {}; } });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [burning, setBurning] = useState(false);
  const [visualGender, setVisualGender] = useState(() => localStorage.getItem('morningVisualGender') || 'female');
  const [customizing, setCustomizing] = useState(false);
  const [hiddenSteps, setHiddenSteps] = useState(() => { try { return JSON.parse(localStorage.getItem('morningHiddenSteps') || '[]'); } catch { return []; } });
  const [customTasks, setCustomTasks] = useState(() => { try { return JSON.parse(localStorage.getItem('morningCustomTasks') || '[]'); } catch { return []; } });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [expandedStep, setExpandedStep] = useState(null);
  const timerRef = useRef(null);
  useEffect(() => localStorage.setItem(`morningJourney:${date}`, JSON.stringify(day)), [day, date]);
  useEffect(() => localStorage.setItem('morningPagesArchive', JSON.stringify(archive)), [archive]);
  useEffect(() => { localStorage.setItem('morningVisualGender', visualGender); localStorage.setItem('userProfileGender', visualGender); setDay(p => p.gender === visualGender ? p : {...p, gender: visualGender, selectedMantra: ''}); }, [visualGender]);
  useEffect(() => localStorage.setItem('morningHiddenSteps', JSON.stringify(hiddenSteps)), [hiddenSteps]);
  useEffect(() => localStorage.setItem('morningCustomTasks', JSON.stringify(customTasks)), [customTasks]);
  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = window.setInterval(() => setSecondsLeft(value => {
      if (value <= 1) { window.clearInterval(timerRef.current); setTimerRunning(false); setDay(p => ({...p, meditationDone:true})); onSelectTrack(''); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timerRef.current);
  }, [timerRunning]);

  const mantras = day.gender === 'male' ? [
    'אני ראוי לטוב, לאהבה ולהצלחה.', 'אני בוחר להתחיל את היום בשקט ובבהירות.', 'אני סומך על עצמי ועל הדרך שלי.',
    'יש בי את היכולת ליצור שינוי אמיתי.', 'אני פועל באומץ גם כשאין ודאות מלאה.', 'אני נוכח, ממוקד ופתוח להזדמנויות.',
    'אני משחרר את מה שאינו משרת אותי.', 'אני מתקדם בקצב הנכון עבורי.', 'הגוף שלי חזק והנפש שלי רגועה.',
    'היום אני בוחר מחשבות שמקדמות אותי.'
  ] : [
    'אני ראויה לטוב, לאהבה ולהצלחה.', 'אני בוחרת להתחיל את היום בשקט ובבהירות.', 'אני סומכת על עצמי ועל הדרך שלי.',
    'יש בי את היכולת ליצור שינוי אמיתי.', 'אני פועלת באומץ גם כשאין ודאות מלאה.', 'אני נוכחת, ממוקדת ופתוחה להזדמנויות.',
    'אני משחררת את מה שאינו משרת אותי.', 'אני מתקדמת בקצב הנכון עבורי.', 'הגוף שלי חזק והנפש שלי רגועה.',
    'היום אני בוחרת מחשבות שמקדמות אותי.'
  ];
  const completed = useMemo(() => [['meditation',day.meditationDone],['pages',!!day.pagesStatus],['planning',gameChangers.slice(0,3).filter(x=>x.text?.trim()).length===3],['gratitude',day.gratitudes.filter(Boolean).length>=3],['mantra',!!day.selectedMantra]].filter(([id])=>!hiddenSteps.includes(id)).map(([,done])=>done).concat(customTasks.map(task=>task.done)), [day, gameChangers, hiddenSteps, customTasks]);
  const progress = Math.round(completed.filter(Boolean).length / completed.length * 100);
  const startMeditation = () => { setSecondsLeft(day.meditationMinutes * 60); setTimerRunning(true); };
  const burnPages = () => {
    if (!day.pages.trim()) return;
    setBurning(true);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.7, ctx.sampleRate); const data = buffer.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*(Math.random()>.965?.7:.06)*(1-i/data.length);
      const source=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), gain=ctx.createGain();
      source.buffer=buffer;filter.type='highpass';filter.frequency.value=750;gain.gain.value=.28;source.connect(filter).connect(gain).connect(ctx.destination);source.start();
    } catch {}
    window.setTimeout(()=>{setDay(p=>({...p,pages:'',pagesStatus:'burned'}));setBurning(false);},1700);
  };
  const savePages = () => { if(!day.pages.trim()) return; setArchive(p=>({...p,[date]:day.pages}));setDay(p=>({...p,pagesStatus:'saved'})); };
  const formatTime = value => `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;

  const defaultSteps=[{id:'meditation',label:'מדיטציה'},{id:'pages',label:'דפי בוקר'},{id:'planning',label:'3 המשימות החשובות להיום'},{id:'gratitude',label:'הודיות'},{id:'mantra',label:'מנטרה חיובית'}];
  const toggleStep=id=>setHiddenSteps(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  return <section className="morning-journey" data-gender={visualGender} data-hidden={hiddenSteps.join(' ')} data-expanded={expandedStep ?? ''} onClick={event=>{const title=event.target.closest('.morning-step-title');if(!title||!event.currentTarget.contains(title))return;const step=title.closest('.morning-step');const steps=[...event.currentTarget.querySelectorAll('.morning-step')];const index=steps.indexOf(step);setExpandedStep(current=>current===index?null:index);}}>
    <header className="morning-journey-header"><div className="morning-header-copy"><h2>GOOD MORNING</h2><span>טקס בוקר</span></div><div className="morning-progress"><small>אחוז הספק</small><strong>{progress}%</strong><i><b style={{width:`${progress}%`}}/></i></div></header>
    {customizing&&<div className="morning-customizer"><div><b>השגרה המומלצת</b>{defaultSteps.map(step=><label key={step.id}><input type="checkbox" checked={!hiddenSteps.includes(step.id)} onChange={()=>toggleStep(step.id)}/><span>{step.label}</span></label>)}</div><div><b>משימות אישיות</b><form onSubmit={e=>{e.preventDefault();if(!newTaskTitle.trim())return;setCustomTasks(p=>[...p,{id:`custom-${Date.now()}`,title:newTaskTitle.trim(),done:false}]);setNewTaskTitle('');}}><input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="למשל: מקלחת קרה, ויטמינים..."/><button>הוספה</button></form></div></div>}
    {customTasks.length>0&&<div className="morning-custom-task-list">{customTasks.map(task=><article className={task.done?'done':''} key={task.id}><button className="custom-check" onClick={()=>setCustomTasks(p=>p.map(x=>x.id===task.id?{...x,done:!x.done}:x))}>{task.done?'✓':''}</button><span>{task.title}</span><button className="custom-remove" onClick={()=>setCustomTasks(p=>p.filter(x=>x.id!==task.id))}>×</button></article>)}</div>}

    <div className={`morning-step ${day.meditationDone?'done':''}`}><div className="morning-step-number">01</div><div className="morning-step-content"><div className="morning-step-title"><Icon name="flower-2" size={18}/><div><h3>מדיטציה</h3><p>בחרי זמן, נשמי, ותני ליום להתחיל מבפנים.</p></div><small>5–30 דקות</small></div><div className="choice-row">{[5,15,30].map(n=><button className={day.meditationMinutes===n?'selected':''} onClick={()=>setDay(p=>({...p,meditationMinutes:n}))} key={n}>{n===15?'רבע שעה':n===30?'חצי שעה':`${n} דקות`}</button>)}</div><div className="meditation-controls"><select value={activeTrackId} onChange={e=>onSelectTrack(e.target.value)}><option value="">בחירת מוזיקה למדיטציה</option>{tracks.map(t=><option value={t.id} key={t.id}>{t.label} — {t.note}</option>)}</select>{timerRunning?<><b className="ritual-timer">{formatTime(secondsLeft)}</b><button onClick={()=>setTimerRunning(false)}>השהיה</button></>:<button className="ritual-primary" onClick={startMeditation}>{day.meditationDone?'מדיטציה נוספת':'התחלת מדיטציה'}</button>}<button className="ritual-check" onClick={()=>setDay(p=>({...p,meditationDone:!p.meditationDone}))}>{day.meditationDone?'הושלם ✓':'סימון כהושלם'}</button></div></div></div>

    <div className={`morning-step ${day.movementDone?'done':''}`}><div className="morning-step-number">02</div><div className="morning-step-content"><div className="morning-step-title"><Icon name="footprints" size={18}/><div><h3>תנועה / הליכה</h3><p>להעיר את הגוף, להזרים אנרגיה ולצאת אל היום.</p></div><small>10–30 דקות</small></div><div className="choice-row">{[10,20,30].map(n=><button className={day.movementMinutes===n?'selected':''} onClick={()=>setDay(p=>({...p,movementMinutes:n}))} key={n}>{n} דקות</button>)}<button className="ritual-check" onClick={()=>setDay(p=>({...p,movementDone:!p.movementDone}))}>{day.movementDone?'הושלם ✓':'סימון כהושלם'}</button></div></div></div>

    <div className={`morning-step ${day.pagesStatus?'done':''}`}><div className="morning-step-number">03</div><div className="morning-step-content"><div className="morning-step-title"><Icon name="edit-3" size={18}/><div><h3>דפי בוקר</h3><p>כתיבה חופשית כדי לרוקן את הראש ולהחזיר מקום ובהירות.</p></div><small>5 דקות</small></div><div className={`morning-paper ${burning?'is-burning':''}`}><textarea value={day.pages} onChange={e=>setDay(p=>({...p,pages:e.target.value,pagesStatus:''}))} placeholder="כתבי כאן ללא צנזורה, ללא עריכה וללא צורך לסדר את המחשבות..."/><div className="burn-layer"><i/><i/><i/></div></div><p className="morning-note">חשוב לכתוב הכול — גם מחשבות מבולבלות, קטנות, לא נעימות או לא הגיוניות. הדף יכול להכיל את הכול.</p><div className="morning-paper-actions"><button className="burn-button" disabled={!day.pages.trim()||burning} onClick={burnPages}><Icon name="flame" size={14}/>לשרוף ולשחרר</button><button className="save-paper-button" disabled={!day.pages.trim()} onClick={savePages}><Icon name="archive" size={14}/>לשמור לפי התאריך</button>{day.pagesStatus&&<span>{day.pagesStatus==='saved'?'נשמר בארכיון הבוקר ✓':'שוחרר ונשרף ✓'}</span>}</div>{Object.keys(archive).length>0&&<details className="morning-pages-archive"><summary>דפי הבוקר השמורים ({Object.keys(archive).length})</summary>{Object.entries(archive).sort(([a],[b])=>b.localeCompare(a)).map(([key,text])=><article key={key}><b>{new Date(`${key}T12:00:00`).toLocaleDateString('he-IL')}</b><p>{text}</p><button onClick={()=>setArchive(p=>{const n={...p};delete n[key];return n;})}>מחיקה</button></article>)}</details>}</div></div>

    <div className={`morning-step ${day.gratitudes.filter(Boolean).length>=3?'done':''}`}><div className="morning-step-number">04</div><div className="morning-step-content"><div className="morning-step-title"><Icon name="heart-handshake" size={18}/><div><h3>הודיות</h3><p>היום אני בוחרת להבחין בטוב שכבר נמצא בחיי.</p></div><small>2 דקות</small></div><div className="gratitude-list">{day.gratitudes.map((value,index)=><label key={index}><span>{index+1}</span><input value={value} onChange={e=>setDay(p=>({...p,gratitudes:p.gratitudes.map((x,i)=>i===index?e.target.value:x)}))} placeholder={['היום אני בוחרת להודות על המשפחה שלי','היום אני בוחרת להודות על הזוגיות שיש לי','היום אני בוחרת להודות על הכישרון שלי','היום אני מודה על הגוף שמלווה אותי','היום אני מודה על הזדמנות חדשה'][index]}/></label>)}</div></div></div>

    <div className={`morning-step ${day.selectedMantra?'done':''}`}><div className="morning-step-number">05</div><div className="morning-step-content"><div className="morning-step-title"><Icon name="sparkles" size={18}/><div><h3>מנטרה חיובית לתחילת היום</h3><p>בחרי את המשפט שמרגיש נכון עבורך היום.</p></div><small>דקה</small></div><div className="gender-choice"><span>איך לפנות אלייך?</span><button className={day.gender==='female'?'selected':''} onClick={()=>setDay(p=>({...p,gender:'female',selectedMantra:''}))}>נקבה</button><button className={day.gender==='male'?'selected':''} onClick={()=>setDay(p=>({...p,gender:'male',selectedMantra:''}))}>זכר</button></div><div className="mantra-list">{mantras.map(text=><button className={day.selectedMantra===text?'selected':''} onClick={()=>setDay(p=>({...p,selectedMantra:text}))} key={text}>{text}</button>)}</div>{affirmationUrl&&<a className="mantra-audio-link" href={affirmationUrl} target="_blank" rel="noreferrer"><Icon name="play" size={13}/>מדיטציית מנטרות חיוביות</a>}</div></div>

    <div className={`morning-step ${gameChangers.slice(0,3).filter(x=>x.text?.trim()).length===3?'done':''}`}><div className="morning-step-number">06</div><div className="morning-step-content"><div className="morning-step-title"><Icon name="target" size={18}/><div><h3>3 המשימות החשובות להיום</h3><p>מה שייכתב כאן יעבור אוטומטית גם לאזור משימות להיום.</p></div><small>2–3 דקות</small></div><div className="gamechanger-morning-list">{[0,1,2].map(index=><label key={index}><span>0{index+1}</span><input value={gameChangers[index]?.text||''} onChange={e=>setGameChangers(prev=>{const next=[...prev];while(next.length<3)next.push({id:`gc-${Date.now()}-${next.length}`,text:'',completed:false});next[index]={...next[index],text:e.target.value};return next;})} placeholder={['המשימה שתיצור את ההתקדמות הגדולה ביותר','המשימה שחשוב לעשות לפני שהיום מתמלא','המשימה שתגרום לי לסיים את היום בתחושת גאווה'][index]}/></label>)}</div></div></div>
  </section>;
}
