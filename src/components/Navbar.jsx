import React from 'react';
import { TrendingUp, Calendar, User } from 'lucide-react';

export default function Navbar({ activeView, onViewChange }) {
  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '20px', 
      marginBottom: '30px',
      padding: '10px',
      background: '#171a1e',
      borderRadius: '12px',
      border: '1px solid #23272d'
    }}>
      <button 
        onClick={() => onViewChange('physical')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          color: activeView === 'physical' ? '#7fd99b' : '#7a828d',
          fontWeight: activeView === 'physical' ? '700' : '500',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          backgroundColor: activeView === 'physical' ? '#1b2b22' : 'transparent'
        }}
      >
        <TrendingUp size={18} />
        <span>Tělo</span>
      </button>
      
      <button 
        onClick={() => onViewChange('productivity')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          color: activeView === 'productivity' ? '#7fd99b' : '#7a828d',
          fontWeight: activeView === 'productivity' ? '700' : '500',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          backgroundColor: activeView === 'productivity' ? '#1b2b22' : 'transparent'
        }}
      >
        <Calendar size={18} />
        <span>Produktivita</span>
      </button>
    </nav>
  );
}
