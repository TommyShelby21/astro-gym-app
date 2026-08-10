import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Settings2, Dumbbell } from 'lucide-react';
import WorkoutTracker from './WorkoutTracker.jsx';

const DEFAULT_TARGETS = { calories: 3075, protein: 165, fat: 75 };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmt(n, d = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toFixed(d);
}
function daysAgo(dateStr) {
  return Math.floor((new Date(todayISO()) - new Date(dateStr)) / 86400000);
}
function windowAvg(entries, minDaysAgo, maxDaysAgo) {
  const vals = entries
    .filter((e) => {
      const d = daysAgo(e.date);
      return d >= minDaysAgo && d < maxDaysAgo;
    })
    .map((e) => e.weight);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function Tracker() {
  const [entries, setEntries] = useState([]);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [showTargets, setShowTargets] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), weight: '', calories: '', protein: '', fat: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/entries').then((r) => r.json()).then(setEntries).catch(() => {});
    fetch('/api/targets').then((r) => r.json()).then(setTargets).catch(() => {});
  }, []);

  const addEntry = async () => {
    setError('');
    const weight = parseFloat(form.weight);
    if (!form.date || Number.isNaN(weight) || weight <= 0) {
      setError('Zadej platné datum a váhu.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          weight,
          calories: form.calories === '' ? null : parseFloat(form.calories),
          protein: form.protein === '' ? null : parseFloat(form.protein),
          fat: form.fat === '' ? null : parseFloat(form.fat),
        }),
      });
      const next = await res.json();
      setEntries(next);
      setForm({ date: todayISO(), weight: '', calories: '', protein: '', fat: '' });
    } catch (_) {
      setError('Ukládání se nezdařilo, zkus to znovu.');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (date) => {
    const res = await fetch('/api/entries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    const next = await res.json();
    setEntries(next);
  };

  const saveTargets = async (next) => {
    setTargets(next);
    await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  };

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);
  const thisWeekAvg = useMemo(() => windowAvg(sorted, 0, 7), [sorted]);
  const lastWeekAvg = useMemo(() => windowAvg(sorted, 7, 14), [sorted]);
  const weeklyChange = thisWeekAvg !== null && lastWeekAvg !== null ? thisWeekAvg - lastWeekAvg : null;

  const recommendation = useMemo(() => {
    if (weeklyChange === null) {
      const have = sorted.filter((e) => daysAgo(e.date) < 14).length;
      return { tone: 'neutral', text: `Potřebuju aspoň 2 týdny záznamů vah pro doporučení (zatím ${have} dní zapsáno).` };
    }
    if (weeklyChange < 0.1) return { tone: 'low', text: `Váha týdně roste jen o ${fmt(weeklyChange)} kg — přidej 100–150 kcal/den.` };
    if (weeklyChange > 0.6) return { tone: 'high', text: `Váha týdně roste o ${fmt(weeklyChange)} kg — moc, uber 150–200 kcal/den.` };
    return { tone: 'good', text: `Váha týdně roste o ${fmt(weeklyChange)} kg — přesně v pásmu lean bulku, drž tempo.` };
  }, [weeklyChange, sorted]);

  const chartData = useMemo(() => sorted.map((e) => ({ date: e.date.slice(5), weight: e.weight })), [sorted]);
  const carbTarget = Math.max(0, Math.round((targets.calories - targets.protein * 4 - targets.fat * 9) / 4));

  const avgCalories = useMemo(() => {
    const vals = sorted.filter((e) => daysAgo(e.date) < 7 && e.calories !== null).map((e) => e.calories);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [sorted]);
  const avgProtein = useMemo(() => {
    const vals = sorted.filter((e) => daysAgo(e.date) < 7 && e.protein !== null).map((e) => e.protein);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [sorted]);

  const toneStyles = {
    good: { bg: '#1b2b22', border: '#3f7a54', text: '#7fd99b', icon: Minus },
    low: { bg: '#2b2416', border: '#8a6a2a', text: '#e0b354', icon: TrendingDown },
    high: { bg: '#2b1a1a', border: '#8a3a3a', text: '#e07d7d', icon: TrendingUp },
    neutral: { bg: '#1c1f24', border: '#3a4048', text: '#9aa4b0', icon: Minus },
  };
  const t = toneStyles[recommendation.tone];
  const Icon = t.icon;
  const recent = [...sorted].reverse().slice(0, 10);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#111316', color: '#e8e6e1', minHeight: '100vh', padding: '28px 20px', boxSizing: 'border-box' }}>
      <style>{`
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8); }
        .lbt-num { font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace; }
        .lbt-input { background: #1a1d21; border: 1px solid #2c3138; color: #e8e6e1; border-radius: 8px; padding: 9px 10px; font-size: 14px; font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace; width: 100%; outline: none; }
        .lbt-input:focus { border-color: #6b8a99; }
        .lbt-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a828d; margin-bottom: 5px; display: block; }
        .lbt-btn { background: #3f6e7a; color: #eaf3f4; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .lbt-btn:hover { background: #4a808d; }
        .lbt-ghost { background: transparent; border: 1px solid #2c3138; color: #9aa4b0; border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .lbt-ghost:hover { border-color: #4a808d; color: #e8e6e1; }
      `}</style>

      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Dumbbell size={22} color="#6b8a99" />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Bulk Track</h1>
        </div>
        <p style={{ color: '#7a828d', fontSize: 13, margin: '2px 0 22px' }}>
          {sorted.length} {sorted.length === 1 ? 'záznam' : sorted.length < 5 ? 'záznamy' : 'záznamů'} · cíl +0,25–0,5 kg/týden
        </p>

        <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
          <Icon size={18} color={t.text} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ color: t.text, fontWeight: 600, fontSize: 14 }}>{recommendation.text}</div>
            {thisWeekAvg !== null && (
              <div className="lbt-num" style={{ fontSize: 12, color: '#8a919b', marginTop: 4 }}>
                týdenní průměr: {fmt(thisWeekAvg)} kg{lastWeekAvg !== null && ` (minulý týden ${fmt(lastWeekAvg)} kg)`}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="lbt-label">Datum</label>
              <input className="lbt-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="lbt-label">Váha (kg)</label>
              <input className="lbt-input" type="number" step="0.1" placeholder="75.0" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
            </div>
            <div>
              <label className="lbt-label">Kalorie</label>
              <input className="lbt-input" type="number" placeholder={targets.calories} value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} />
            </div>
            <div>
              <label className="lbt-label">Bílkoviny (g)</label>
              <input className="lbt-input" type="number" placeholder={targets.protein} value={form.protein} onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))} />
            </div>
            <div>
              <label className="lbt-label">Tuky (g)</label>
              <input className="lbt-input" type="number" placeholder={targets.fat} value={form.fat} onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))} />
            </div>
          </div>
          {error && <div style={{ color: '#e07d7d', fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button className="lbt-btn" onClick={addEntry} disabled={saving}>
            <Plus size={16} /> {saving ? 'Ukládám…' : 'Uložit záznam'}
          </button>
        </div>

        {sorted.length >= 2 && (
          <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 14, padding: '18px 12px 8px', marginBottom: 20 }}>
            <div style={{ padding: '0 8px', marginBottom: 6 }}>
              <span className="lbt-label" style={{ marginBottom: 0 }}>Trend váhy</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#23272d" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#5c636d" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#23272d' }} />
                <YAxis stroke="#5c636d" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={{ background: '#1a1d21', border: '1px solid #2c3138', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#9aa4b0' }} itemStyle={{ color: '#6b8a99' }} />
                <Line type="monotone" dataKey="weight" stroke="#6b8a99" strokeWidth={2} dot={{ r: 2.5, fill: '#6b8a99' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 12, padding: 14 }}>
            <span className="lbt-label">Ø kalorie (7 dní)</span>
            <div className="lbt-num" style={{ fontSize: 20, fontWeight: 700 }}>
              {avgCalories !== null ? Math.round(avgCalories) : '—'}
              <span style={{ fontSize: 13, color: '#7a828d', fontWeight: 400 }}> / {targets.calories}</span>
            </div>
          </div>
          <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 12, padding: 14 }}>
            <span className="lbt-label">Ø bílkoviny (7 dní)</span>
            <div className="lbt-num" style={{ fontSize: 20, fontWeight: 700 }}>
              {avgProtein !== null ? Math.round(avgProtein) : '—'}
              <span style={{ fontSize: 13, color: '#7a828d', fontWeight: 400 }}> / {targets.protein} g</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <button className="lbt-ghost" onClick={() => setShowTargets((s) => !s)}>
            <Settings2 size={14} /> {showTargets ? 'Skrýt cíle' : 'Upravit cíle'}
          </button>
          {showTargets && (
            <div style={{ marginTop: 10, background: '#171a1e', border: '1px solid #23272d', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
              <div>
                <label className="lbt-label">Cíl kalorie</label>
                <input className="lbt-input" type="number" value={targets.calories} onChange={(e) => saveTargets({ ...targets, calories: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="lbt-label">Cíl bílkoviny (g)</label>
                <input className="lbt-input" type="number" value={targets.protein} onChange={(e) => saveTargets({ ...targets, protein: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="lbt-label">Cíl tuky (g)</label>
                <input className="lbt-input" type="number" value={targets.fat} onChange={(e) => saveTargets({ ...targets, fat: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="lbt-label">Sacharidy (dopočet)</label>
                <div className="lbt-num" style={{ padding: '9px 10px', fontSize: 14, color: '#9aa4b0' }}>~{carbTarget} g</div>
              </div>
            </div>
          )}
        </div>

        <div>
          <span className="lbt-label">Poslední záznamy</span>
          {recent.length === 0 ? (
            <div style={{ color: '#5c636d', fontSize: 13, marginTop: 8 }}>Zatím žádné záznamy.</div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {recent.map((e) => (
                <div key={e.date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#171a1e', border: '1px solid #23272d', borderRadius: 10, marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
                    <span className="lbt-num" style={{ fontSize: 12, color: '#7a828d', minWidth: 74 }}>{e.date}</span>
                    <span className="lbt-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(e.weight)} kg</span>
                    <span className="lbt-num" style={{ fontSize: 12, color: '#7a828d' }}>
                      {e.calories !== null ? `${e.calories} kcal` : ''}
                      {e.protein !== null ? ` · ${e.protein}g P` : ''}
                      {e.fat !== null ? ` · ${e.fat}g F` : ''}
                    </span>
                  </div>
                  <button onClick={() => removeEntry(e.date)} style={{ background: 'transparent', border: 'none', color: '#5c636d', cursor: 'pointer', padding: 4 }} aria-label="Smazat záznam">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <WorkoutTracker />
      </div>
    </div>
  );
}
