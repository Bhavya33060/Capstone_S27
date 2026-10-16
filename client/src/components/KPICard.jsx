import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = parseFloat(String(target).replace(/[^0-9.-]/g, '')) || 0;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(num * eased);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    }
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return value;
}

export default function KPICard({ icon: Icon, label, value, suffix = '', decimals = 0, trend, accent = 'primary' }) {
  const animated = useCountUp(value);
  const display = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString();

  return (
    <div className="glass-card kpi-card slide-up">
      <div className={`kpi-icon kpi-${accent}`}><Icon size={20} /></div>
      <div className="kpi-body">
        <p className="kpi-label">{label}</p>
        <h3 className="kpi-value">{display}{suffix}</h3>
        {trend && <span className="kpi-trend">{trend}</span>}
      </div>

      <style>{`
        .kpi-card { padding: 20px; display: flex; align-items: flex-start; gap: 14px; }
        .kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-primary { background: rgba(88,129,87,0.12); color: var(--primary); }
        .kpi-accent { background: rgba(208,140,96,0.14); color: var(--accent); }
        .kpi-secondary { background: rgba(163,177,138,0.18); color: var(--text-main); }
        .kpi-label { font-size: 12.5px; color: var(--text-secondary); font-weight: 500; }
        .kpi-value { font-size: 24px; font-weight: 800; margin-top: 4px; }
        .kpi-trend { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
