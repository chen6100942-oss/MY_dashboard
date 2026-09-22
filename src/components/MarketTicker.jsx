import React, { useEffect, useRef } from 'react';

// סרגל שוק ההון החי (TradingView Ticker Tape) — רץ ברקע, ללא צורך במפתח API.
const SYMBOLS = [
  { proName: 'TASE:TA35', title: 'ת"א 35' },
  { proName: 'FX_IDC:USDILS', title: 'דולר/שקל' },
  { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
  { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq 100' },
  { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
];

export default function MarketTicker() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: SYMBOLS,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'light',
      locale: 'he',
    });
    el.appendChild(script);
    return () => { el.innerHTML = ''; };
  }, []);

  return (
    <div className="card overflow-hidden p-0">
      <div ref={containerRef} className="tradingview-widget-container" />
    </div>
  );
}
