import { useMemo, useState } from 'react';
import Icon from './Icon.jsx';

const providers = {
  flights: [
    { name: 'Google Flights', note: 'השוואה רחבה, גרף מחירים ומעקב', url: 'https://www.google.com/travel/flights?hl=he', tone: 'google' },
    { name: 'Skyscanner', note: 'השוואת חברות תעופה וסוכנויות', url: 'https://www.skyscanner.co.il/', tone: 'sky' },
    { name: 'KAYAK', note: 'טיסות, תאריכים גמישים והתראות', url: 'https://www.he.kayak.com/flights', tone: 'coral' },
    { name: 'Kiwi.com', note: 'שילובי טיסות ומסלולים מורכבים', url: 'https://www.kiwi.com/il/', tone: 'mint' },
    { name: 'momondo', note: 'השוואה חזותית וגמישות בתאריכים', url: 'https://www.momondo.com/', tone: 'plum' },
  ],
  stays: [
    { name: 'Google Hotels', note: 'השוואת מחירים לפי תאריך ומפה', url: 'https://www.google.com/travel/hotels?hl=he', tone: 'google' },
    { name: 'Booking.com', note: 'מלונות ודירות עם מסננים וביקורות', url: 'https://www.booking.com/', tone: 'navy' },
    { name: 'Airbnb', note: 'דירות, בתים וחוויות מקומיות', url: 'https://www.airbnb.com/', tone: 'rose' },
    { name: 'Hotels.com', note: 'מלונות ומקומות אירוח בעולם', url: 'https://www.hotels.com/', tone: 'red' },
    { name: 'Agoda', note: 'מבחר רחב במיוחד באסיה', url: 'https://www.agoda.com/', tone: 'violet' },
    { name: 'Hostelworld', note: 'הוסטלים ולינה בתקציב נמוך', url: 'https://www.hostelworld.com/', tone: 'orange' },
  ],
};

const defaultChecklist = [
  'דרכון בתוקף', 'ביטוח נסיעות', 'כרטיסי טיסה', 'הזמנת לינה',
  'אינטרנט / eSIM', 'מטבע ואמצעי תשלום', 'תחבורה משדה התעופה', 'תרופות קבועות',
];

const tabs = [
  { id: 'map', label: 'Google Maps', icon: 'map' },
  { id: 'plan', label: 'תכנון הטיול', icon: 'calendar-days' },
  { id: 'flights', label: 'הזמנת טיסה', icon: 'plane' },
  { id: 'stays', label: 'מלונות ו-Airbnb', icon: 'bed-double' },
  { id: 'compare', label: 'השוואת הצעות', icon: 'scale' },
  { id: 'checklist', label: 'לפני שיוצאים', icon: 'list-checks' },
];

const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

export default function TravelHub({ data, onChange }) {
  const [active, setActive] = useState('map');
  const [quoteDraft, setQuoteDraft] = useState({ type: 'טיסה', provider: '', price: '', link: '' });
  const travel = data || {};
  const update = (field, value) => onChange({ ...travel, [field]: value });
  const destination = travel.destination || '';
  const mapQuery = encodeURIComponent(destination || 'World');
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&z=${destination ? 11 : 2}&output=embed`;
  const mapSearch = (query) => openExternal(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query}${destination ? ` in ${destination}` : ''}`)}`);
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const quotes = useMemo(() => travel.quotes || [], [travel.quotes]);
  const cheapestIds = useMemo(() => {
    const byType = quotes.filter(item => Number(item.price) > 0).reduce((groups, item) => {
      groups[item.type] = [...(groups[item.type] || []), item];
      return groups;
    }, {});
    return new Set(Object.values(byType).map(items => items.reduce((best, item) => Number(item.price) < Number(best.price) ? item : best).id));
  }, [quotes]);
  const checklist = travel.checklist || defaultChecklist.map((label, index) => ({ id: `travel-${index}`, label, done: false }));

  const addQuote = () => {
    if (!quoteDraft.provider.trim() || !Number(quoteDraft.price)) return;
    update('quotes', [...quotes, { ...quoteDraft, id: Date.now(), price: Number(quoteDraft.price) }]);
    setQuoteDraft({ type: 'טיסה', provider: '', price: '', link: '' });
  };

  return (
    <section className="travel-hub" aria-label="מרכז תכנון טיולים">
      <header className="travel-hub-hero">
        <div>
          <span className="travel-kicker">המסע הבא מתחיל כאן</span>
          <h3>מתכננים, משווים ויוצאים לדרך</h3>
          <p>כל כלי הנסיעה במקום אחד, עם הסברים פשוטים וקישורים בטוחים לשירותי ההזמנה.</p>
        </div>
        <label className="travel-destination">
          <span>לאן נוסעים?</span>
          <div><Icon name="map-pin" size={18}/><input value={destination} onChange={event => update('destination', event.target.value)} placeholder="למשל: רומא, איטליה" /></div>
        </label>
      </header>

      <nav className="travel-tabs" aria-label="כלי תכנון טיול">
        {tabs.map(tab => <button key={tab.id} className={active === tab.id ? 'active' : ''} onClick={() => setActive(tab.id)}><Icon name={tab.icon} size={17}/><span>{tab.label}</span></button>)}
      </nav>

      {active === 'map' && <div className="travel-panel travel-map-panel">
        <div className="travel-map-frame"><iframe title={`Google Maps ${destination || 'עולם'}`} src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
        <aside className="travel-map-tools">
          <div><span>מגלים את היעד</span><h4>{destination || 'בחרי יעד כדי להתחיל'}</h4><p>החיפושים ייפתחו ב-Google Maps עם תוצאות עדכניות, ביקורות, שעות פתיחה וניווט.</p></div>
          <div className="travel-map-actions">
            <button onClick={() => mapSearch('attractions')}><Icon name="landmark" size={16}/>אטרקציות</button>
            <button onClick={() => mapSearch('restaurants')}><Icon name="utensils" size={16}/>מסעדות</button>
            <button onClick={() => mapSearch('hotels')}><Icon name="bed-double" size={16}/>מלונות</button>
            <button onClick={() => mapSearch('cafes')}><Icon name="coffee" size={16}/>בתי קפה</button>
          </div>
          <button className="travel-primary" disabled={!destination} onClick={() => openExternal(routeUrl)}><Icon name="navigation" size={17}/>פתיחת מסלול ב-Google Maps</button>
        </aside>
      </div>}

      {active === 'plan' && <div className="travel-panel travel-plan-grid">
        <div className="travel-form-card">
          <h4>פרטי הטיול</h4>
          <div className="travel-fields two">
            <label><span>שם הטיול</span><input value={travel.title || ''} onChange={e => update('title', e.target.value)} placeholder="סופ״ש ברומא" /></label>
            <label><span>תקציב משוער</span><input value={travel.budget || ''} onChange={e => update('budget', e.target.value)} placeholder="₪ 6,000" /></label>
            <label><span>תאריך יציאה</span><input type="date" value={travel.startDate || ''} onChange={e => update('startDate', e.target.value)} /></label>
            <label><span>תאריך חזרה</span><input type="date" value={travel.endDate || ''} onChange={e => update('endDate', e.target.value)} /></label>
            <label><span>מספר נוסעים</span><input type="number" min="1" value={travel.travelers || 1} onChange={e => update('travelers', e.target.value)} /></label>
            <label><span>סגנון הטיול</span><select value={travel.style || ''} onChange={e => update('style', e.target.value)}><option value="">לבחירה</option><option>עירוני</option><option>טבע</option><option>בטן-גב</option><option>קולינרי</option><option>משפחתי</option><option>רומנטי</option></select></label>
          </div>
        </div>
        <div className="travel-form-card itinerary">
          <h4>מסלול ורעיונות</h4>
          <textarea value={travel.itinerary || ''} onChange={e => update('itinerary', e.target.value)} placeholder={'יום 1 — הגעה והתארגנות\nיום 2 — מרכז העיר ואטרקציות\nיום 3 — טיול יום מחוץ לעיר'} rows="9" />
          <small>נשמר אוטומטית יחד עם שאר נתוני החשבון.</small>
        </div>
      </div>}

      {(active === 'flights' || active === 'stays') && <div className="travel-panel">
        <div className="travel-search-summary">
          <div><Icon name={active === 'flights' ? 'plane' : 'bed-double'} size={22}/><span><b>{active === 'flights' ? 'חיפוש טיסות' : 'חיפוש מקום לינה'}</b><small>{destination ? `היעד: ${destination}` : 'הגדירי יעד בראש העמוד'}</small></span></div>
          <p>{active === 'flights' ? 'פתחי שניים או שלושה מנועי חיפוש והשווי מחיר סופי כולל מזוודה, שעות וקונקשנים.' : 'השווי מחיר סופי, מיקום, מדיניות ביטול וביקורות עדכניות.'}</p>
        </div>
        <div className="travel-provider-grid">
          {providers[active].map(provider => <button key={provider.name} className={`travel-provider ${provider.tone}`} onClick={() => openExternal(provider.url)}><span className="provider-mark">{provider.name.slice(0, 1)}</span><span><b>{provider.name}</b><small>{provider.note}</small></span><Icon name="external-link" size={15}/></button>)}
        </div>
        <div className="travel-tip"><Icon name="lightbulb" size={18}/><p><b>טיפ לחיסכון:</b> בדקי גם יום לפני ויום אחרי, והשווי את המחיר הסופי לאחר כבודה, מיסים ודמי ביטול.</p></div>
      </div>}

      {active === 'compare' && <div className="travel-panel travel-compare">
        <div className="travel-compare-intro"><h4>השוואת הצעות במקום אחד</h4><p>אחרי שמצאת מחיר באתר הזמנות, הוסיפי אותו כאן. ההצעה הזולה ביותר תסומן אוטומטית.</p></div>
        <div className="travel-quote-form">
          <select value={quoteDraft.type} onChange={e => setQuoteDraft(p => ({ ...p, type: e.target.value }))}><option>טיסה</option><option>מלון</option><option>דירה</option><option>רכב</option></select>
          <input value={quoteDraft.provider} onChange={e => setQuoteDraft(p => ({ ...p, provider: e.target.value }))} placeholder="שם האתר / הספק" />
          <input type="number" min="0" value={quoteDraft.price} onChange={e => setQuoteDraft(p => ({ ...p, price: e.target.value }))} placeholder="מחיר בש״ח" />
          <input value={quoteDraft.link} onChange={e => setQuoteDraft(p => ({ ...p, link: e.target.value }))} placeholder="קישור להצעה (לא חובה)" />
          <button onClick={addQuote}>הוספת הצעה</button>
        </div>
        {quotes.length ? <div className="travel-quotes">{quotes.map(item => <article key={item.id} className={cheapestIds.has(item.id) ? 'cheapest' : ''}>{cheapestIds.has(item.id) && <span className="best-badge">הכי זול בקטגוריה</span>}<div><small>{item.type}</small><h5>{item.provider}</h5></div><b>₪{Number(item.price).toLocaleString('he-IL')}</b><div className="quote-actions">{item.link && <button onClick={() => openExternal(item.link)} aria-label="פתיחת ההצעה"><Icon name="external-link" size={15}/></button>}<button onClick={() => update('quotes', quotes.filter(quote => quote.id !== item.id))} aria-label="מחיקת ההצעה"><Icon name="trash-2" size={15}/></button></div></article>)}</div> : <div className="travel-empty"><Icon name="scale" size={28}/><p>עדיין לא נוספו הצעות להשוואה.</p></div>}
        <p className="travel-live-note"><Icon name="info" size={14}/> המחירים כאן מוזנים על ידך. חיבור מחירים אוטומטי בזמן אמת דורש API מאושר מכל ספק.</p>
      </div>}

      {active === 'checklist' && <div className="travel-panel travel-checklist">
        <div><h4>צ׳קליסט לפני הטיסה</h4><p>סמני כל דבר שכבר סגור. הרשימה נשמרת בחשבון.</p></div>
        <div className="travel-check-grid">{checklist.map(item => <button key={item.id} className={item.done ? 'done' : ''} onClick={() => update('checklist', checklist.map(entry => entry.id === item.id ? { ...entry, done: !entry.done } : entry))}><i>{item.done ? '✓' : ''}</i><span>{item.label}</span></button>)}</div>
        <label className="travel-notes"><span>מידע חשוב לטיול</span><textarea value={travel.notes || ''} onChange={e => update('notes', e.target.value)} placeholder="מספר הזמנה, כתובת המלון, אנשי קשר, דברים לזכור..." rows="5" /></label>
      </div>}
    </section>
  );
}
