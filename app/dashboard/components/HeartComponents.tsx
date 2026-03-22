'use client';
import { useState } from 'react';

export function HeartRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2, 3].map(i => (
        <span key={i}
          onClick={() => onChange(value === i ? 0 : i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          style={{ fontSize: 22, cursor: 'pointer', color: (hovered >= i || value >= i) ? '#E8151B' : '#E0E0E0', transition: 'color 0.15s', display: 'inline-block', userSelect: 'none' }}>♥</span>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 10, color: '#E8151B', fontWeight: 700 }}>
          {value === 1 ? 'Intéressant' : value === 2 ? "J'aime bien" : 'Coup de cœur !'}
        </span>
      )}
    </div>
  );
}

export function HeartDisplay({ value }: { value: number }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ fontSize: 10, color: i <= value ? '#E8151B' : '#E0E0E0' }}>♥</span>
      ))}
    </div>
  );
}
