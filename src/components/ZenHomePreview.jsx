import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

const fallbackTasks = ['כתיבת עמוד אחד של השראה', 'להתאמן פעמיים השבוע', 'לקרוא עשרה עמודים'];
const fallbackGoals = [
  { title: 'כושר ובריאות', progress: 60, icon: 'dumbbell' },
  { title: 'למידה והשראה', progress: 40, icon: 'book-open' },
  { title: 'יצירת איזון', progress: 75, icon: 'leaf' },
  { title: 'יעדים פיננסיים', progress: 30, icon: 'target' },
];

export default function ZenHomePreview({
  tasks = [], goals = [], projects = [], tabs = [], onNavigate,
  searchQuery = '', onSearchChange, onClearSearch,
  layoutEditMode = false, onToggleLayout, onAddBlock,
  darkMode = false, onToggleTheme,
  onOpenSoundLibrary, activeSoundLabel = 'Quiet',
  soundTracks = [], activeSoundId = '', onSelectSound,
  onSave, onUndo, canUndo = false, onNewGoal,
}) {
  const [today, setToday] = useState(() => new Date());
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const year = today.getFullYear();
  const daysToEndOf2026 = Math.max(0, Math.ceil((new Date(2026, 11, 31, 23, 59, 59) - today) / 864e5));
  const weeksToEndOf2026 = Math.floor(daysToEndOf2026 / 7);
  const monthName = today.toLocaleDateString('he-IL', { month: 'long' });
  const firstDay = new Date(year, today.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
  const calendarCells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dailyTasks = tasks.filter(task => !task.completed).slice(0, 3);
  const taskRows = dailyTasks.length ? dailyTasks.map(task => task.text || task.title) : fallbackTasks;
  const goalRows = fallbackGoals.map((fallback, index) => {
    const goal = goals[index];
    return goal ? { ...fallback, title: goal.title || goal.text || fallback.title, progress: Number(goal.progress ?? goal.percent ?? fallback.progress) || 0 } : fallback;
  });
  const openTasks = tasks.filter(task => !task.completed);
  const featuredNavItems = [
    { id: 'my-world', label: 'תכנון ונופש', icon: 'plane', children: [
      { id: 'finance', label: 'תוכנית חסכון לטיסה הבאה שלי', icon: 'piggy-bank' },
      { id: 'my-world', label: 'לראות את היעד על המפה — My World', icon: 'map' },
      { id: 'goals', label: 'להוסיף את הטיסה כיעד', icon: 'target' },
    ] },
    { id: 'goals', label: 'בריאות וכושר', icon: 'dumbbell' },
    { id: 'resources', label: 'פרויקטים', icon: 'folder', children: projects.length
      ? [...projects.map(project => ({ id: 'tasks', label: project.title, icon: 'folder' })), { id: 'tasks', label: 'הצג הכל', icon: 'chevron-left' }]
      : [{ id: 'tasks', label: 'אין עדיין פרויקטים — לפתיחת הכרטיסייה', icon: 'folder' }] },
    { id: 'tasks-list', label: 'משימות', icon: 'check-square', children: openTasks.length
      ? [...openTasks.slice(0, 8).map(task => ({ id: 'tasks', label: task.text || task.title, icon: 'check-square' })), { id: 'tasks', label: 'הצג הכל', icon: 'chevron-left' }]
      : [{ id: 'tasks', label: 'אין משימות פתוחות — לפתיחת הכרטיסייה', icon: 'check-square' }] },
    { id: 'book-wisdom', label: 'התפתחות אישית', icon: 'book-open', children: [
      { id: 'inspiration', label: 'מוטיבציה והשראה', icon: 'sparkles' },
      { id: 'book-wisdom', label: 'סיכומי ספרים', icon: 'book-open' },
      { id: 'mindset', label: 'Mindset', icon: 'brain' },
      { id: 'vision-board', label: 'לוח חזון', icon: 'image' },
    ] },
    { id: 'ikigai', label: 'התפתחות רוחנית', icon: 'flower-2', children: [
      { id: 'ikigai', label: 'IKIGAI', icon: 'flower-2' },
      { id: 'manifesting', label: 'Manifesting', icon: 'sparkles' },
      { id: 'numerology', label: 'נומורולוגיה', icon: 'sparkles' },
    ] },
  ];
  const featuredIds = new Set(featuredNavItems.map(item => item.id));
  // "משימות היום" ו"רווחה והתפתחות" לא מוצגים כאן — הראשון תמיד גלוי בדף הבית עצמו,
  // והשני פוצל ל"התפתחות אישית" ו"התפתחות רוחנית".
  const sidebarOnlyIds = new Set(['home', 'gantt', 'finance', 'numerology', 'morning-ritual', 'ikigai', 'inspiration', 'mindset', 'archive', 'vision-board', 'tasks', 'manifesting', 'resources', 'book-wisdom', 'clients']);
  const [expandedNavId, setExpandedNavId] = useState('');
  const expandedNavItem = featuredNavItems.find(item => item.id === expandedNavId && item.children);
  const navItems = tabs.length ? [
    ...featuredNavItems.filter(item => item.children || tabs.some(tab => tab.id === item.id)),
    ...tabs.filter(tab => !featuredIds.has(tab.id) && !sidebarOnlyIds.has(tab.id)).map(tab => ({
      id: tab.id,
      label: tab.name,
      icon: tab.icon || 'circle',
    })),
  ] : featuredNavItems;

  return (
    <section className="reference-home" aria-label="לוח הבקרה הראשי">
      <div className="reference-utility-row">
        <button className="reference-live-date" onClick={() => onNavigate?.('gantt')}><Icon name="calendar" size={13}/><span>{today.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {today.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span></button>
        <div className="reference-countdown"><span>{weeksToEndOf2026} שבועות</span><b>{daysToEndOf2026} ימים</b><small>עד סוף 2026</small></div>
        <button className="reference-sounds" onClick={() => setSoundMenuOpen(open => !open)} aria-expanded={soundMenuOpen}><Icon name="volume-2" size={14}/><span>מוזיקת רקע</span><small>{activeSoundLabel}</small><Icon name="chevron-down" size={12}/></button>
        {soundMenuOpen && <div className="reference-sound-menu">
          {soundTracks.map(track => <button key={track.id} className={activeSoundId === track.id ? 'is-active' : ''} onClick={() => { onSelectSound?.(track.id); setSoundMenuOpen(false); }}><Icon name="music-2" size={13}/><span><b>{track.label}</b><small>{track.note}</small></span></button>)}
          <button className={!activeSoundId ? 'is-active' : ''} onClick={() => { onSelectSound?.(''); setSoundMenuOpen(false); }}><Icon name="volume-x" size={13}/><span><b>שקט</b><small>ללא מוזיקת רקע</small></span></button>
        </div>}
        <button className="reference-date" onClick={() => onNavigate?.('gantt')}><Icon name="chevron-right" size={12}/><span>יום {today.toLocaleDateString('he-IL', { weekday: 'long' })}, {today.toLocaleDateString('he-IL')}</span><Icon name="chevron-left" size={12}/></button>
        <button className="reference-icon-button" aria-label={darkMode ? 'מצב יום' : 'מצב לילה'} title={darkMode ? 'מצב יום' : 'מצב לילה'} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={15}/></button>
        <button className="reference-add" onClick={onAddBlock}><Icon name="plus" size={13}/> הוסף בלוק</button>
        <button className={`reference-edit ${layoutEditMode ? 'is-active' : ''}`} onClick={onToggleLayout}><Icon name="layout-grid" size={13}/> {layoutEditMode ? 'סיום עריכה' : 'ערוך פריסה'}</button>
        <label className="reference-search"><Icon name="search" size={14}/><input value={searchQuery} onChange={event => onSearchChange?.(event.target.value)} placeholder="חיפוש..." aria-label="חיפוש בדשבורד"/>{searchQuery && <button type="button" onClick={onClearSearch} aria-label="ניקוי חיפוש">×</button>}</label>
      </div>
      <div className="reference-float-actions">
        <button onClick={onSave} title="שמור עכשיו" aria-label="שמור עכשיו"><Icon name="save" size={16}/></button>
        <button onClick={onUndo} disabled={!canUndo} title="בטל" aria-label="בטל"><Icon name="undo" size={16}/></button>
      </div>
      <div className="reference-quick-actions">
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-daily-message'))}><Icon name="star" size={16}/><b>המסר היומי</b></button>
        <button onClick={() => onNavigate?.('tasks')}><Icon name="check-square" size={16}/><b>משימה חדשה</b></button>
        <button onClick={() => onNavigate?.('tasks')}><Icon name="folder" size={16}/><b>פרויקט חדש</b></button>
        <button onClick={() => onNavigate?.('mindset')}><Icon name="edit-3" size={16}/><b>רשומה ביומן</b></button>
        <button onClick={onNewGoal}><Icon name="target" size={16}/><b>יעד ל-2026</b></button>
      </div>
      <nav className="reference-nav" aria-label="כרטיסיות מרכזיות">
        {navItems.map(item => (
          <div className="reference-nav-item" key={item.id}>
            <button
              className={expandedNavId === item.id ? 'is-expanded' : ''}
              aria-expanded={item.children ? expandedNavId === item.id : undefined}
              onClick={() => item.children
                ? setExpandedNavId(current => current === item.id ? '' : item.id)
                : onNavigate?.(item.id)}
            >
              <Icon name={item.icon} size={18}/><span>{item.label}</span>
              {item.children && <Icon name={expandedNavId === item.id ? 'chevron-up' : 'chevron-down'} size={14}/>}
            </button>
            {expandedNavId === item.id && item.children && (
              <div className="reference-nav-expand">
                {item.children.map(child => (
                  <button key={child.label} onClick={() => { onNavigate?.(child.id); setExpandedNavId(''); }}>
                    <Icon name={child.icon} size={16}/><span>{child.label}</span><Icon name="chevron-left" size={13}/>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="reference-section-title"><span/>יעדים לשנת {year}<span/></div>
      <div className="reference-goals-strip">
        {goalRows.map(goal => <button key={goal.title} onClick={() => onNavigate?.('goals')}><Icon name={goal.icon} size={18}/><span><b>{goal.title}</b><small>{goal.progress}%</small><i><em style={{ width: `${Math.min(100, goal.progress)}%` }}/></i></span><Icon name="chevron-left" size={13}/></button>)}
      </div>
      <div className="reference-lower-grid">
        <article className="reference-calendar">
          <header><button aria-label="החודש הקודם"><Icon name="chevron-right" size={14}/></button><h2><Icon name="calendar" size={16}/>{monthName} {year}</h2><button aria-label="החודש הבא"><Icon name="chevron-left" size={14}/></button></header>
          <div className="reference-weekdays">{['א','ב','ג','ד','ה','ו','ש'].map(day => <b key={day}>{day}</b>)}</div>
          <div className="reference-month-grid">{calendarCells.map((day, index) => <span key={index} className={day === today.getDate() ? 'is-today' : ''}>{day}</span>)}</div>
          <footer>A NEW DAY · A BRIGHTER YOU</footer>
        </article>
        <article className="reference-tasks">
          <header><h2>משימות להיום</h2><button onClick={() => onNavigate?.('tasks')}>הצג הכל <Icon name="chevron-left" size={12}/></button></header>
          <div className="reference-empty-illustration"><span>⌁</span><b>{dailyTasks.length ? 'המשימות החשובות שלך' : 'אין משימות להיום'}</b><small>{dailyTasks.length ? 'צעד אחד בכל פעם' : 'פעם נפלאה לפתוח יצירה חדשה'}</small><i className="reference-empty-heart">♡</i></div>
          <div className="reference-task-list">{taskRows.map((task, index) => <button key={`${task}-${index}`} onClick={() => onNavigate?.('tasks')}><i/>{task}</button>)}</div>
        </article>
      </div>
      <footer className="reference-footer"><span>INTENTIONAL DAYS</span><i/><span>A MEANINGFUL LIFE</span><b>PLAN · ELEVATE · GROW</b></footer>
    </section>
  );
}
