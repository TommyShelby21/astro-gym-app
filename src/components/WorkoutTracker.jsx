import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Activity } from 'lucide-react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmt(n, d = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toFixed(d);
}

export default function WorkoutTracker() {
  const [sets, setSets] = useState([]);
  const [form, setForm] = useState({ date: todayISO(), exercise: '', weight: '', reps: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');

  useEffect(() => {
    fetch('/api/workouts').then((r) => r.json()).then(setSets).catch(() => {});
  }, []);

  const exercises = useMemo(() => {
    const names = [...new Set(sets.map((s) => s.exercise))].sort((a, b) => a.localeCompare(b));
    return names;
  }, [sets]);

  useEffect(() => {
    if (!selectedExercise && exercises.length > 0) setSelectedExercise(exercises[0]);
  }, [exercises, selectedExercise]);

  const addSet = async () => {
    setError('');
    const weight = parseFloat(form.weight);
    const reps = parseInt(form.reps, 10);
    if (!form.date || !form.exercise.trim() || Number.isNaN(weight) || weight <= 0 || !Number.isInteger(reps) || reps <= 0) {
      setError('Zadej platné datum, cvik, váhu a opakování.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: form.date, exercise: form.exercise.trim(), weight, reps }),
      });
      const next = await res.json();
      setSets(next);
      setSelectedExercise(form.exercise.trim());
      setForm((f) => ({ ...f, weight: '', reps: '' }));
    } catch (_) {
      setError('Ukládání se nezdařilo, zkus to znovu.');
    } finally {
      setSaving(false);
    }
  };

  const removeSet = async (id) => {
    const res = await fetch('/api/workouts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const next = await res.json();
    setSets(next);
  };

  const sorted = useMemo(() => [...sets].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)), [sets]);

  const exerciseSets = useMemo(
    () => sorted.filter((s) => s.exercise === selectedExercise),
    [sorted, selectedExercise]
  );

  const chartData = useMemo(
    () =>
      exerciseSets.map((s) => ({
        date: s.date.slice(5),
        weight: s.weight,
        reps: s.reps,
      })),
    [exerciseSets]
  );

  const best = useMemo(() => {
    if (exerciseSets.length === 0) return null;
    return exerciseSets.reduce((a, b) => (b.weight > a.weight ? b : a));
  }, [exerciseSets]);

  const recent = [...sorted].reverse().slice(0, 12);

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Activity size={20} color="#6b8a99" />
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Tréninkový log</h2>
      </div>
      <p style={{ color: '#7a828d', fontSize: 13, margin: '2px 0 18px' }}>
        {sets.length} {sets.length === 1 ? 'série' : sets.length < 5 ? 'série' : 'sérií'} zapsáno
      </p>

      <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="lbt-label">Datum</label>
            <input className="lbt-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="lbt-label">Cvik</label>
            <input
              className="lbt-input"
              type="text"
              list="exercise-suggestions"
              placeholder="Bench press"
              value={form.exercise}
              onChange={(e) => setForm((f) => ({ ...f, exercise: e.target.value }))}
            />
            <datalist id="exercise-suggestions">
              {exercises.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="lbt-label">Váha (kg)</label>
            <input className="lbt-input" type="number" step="0.5" placeholder="60" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
          </div>
          <div>
            <label className="lbt-label">Opakování</label>
            <input className="lbt-input" type="number" step="1" placeholder="8" value={form.reps} onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))} />
          </div>
        </div>
        {error && <div style={{ color: '#e07d7d', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button className="lbt-btn" onClick={addSet} disabled={saving}>
          <Plus size={16} /> {saving ? 'Ukládám…' : 'Přidat sérii'}
        </button>
      </div>

      {exercises.length > 0 && (
        <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 14, padding: '18px 12px 8px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span className="lbt-label" style={{ marginBottom: 0 }}>Progres cviku</span>
            <select
              className="lbt-input"
              style={{ width: 'auto', minWidth: 140 }}
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              {exercises.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          {best && (
            <div className="lbt-num" style={{ fontSize: 12, color: '#8a919b', padding: '0 8px', marginBottom: 8 }}>
              nejlepší: {fmt(best.weight)} kg × {best.reps} ({best.date})
            </div>
          )}
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#23272d" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#5c636d" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#23272d' }} />
                <YAxis stroke="#5c636d" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ background: '#1a1d21', border: '1px solid #2c3138', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9aa4b0' }}
                  itemStyle={{ color: '#6b8a99' }}
                  formatter={(value, name, props) => [`${value} kg × ${props.payload.reps}`, 'váha']}
                />
                <Line type="monotone" dataKey="weight" stroke="#6b8a99" strokeWidth={2} dot={{ r: 2.5, fill: '#6b8a99' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: '#5c636d', fontSize: 13, padding: '8px 8px 18px' }}>Potřeba aspoň 2 záznamy tohoto cviku pro graf.</div>
          )}
        </div>
      )}

      <div>
        <span className="lbt-label">Poslední série</span>
        {recent.length === 0 ? (
          <div style={{ color: '#5c636d', fontSize: 13, marginTop: 8 }}>Zatím žádné záznamy.</div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {recent.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#171a1e', border: '1px solid #23272d', borderRadius: 10, marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span className="lbt-num" style={{ fontSize: 12, color: '#7a828d', minWidth: 74 }}>{s.date}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{s.exercise}</span>
                  <span className="lbt-num" style={{ fontSize: 12, color: '#7a828d' }}>{fmt(s.weight)} kg × {s.reps}</span>
                </div>
                <button onClick={() => removeSet(s.id)} style={{ background: 'transparent', border: 'none', color: '#5c636d', cursor: 'pointer', padding: 4 }} aria-label="Smazat sérii">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
