"use client";
import { useEffect, useState } from 'react';
import { getMetricsSnapshot, onMetrics, resetMetrics, exportMetricsJSON, importMetricsJSON, setMetricsPaused, isMetricsPaused } from '@/src/lib/apiMetrics';

type Snap = ReturnType<typeof getMetricsSnapshot>;

export default function ApiOverlay() {
  const [open, setOpen] = useState(true);
  const [snap, setSnap] = useState<Snap>(getMetricsSnapshot());
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'avg' | 'error'>('total');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [paused, setPaused] = useState(isMetricsPaused());
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const off = onMetrics((s) => setSnap(getMetricsSnapshot()));
    return () => off();
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 2000 }}
        className="btn"
        aria-label="Open API metrics"
      >
        API
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', right: 12, bottom: 12, zIndex: 2000,
        width: 280, background: 'var(--card)', color: 'var(--fg)',
        border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow)'
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <strong>API Metrics</strong>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => { resetMetrics(); setSnap(getMetricsSnapshot()); localStorage.removeItem('apiMetrics'); }} aria-label="Reset metrics">Reset</button>
          <button className="btn btn-ghost" onClick={() => {
            const blob = new Blob([exportMetricsJSON()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'api-metrics.json'; a.click(); URL.revokeObjectURL(url);
          }} aria-label="Export metrics">Export</button>
          <button className="btn btn-ghost" onClick={() => setImporting((v) => !v)} aria-expanded={importing} aria-controls="api-import">Import</button>
          <label className="row">
            <span className="muted">Pause</span>
            <input type="checkbox" checked={paused} onChange={(e) => { setPaused(e.target.checked); setMetricsPaused(e.target.checked); }} />
          </label>
          <label className="row">
            <span className="muted">Errors only</span>
            <input type="checkbox" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} />
          </label>
          <button className="btn btn-ghost" onClick={() => setOpen(false)} aria-label="Close API metrics">✕</button>
        </div>
      </div>
      <div style={{ padding: 10, display: 'grid', gap: 10, fontSize: 13, maxHeight: 360, overflow: 'auto' }}>
        {importing && (
          <div id="api-import" style={{ display: 'grid', gap: 6 }}>
            <label className="label">Import metrics JSON</label>
            <input className="input" type="file" accept="application/json,.json" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              const ok = importMetricsJSON(text);
              if (ok) setSnap(getMetricsSnapshot());
            }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <div>Total: {snap.total}</div>
          <div>Success: {snap.success}</div>
          <div>Error: {snap.error}</div>
          <div>Avg: {snap.avgMs} ms</div>
          <div>Since: {new Date(snap.since).toLocaleTimeString()}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="input"
            placeholder="Filter endpoint (e.g. /api/tasks)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <label className="row">
            <span className="muted">Sort</span>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'total' | 'avg' | 'error')}>
              <option value="total">Requests</option>
              <option value="avg">Avg time</option>
              <option value="error">Errors</option>
            </select>
          </label>
        </div>
        <section>
          <div className="muted" style={{ marginBottom: 4 }}>Top endpoints (avg/p50/p95/p99 ms)</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {Object.entries(snap.perEndpoint)
              .filter(([k]) => !filter || k.toLowerCase().includes(filter.toLowerCase()))
              .map(([k, v]) => ({ key: k, avg: Math.round(v.totalDurationMs / (v.total || 1)), total: v.total, error: v.error, samples: v.samples || [] }))
              .sort((a, b) => sortBy === 'avg' ? b.avg - a.avg : sortBy === 'error' ? b.error - a.error : b.total - a.total)
              .slice(0, 6)
              .map((e) => (
                <div key={e.key} style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setSelected(e.key)} title="Click to view details">
                  <span>{e.key}</span>
                  <span>{e.avg} / {pctl(e.samples, 50)} / {pctl(e.samples, 95)} / {pctl(e.samples, 99)} ms · {e.total} req · {e.error} err</span>
                </div>
              ))}
            {Object.keys(snap.perEndpoint).length === 0 && <span className="muted">None</span>}
          </div>
        </section>
        {selected && (
          <section>
            <div className="muted" style={{ marginBottom: 4 }}>Details for {selected}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <button className="btn" onClick={() => setFilter(selected || '')}>Filter</button>
              <button className="btn" onClick={() => setSelected(null)}>Clear</button>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {(() => {
                const ep = snap.perEndpoint[selected!];
                if (!ep) return <span className="muted">No data</span>;
                const last = ep.samples.slice(-10).reverse();
                return last.map((ms, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sample {last.length - idx}</span>
                    <span>{ms} ms</span>
                  </div>
                ));
              })()}
            </div>
          </section>
        )}
        <section>
          <div className="muted" style={{ marginBottom: 4 }}>Recent (last 10)</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {snap.history
              .filter((h) => !filter || (typeof h.url === 'string' ? h.url : h.url.toString()).toLowerCase().includes(filter.toLowerCase()))
              .filter((h) => !errorsOnly || !h.ok)
              .slice(-10)
              .reverse()
              .map((h, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{(h.method || 'GET')} {typeof h.url === 'string' ? h.url : h.url.toString()}</span>
                <span>{h.status} · {h.durationMs}ms</span>
              </div>
            ))}
            {snap.history.length === 0 && <span className="muted">None</span>}
          </div>
        </section>
        <section>
          <div className="muted" style={{ marginBottom: 4 }}>Errors (last 10)</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {snap.history
              .filter((h) => !h.ok)
              .filter((h) => !filter || (typeof h.url === 'string' ? h.url : h.url.toString()).toLowerCase().includes(filter.toLowerCase()))
              .slice(-10)
              .reverse()
              .map((h, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{(h.method || 'GET')} {typeof h.url === 'string' ? h.url : h.url.toString()}</span>
                <span>{h.status} · {h.durationMs}ms</span>
              </div>
            ))}
            {snap.history.filter((h) => !h.ok).length === 0 && <span className="muted">None</span>}
          </div>
        </section>
        <section>
          <div className="muted" style={{ marginBottom: 4 }}>Status codes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(snap.byStatus).map(([code, count]) => (
              <span key={code} className="badge" style={{ background: 'var(--border)', color: 'var(--fg)' }}>{code}:{count as number}</span>
            ))}
            {Object.keys(snap.byStatus).length === 0 && <span className="muted">None</span>}
          </div>
        </section>
      </div>
    </div>
  );
}

function pctl(samples: number[], p: number) {
  if (!samples || samples.length === 0) return 0;
  const arr = [...samples].sort((a, b) => a - b);
  const idx = Math.min(arr.length - 1, Math.max(0, Math.floor((p / 100) * arr.length) - 1));
  return arr[idx];
}
