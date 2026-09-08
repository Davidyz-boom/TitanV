import React, { useState } from 'react';

interface CuentaFlotanteProps {
  onLogout?: () => void;
}

export const CuentaFlotante: React.FC<CuentaFlotanteProps> = ({ onLogout }) => {
  const [expandido, setExpandido] = useState(true);

  const nombre = localStorage.getItem('usuario_nombre') || 'Usuario Titan V';
  const correo = localStorage.getItem('usuario_correo') || 'sesion@titanv.com';
  const rolNum = Number(localStorage.getItem('usuario_rol') || '3');

  // Iniciales del usuario
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

  // Formato y estilos de rol
  const infoRol = () => {
    switch (rolNum) {
      case 1:
        return {
          texto: '👑 Administrador',
          colorTexto: '#000000',
          fondoBadge: '#ffd60a',
          bordeBadge: '#eab308',
          descripcion: 'Acceso Total al Sistema',
        };
      case 2:
        return {
          texto: '📋 Supervisor de Obra',
          colorTexto: '#065f46',
          fondoBadge: '#a7f3d0',
          bordeBadge: '#10b981',
          descripcion: 'Supervisión y Reportes',
        };
      case 3:
      default:
        return {
          texto: '🛠️ Operario / Usuario',
          colorTexto: '#1e3a8a',
          fondoBadge: '#bfdbfe',
          bordeBadge: '#3b82f6',
          descripcion: 'Paneles de su Obra Asignada',
        };
    }
  };

  const configRol = infoRol();

  return (
    <aside
      aria-label="Panel de cuenta activa"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: 'rgba(18, 20, 24, 0.95)',
        border: '1px solid rgba(255, 214, 10, 0.45)',
        borderRadius: '16px',
        padding: expandido ? '14px 18px' : '10px 14px',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.65), 0 0 20px rgba(255, 214, 10, 0.15)',
        backdropFilter: 'blur(12px)',
        color: '#ffffff',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.3s ease',
        maxWidth: '380px',
      }}
    >
      {/* Avatar con iniciales y estado en línea */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: rolNum === 1 ? '#ffd60a' : '#1e293b',
            color: rolNum === 1 ? '#000000' : '#ffd60a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '15px',
            border: '2px solid #ffd60a',
            boxShadow: '0 0 10px rgba(255, 214, 10, 0.3)',
          }}
        >
          {iniciales || 'TV'}
        </div>
        {/* Punto verde de conexión activa */}
        <span
          title="Sesión activa"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '12px',
            height: '12px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            border: '2px solid #121418',
            boxShadow: '0 0 6px #22c55e',
          }}
        />
      </div>

      {/* Información del usuario y rol si está expandido */}
      {expandido && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '170px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', letterSpacing: '0.2px' }}>
              {nombre}
            </span>
          </div>

          <span style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>
            {correo}
          </span>

          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                backgroundColor: configRol.fondoBadge,
                color: configRol.colorTexto,
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                border: `1px solid ${configRol.bordeBadge}`,
                letterSpacing: '0.3px',
              }}
            >
              {configRol.texto}
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción (minimizar / cerrar sesión) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          title={expandido ? 'Minimizar tarjeta de usuario' : 'Expandir tarjeta de usuario'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
          }}
        >
          <i className={`fas ${expandido ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        )}
      </div>
    </aside>
  );
};
