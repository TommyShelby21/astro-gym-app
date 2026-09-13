import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, BarChart3, Calendar, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DailyHabits() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const today = new Date().toISOString().slice(0, 10);

  // Load from localStorage on mount
  useEffect(() => {
    const savedHabits = localStorage.getItem('peak_habits');
    const savedCompletions = localStorage.getItem('peak_completions');

    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      // Default habits for new users
      setHabits([
        { id: 1, name: '1 hodina učení' },
        { id: 2, name: 'Ranní stretching' },
        { id: 3, name: '100 dřepů' }
      ]);
    }

    if (savedCompletions) {
      setCompletions(JSON.parse(savedCompletions));
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('peak_habits', JSON.stringify(habits));
    localStorage.setItem('peak_completions', JSON.stringify(completions));
  }, [habits, completions]);

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now(),
      name: newHabitName.trim()
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
  };

  const removeHabit = (id, e) => {
    e.stopPropagation();
    setHabits(habits.filter(h => h.id !== id));
    setCompletions(completions.filter(c => c.habitId !== id));
  };

  const toggleHabit = (habitId) => {
    const isDone = completions.some(c => c.habitId === habitId && c.date === selectedDate);
    if (isDone) {
      setCompletions(completions.filter(c => !(c.habitId === habitId && c.date === selectedDate)));
    } else {
      setCompletions([...completions, { habitId, date: selectedDate }]);
    }
  };

  const isCompleted = (habitId) => {
    return completions.some(c => c.habitId === habitId && c.date === selectedDate);
  };

  const statsData = (() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = completions.filter(c => c.date === dateStr).length;
      data.push({
        name: d.toLocaleDateString('cs-CZ', { weekday: 'short' }),
        count: count,
        fullDate: dateStr
      });
    }
    return data;
  })();

  return (
    <div style={{ marginTop: 40, borderTop: '1px solid #23272d', paddingTop: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={22} color="#7fd99b" />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Denní činnosti</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="date"
            className="lbt-input"
            style={{ width: 'auto', padding: '5px 10px' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="lbt-ghost" onClick={() => setShowStats(!showStats)}>
            <BarChart3 size={16} /> {showStats ? 'Zobrazit seznam' : 'Statistiky'}
          </button>
        </div>
      </div>

      {!showStats ? (
        <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              className="lbt-input"
              placeholder="Nová činnost (např. 1 hodina učení)"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            />
            <button className="lbt-btn" onClick={addHabit}>
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {habits.length === 0 && (
              <p style={{ color: '#5c636d', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Zatím nemáš žádné činnosti.</p>
            )}
            {habits.map(habit => (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: isCompleted(habit.id) ? '#1b2b22' : '#1a1d21',
                  border: `1px solid ${isCompleted(habit.id) ? '#3f7a54' : '#2c3138'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isCompleted(habit.id) ? (
                    <CheckCircle2 size={20} color="#7fd99b" />
                  ) : (
                    <Circle size={20} color="#5c636d" />
                  )}
                  <span style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: isCompleted(habit.id) ? '#7fd99b' : '#e8e6e1',
                    textDecoration: isCompleted(habit.id) ? 'line-through' : 'none',
                    opacity: isCompleted(habit.id) ? 0.7 : 1
                  }}>
                    {habit.name}
                  </span>
                </div>
                <button
                  onClick={(e) => removeHabit(habit.id, e)}
                  style={{ background: 'transparent', border: 'none', color: '#5c636d', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: '#171a1e', border: '1px solid #23272d', borderRadius: 14, padding: '18px 12px 8px' }}>
          <div style={{ padding: '0 8px', marginBottom: 16 }}>
            <span className="lbt-label">Splněné činnosti (posledních 7 dní)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statsData} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#23272d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#5c636d" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#23272d' }} />
              <YAxis stroke="#5c636d" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{fill: '#23272d'}}
                contentStyle={{ background: '#1a1d21', border: '1px solid #2c3138', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#7fd99b' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fullDate === today ? '#7fd99b' : '#3f6e7a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
