import { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ACCENTS = [
  { id: 'blue', color: '#3b82f6' },
  { id: 'emerald', color: '#10b981' },
  { id: 'violet', color: '#8b5cf6' },
  { id: 'amber', color: '#f59e0b' }
];

export default function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="theme-customizer-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="icon-btn theme-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Customize theme"
      >
        <Palette size={16} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow)',
          padding: '16px',
          width: '220px',
          zIndex: 100
        }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mode
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => theme !== 'light' && toggleTheme()}
                type="button"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 0',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'light' ? 'var(--accent-primary, #3b82f6)' : 'var(--border)'}`,
                  background: theme === 'light' ? 'var(--accent-light, #dbeafe)' : 'transparent',
                  color: theme === 'light' ? 'var(--accent-primary, #1d4ed8)' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                <Sun size={14} /> Light
              </button>
              <button 
                onClick={() => theme !== 'dark' && toggleTheme()}
                type="button"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 0',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? 'var(--accent-primary, #60a5fa)' : 'var(--border)'}`,
                  background: theme === 'dark' ? 'var(--accent-light, rgba(96, 165, 250, 0.2))' : 'transparent',
                  color: theme === 'dark' ? 'var(--accent-primary, #60a5fa)' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                <Moon size={14} /> Dark
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Color
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  type="button"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: a.color,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: accent === a.id ? `0 0 0 2px var(--surface), 0 0 0 4px ${a.color}` : 'none',
                    transition: 'all 0.2s'
                  }}
                  title={a.id}
                >
                  {accent === a.id && <Check size={14} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
