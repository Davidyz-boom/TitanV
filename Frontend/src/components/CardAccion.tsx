import React from 'react';
export interface CardAccionProps {
  label: string;
  tipo?: string;
  placeholder?: string;
  valor: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CardAccion: React.FC<CardAccionProps> = ({ label, tipo = 'text', placeholder, valor, onChange }) => {
  return (
    <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column' }}>
      <label style={{ color: '#ccc', fontSize: '14px', marginBottom: '5px' }}>{label}</label>
      <input
        type={tipo}
        placeholder={placeholder}
        value={valor}
        onChange={onChange}
        style={{
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #444',
          backgroundColor: '#222',
          color: '#fff',
          outline: 'none'
        }}
      />
    </div>
  );
};
