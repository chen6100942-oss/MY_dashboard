import React, { useEffect, useState } from 'react';

const moments = [
  { title:'להתעורר בנוכחות', text:'היום לא צריך להתחיל בריצה. הוא יכול להתחיל בנשימה.', position:'0% 0%' },
  { title:'להקשיב פנימה', text:'כמה דקות של שקט משנות את הדרך שבה היום פוגש אותך.', position:'0% 100%' },
  { title:'להניע את הגוף', text:'תנועה קטנה מזכירה לגוף שהוא חי.', position:'50% 0%' },
  { title:'לכתוב בהירות', text:'כשהמחשבות עוברות אל הדף, נוצר מקום לבחור.', position:'100% 0%' },
  { title:'לפגוש את עצמך', text:'לא להפוך למישהו אחר. לחשוף את מי שכבר קיים בפנים.', position:'50% 100%' },
  { title:'להתחיל במה שחשוב', text:'יום מדויק נבנה מפעולה אחת שנעשתה בכוונה.', position:'100% 100%' }
];

export default function OpeningMotivationFilm({ onFinish }){
  const [moment,setMoment] = useState(0);
  const gender = localStorage.getItem('userProfileGender') || 'female';
  const image = gender === 'male' ? '/morning-ritual-scenes-male.png' : '/morning-ritual-scenes.png';
  useEffect(()=>{
    const timer = window.setInterval(()=>setMoment(current=>current < moments.length-1 ? current+1 : current),2300);
    const finish = window.setTimeout(onFinish, moments.length*2300+900);
    return ()=>{window.clearInterval(timer);window.clearTimeout(finish);};
  },[onFinish]);
  const current = moments[moment];
  return <div className="opening-film-overlay" role="dialog" aria-modal="true" aria-label="פתיח השראה יומי">
    <button className="opening-film-skip" onClick={onFinish}>דלגי לפתיחה</button>
    <div className="opening-film-frame">
      <div className="opening-film-image" key={moment} style={{backgroundImage:`linear-gradient(180deg,rgba(30,24,21,.04),rgba(30,24,21,.62)),url(${image})`,backgroundPosition:current.position}}/>
      <div className="opening-film-copy" key={`copy-${moment}`}><span>INSIDE OUT · A DAY IN YOUR LIFE</span><h1>{current.title}</h1><p>{current.text}</p></div>
      <div className="opening-film-progress">{moments.map((_,index)=><i key={index} className={index<=moment?'active':''}/>)}</div>
      <button className="opening-film-continue" onClick={onFinish}>{moment===moments.length-1?'להיכנס לגרסה של היום':'להמשיך'}</button>
    </div>
  </div>;
}
