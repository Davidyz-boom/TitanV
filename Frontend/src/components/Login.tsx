import React, { useState } from 'react';
import { CardAccion } from './CardAccion';
import Registro from './Registro';
// IMPORTACIÓN CORRECTA DEL VIDEO DESDE TU CARPETA ASSETS
import videoLogin from '../assets/video_login.mp4'; 
import logoImg from '../assets/logo.png'; 

export interface LoginProps {
  correo: string;
  contrasena: string;
  onCorreoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContrasenaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnviar: (e: React.FormEvent) => void;
  onGoogleLogin?: () => void;
  onVolverPrincipal?: () => void;
}

export const Login: React.FC<LoginProps> = ({
  correo,
  contrasena,
  onCorreoChange,
  onContrasenaChange,
  onEnviar,
  onGoogleLogin,
  onVolverPrincipal,
}) => {

  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const manejarRegistro = (datos: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    usuario: string;
    contrasena: string;
  }) => {
    console.log('Módulo Login - Registro recibido:', datos);
    setMostrarRegistro(false);
  };

  if (mostrarRegistro) {
    return (
      <Registro
        onRegistrar={manejarRegistro}
        onVolver={() => setMostrarRegistro(false)}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* VIDEO DE FONDO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}
      >
        <source src={videoLogin} type="video/mp4" />
        Tu navegador no soporta videos de fondo.
      </video>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 2
      }} />

      {/* TARJETA DEL FORMULARIO DE INICIO DE SESIÓN */}
      <div style={{
        backgroundColor: 'rgba(30, 30, 30, 0.88)',
        backdropFilter: 'blur(12px)',
        padding: '36px 32px 32px',
        borderRadius: '14px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(255, 204, 0, 0.2)',
        width: '360px',
        textAlign: 'center',
        border: '1px solid #333',
        position: 'relative',
        zIndex: 3
      }}>

        {/* FLECHA PARA VOLVER AL PORTAL PRINCIPAL */}
        {onVolverPrincipal && (
          <button
            type="button"
            onClick={onVolverPrincipal}
            title="Volver al portal principal"
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              background: 'rgba(255, 204, 0, 0.15)',
              border: '1px solid rgba(255, 204, 0, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ffcc00',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            <i className="fas fa-arrow-left"></i> Inicio
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#141414',
            border: '2px solid #ffcc00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 0 12px rgba(255, 204, 0, 0.35)',
            flexShrink: 0,
          }}>
            <img src={logoImg} alt="Titan V Logo" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
          </div>
          <h2 style={{
            color: '#fff',
            margin: 0,
            fontSize: '26px',
            letterSpacing: '1px'
          }}>
            TITAN <span style={{ color: '#ffcc00' }}>V</span>
          </h2>
        </div>

        <p style={{
          color: '#aaa',
          fontSize: '14px',
          marginBottom: '22px'
        }}>
          Bienvenido al Sistema de Gestión de Obra
        </p>

        <form onSubmit={onEnviar}>

          <CardAccion
            label="Correo Electrónico"
            tipo="email"
            placeholder="correo@ejemplo.com"
            valor={correo}
            onChange={onCorreoChange}
          />

          <CardAccion
            label="Contraseña"
            tipo="password"
            placeholder="********"
            valor={contrasena}
            onChange={onContrasenaChange}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ffcc00',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px',
              fontSize: '15px',
              color: '#000',
              transition: 'background 0.2s',
            }}
          >
            Iniciar Sesión
          </button>

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 14px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <span style={{ padding: '0 10px', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>o</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Botón de Inicio con Google */}
          {onGoogleLogin && (
            <button
              type="button"
              onClick={onGoogleLogin}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Continuar con Google
            </button>
          )}

        </form>

        <div style={{
          marginTop: '22px',
          fontSize: '12px'
        }}>

          <span style={{ color: '#888' }}>
            ¿No tienes cuenta?{' '}
          </span>

          <button
            type="button"
            onClick={() => setMostrarRegistro(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffcc00',
              textDecoration: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px',
              padding: 0
            }}
          >
            Regístrate aquí
          </button>

        </div>

      </div>
    </div>
  );
};
