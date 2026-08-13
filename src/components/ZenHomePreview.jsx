import React from 'react';
import Icon from './Icon.jsx';

const fallbackTasks = [
  'להתמקד במשימה החשובה ביותר שלי',
  'תנועה עדינה וחיבור לגוף',
  'זמן איכות עם המשפחה',
];

export default function ZenHomePreview({ tasks = [], goals = [], onNavigate }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const liveTasks = tasks.filter(task => !task.completed).slice(0, 3);
  const dailyTasks = liveTasks.length ? liveTasks.map(task => task.text || task.title) : fallbackTasks;
  const liveGoals = goals.slice(0, 3);
  const goalRows = liveGoals.length ? liveGoals.map((goal, index) => ({
    label: goal.title || goal.text || `יעד ${index + 1}`,
    progress: Number(goal.progress ?? goal.percent ?? [70, 55, 80][index]) || 0,
  })) : [
    { label: 'בריאות ואנרגיה', progress: 70 },
    { label: 'צמיחה אישית', progress: 55 },
    { label: 'משפחה וקשרים', progress: 80 },
  ];

  return (
    <section className="zen-preview-home" aria-label="תצוגת Zen Focus">
      <div className="zen-preview-message" aria-hidden="true">
        <span>🧘🏻‍♀️</span><b>נשימה אחת.</b><small>חוזרת אל עצמך.</small>
      </div>

      <article className="zen-today-card">
        <div className="zen-eyebrow"><Icon name="sun" size={16}/> היום שלי</div>
        <h2>בוקר טוב, חן</h2>
        <p>מה הדבר החשוב ביותר שלך היום?</p>
        <div className="zen-task-list">
          {dailyTasks.map((task, index) => (
            <button key={`${task}-${index}`} onClick={() => onNavigate?.('tasks')}>
              <i>{index + 1}</i><span>{task}</span><Icon name={['leaf','activity','users'][index]} size={20}/>
            </button>
          ))}
        </div>
      </article>

      <div className="zen-lower-grid">
        <article className="zen-week-card">
          <header><Icon name="calendar" size={20}/><h3>השבוע שלך</h3></header>
          <div className="zen-week-days">
            {week.map((date, index) => {
              const isToday = date.toDateString() === today.toDateString();
              return <button key={date.toISOString()} className={isToday ? 'is-today' : ''} onClick={() => onNavigate?.('gantt')}>
                <small>{['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'][index]}</small><b>{date.getDate()}</b><i/>
              </button>;
            })}
          </div>
        </article>

        <article className="zen-direction-card">
          <header><Icon name="compass" size={20}/><h3>הכיוון שלך</h3></header>
          <div className="zen-goal-list">
            {goalRows.map(goal => <button key={goal.label} onClick={() => onNavigate?.('goals')}>
              <span>{goal.label}</span><div><i style={{width:`${Math.min(100, goal.progress)}%`}}/></div><b>{goal.progress}%</b>
            </button>)}
          </div>
        </article>
      </div>

      <button className="zen-primary-action" onClick={() => onNavigate?.('tasks')}><Icon name="plus" size={18}/> מה תרצי לעשות?</button>
    </section>
  );
}
