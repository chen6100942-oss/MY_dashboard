import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const choices = [
  { id: 'calendar', icon: '◷', title: 'תזכורות יומן', note: 'רק מה שחשוב בזמן החופשה' },
  { id: 'meditation', icon: '◌', title: 'מדיטציית בוקר', note: 'לשמור על רגע אחד של שקט' },
  { id: 'all', icon: '✦', title: 'הכול', note: 'המערכת ממשיכה כרגיל' },
  { id: 'none', icon: '☾', title: 'כלום', note: 'להתנתק ולנוח באמת' },
];

const messages = {
  calendar: 'הזמן שלך בחופשה שייך לך. נשמור רק על הדברים שבאמת חשוב לזכור.',
  meditation: 'גם הרחק מהשגרה, כמה דקות של שקט מחזירות אותך הביתה — אל עצמך.',
  all: 'אפשר לצאת לחופשה וגם להישאר מחוברת לעצמך, בקצב רך וללא לחץ.',
  none: 'מנוחה היא לא עצירה מהדרך. היא חלק מהדרך.',
};

export default function VacationMode() {
  const [open, setOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [returning, setReturning] = useState(false);
  const [active, setActive] = useState(() => localStorage.getItem('vacationModeActive') === 'true');
  const [selection, setSelection] = useState(() => localStorage.getItem('vacationModeChoice') || 'none');

  useEffect(() => {
    document.documentElement.classList.toggle('vacation-mode-active', active);
    return () => document.documentElement.classList.remove('vacation-mode-active');
  }, [active]);

  const activate = () => {
    localStorage.setItem('vacationModeActive', 'true');
    localStorage.setItem('vacationModeChoice', selection);
    setActive(true);
    setCelebrating(true);
  };

  const finish = () => {
    localStorage.removeItem('vacationModeActive');
    localStorage.removeItem('vacationModeChoice');
    setActive(false); setCelebrating(false); setReturning(true);
  };

  return <>
    <button className={`vacation-side-button ${active ? 'is-active' : ''}`} onClick={() => { setOpen(true); setCelebrating(false); setReturning(false); }} aria-label="מצב חופשה">
      <b>מצב חופשה</b><span className="vacation-toggle" aria-hidden="true"><i /></span>
    </button>
    {active && !open && createPortal(
      <div className="vacation-ambient">
        <div>
          <span>VACATION MODE</span><b>הגיע הזמן לנשום</b><small>{messages[selection]}</small>
          <button className="vacation-ambient-return" onClick={() => setOpen(true)}>לחזרה מהחופשה ←</button>
        </div>
      </div>,
      document.body
    )}
    {open && createPortal(
      <div className="vacation-overlay" role="dialog" aria-modal="true" aria-labelledby="vacation-title">
        <section className={`vacation-dialog ${celebrating || returning ? 'is-celebrating' : ''}`}>
          <button className="vacation-close" onClick={() => setOpen(false)} aria-label="סגירה">×</button>
          {returning ? <div className="vacation-celebration vacation-returning">
            <span className="vacation-label">WELCOME BACK</span><h2>ברוכה השבה</h2>
            <p>מקווה שנהנית בחופשה וצברת אנרגיות חדשות למסע שלך!</p>
            <button onClick={() => { setReturning(false); setOpen(false); }}>לחזור למסע שלי</button>
          </div> : !celebrating ? <>
            <div className="vacation-kicker">INSIDE OUT · VACATION MODE</div><div className="vacation-sun">☼</div>
            <h2 id="vacation-title">מה חשוב לך שיהיה פעיל<br/>במצב החופשה שלך?</h2>
            <p>בחרי את רמת החיבור שמתאימה לך עכשיו. תמיד אפשר לשנות.</p>
            <div className="vacation-choices">{choices.map(choice => <button key={choice.id} className={selection === choice.id ? 'selected' : ''} onClick={() => setSelection(choice.id)}>
              <i>{choice.icon}</i><span><b>{choice.title}</b><small>{choice.note}</small></span><em>{selection === choice.id ? '✓' : ''}</em>
            </button>)}</div>
            <button className="vacation-confirm" onClick={activate}>{active ? 'לעדכן את מצב החופשה' : 'לצאת לחופשה'}</button>
            {active && <button className="vacation-end" onClick={finish}>לסיים את מצב החופשה</button>}
          </> : <div className="vacation-celebration">
            <div className="vacation-sky"><i className="vacation-orbit">☀</i><span>⌁</span><span>⌁</span><span>⌁</span></div><div className="vacation-palm">♧</div>
            <span className="vacation-label">VACATION MODE · ON</span><h2>חופשה נעימה!</h2><p>{messages[selection]}</p>
            <button onClick={() => setOpen(false)}>להיכנס בקצב חופשה</button>
          </div>}
        </section>
      </div>,
      document.body
    )}
  </>;
}
