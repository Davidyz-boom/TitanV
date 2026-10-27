import { useEffect, useState } from 'react';

const CookieBanner = () => {
  const COOKIE_NAME = 'titanv_cookies_aceptadas';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof document === 'undefined') return;
      const valor = document.cookie.split('; ').find((fila) => fila.startsWith(`${COOKIE_NAME}=`));
      if (!valor) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const aceptar = () => {
    try {
      const fecha = new Date();
      fecha.setFullYear(fecha.getFullYear() + 1);
      document.cookie = `${COOKIE_NAME}=true; expires=${fecha.toUTCString()}; path=/; SameSite=Lax`;
    } finally {
      setVisible(false);
    }
  };

  const rechazar = () => {
    // No guardamos la preferencia de rechazo, pero ocultamos el banner.
    // No se crean cookies de seguimiento.
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 'min(96%, 720px)',
        background: 'rgba(16, 21, 31, 0.98)',
        color: '#fff',
        border: '1px solid rgba(255, 214, 10, 0.5)',
        borderRadius: 12,
        boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.6,
          color: '#e2e8f0',
          flex: 1,
          minWidth: 260,
        }}
      >
        Utilizamos cookies estrictamente necesarias para el funcionamiento de la aplicación y para mantener la
        sesión del usuario. No utilizamos cookies de análisis ni de seguimiento publicitario.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={rechazar}
          style={{
            background: 'transparent',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 999,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Rechazar
        </button>
        <button
          onClick={aceptar}
          style={{
            background: '#ffd60a',
            color: '#000',
            border: 'none',
            borderRadius: 999,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
