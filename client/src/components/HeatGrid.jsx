import { Fragment } from 'react';
// Generic matrix heatmap (rows x columns) with a gradient legend
const STOPS = [[200, 85, 61], [233, 196, 106], [163, 177, 138], [88, 129, 87], [52, 78, 65]];
export function heatColor(t) {
  const x = Math.min(1, Math.max(0, t)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x)); const f = x - i;
  const c = STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export default function HeatGrid({ rows, cols, matrix, unit = '%', max = 100, cell = 30, lowLabel = 'Empty', highLabel = 'Full' }) {
  return (
    <div className="hg">
      <div className="hg-scroll">
        <div className="hg-grid" style={{ gridTemplateColumns: `130px repeat(${cols.length}, minmax(${cell}px, 1fr))` }}>
          <div />
          {cols.map((c) => <div key={c} className="hg-col">{c}</div>)}
          {rows.map((r, i) => (
            <Fragment key={r}>
              <div className="hg-row" title={r}>{r}</div>
              {cols.map((c, j) => {
                const v = matrix[i][j];
                return (
                  <div key={`${r}-${c}`} className="hg-cell" title={v == null ? 'no data' : `${r} · ${c}: ${v}${unit}`}
                    style={{ background: v == null ? 'var(--card-secondary)' : heatColor(v / max), height: cell }}>
                    {cell >= 30 && v != null ? Math.round(v) : ''}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="hg-legend"><span>{lowLabel}</span><div className="hg-bar" /><span>{highLabel}</span></div>
      <style>{`
        .hg-scroll { overflow-x: auto; padding-bottom: 6px; }
        .hg-grid { display: grid; gap: 3px; min-width: 760px; }
        .hg-col { font-size: 10.5px; color: var(--text-secondary); text-align: center; }
        .hg-row { font-size: 12px; font-weight: 600; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hg-cell { border-radius: 5px; font-size: 10px; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; transition: transform .15s; cursor: default; }
        .hg-cell:hover { transform: scale(1.25); z-index: 2; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
        .hg-legend { display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: var(--text-secondary); margin-top: 10px; }
        .hg-bar { height: 10px; width: 180px; border-radius: 99px; background: linear-gradient(90deg, rgb(200,85,61), rgb(233,196,106), rgb(163,177,138), rgb(88,129,87), rgb(52,78,65)); }
      `}</style>
    </div>
  );
}
