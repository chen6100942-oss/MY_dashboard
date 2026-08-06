import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const pearls = [
  { world:'הגוף', color:'#7f947d', science:'שינוי קטן שחוזר על עצמו קל יותר לשימור משינוי חד וקיצוני.', meaning:'את לא צריכה להשלים את כל הדרך כדי להתחיל להרגיש אחרת.', spirit:'עקביות עדינה הופכת בחירה חדשה לחלק ממי שאת.', action:'בחרי היום החלטה אחת שתכבד את הגוף שלך.', habit:'שתיתי כוס מים נוספת.', thought:'התקדמות עדיפה על שלמות.' },
  { world:'תודעה', color:'#74869a', science:'כתיבה קצרה יכולה לעזור לארגן מחשבות ולצמצם עומס מנטלי.', meaning:'בהירות לא תמיד מגיעה לפני הפעולה; לפעמים היא נוצרת מתוכה.', spirit:'כשאת נותנת למחשבה מקום, היא כבר לא צריכה לנהל אותך.', action:'כתבי במשך חמש דקות בלי לערוך ובלי לעצור.', habit:'פיניתי חמש דקות לשקט.', thought:'אני לא חייבת לפתור הכול עכשיו.' },
  { world:'ייעוד', color:'#776f96', science:'פירוק משימה לצעד קטן מפחית את החיכוך שמונע התחלה.', meaning:'עשרים דקות של יצירה הן הוכחה לזהות שאת בונה.', spirit:'הדרך מתבהרת כשצועדים בה, לא כשמחכים לוודאות.', action:'עבדי עשרים דקות על הדבר שאת רוצה להביא לעולם.', habit:'התחלתי לפני שהרגשתי מוכנה.', thought:'הפעולה שלי מלמדת אותי מי אני.' },
  { world:'מערכות יחסים', color:'#a87986', science:'נוכחות קשובה מחזקת תחושת קרבה ואמון בין אנשים.', meaning:'קשר עמוק נבנה ברגעים קטנים של תשומת לב אמיתית.', spirit:'הדרך שבה אנחנו פוגשים אדם אחר היא גם הדרך שבה אנחנו פוגשים את עצמנו.', action:'שאלי אדם קרוב שאלה אחת והקשיבי בלי להכין תשובה.', habit:'נתתי נוכחות מלאה.', thought:'קרבה מתחילה בסקרנות.' }
];

const todayKey = () => new Date().toISOString().slice(0,10);

export default function DailyPearl(){
  const pearl = useMemo(() => pearls[Math.floor(Date.now()/86400000)%pearls.length], []);
  const [open, setOpen] = useState(false);
  const [saved,setSaved] = useState(false);
  const [done,setDone] = useState(false);
  const save = () => {
    const current = JSON.parse(localStorage.getItem('insideout-pearl-collection')||'[]');
    if(!current.some(item=>item.date===todayKey())) localStorage.setItem('insideout-pearl-collection',JSON.stringify([...current,{...pearl,date:todayKey()}]));
    setSaved(true);
  };
  const finish = () => { setDone(true); setOpen(false); };
  const count = (()=>{try{return JSON.parse(localStorage.getItem('insideout-pearl-collection')||'[]').length;}catch{return 0;}})();
  const openPearl = () => { window.dispatchEvent(new CustomEvent('play-daily-gong')); setOpen(true); };

  return <>
    <button className={`daily-message-card${done?' is-done':''}`} onClick={openPearl}>
      <span className="daily-message-kicker">INSIDE OUT</span>
      <b>🔔 המסר היומי שלך</b>
      <small>{done?'קראת את המסר של היום ✓':'לחצי לפתיחה'}</small>
    </button>
    {open && createPortal(
      <div className="pearl-overlay" role="dialog" aria-modal="true" aria-labelledby="pearl-title">
        <section className="pearl-dialog" style={{'--pearl':pearl.color}}>
          <button className="pearl-close" onClick={()=>setOpen(false)} aria-label="סגירה">×</button>
          <header><span>{pearl.world}</span><h3 id="pearl-title">🌸 המסר היומי שלך</h3></header>
          <div className="pearl-layers"><section><b>הידע</b><p>{pearl.science}</p></section><section><b>המשמעות עבורך</b><p>{pearl.meaning}</p></section><section><b>הרוח</b><p>{pearl.spirit}</p></section><section className="pearl-action"><b>הפעולה להיום</b><p>{pearl.action}</p></section></div>
          <div className="pearl-after"><span>הרגל אחד</span><b>{pearl.habit}</b><span>מחשבה לקחת איתך</span><b>{pearl.thought}</b><small>אספת עד היום {count} פנינים</small></div>
          <footer><button onClick={save}>{saved?'נשמרה באוסף':'שמרי פנינה'}</button><button className="done" onClick={finish}>ביצעתי · סיימתי</button></footer>
        </section>
      </div>,
      document.body
    )}
  </>;
}
