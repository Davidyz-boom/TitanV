import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Login } from '../components/Login';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

interface AceptarInvitacionPageProps {
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
}

const ROL_LABEL: Record<string, string> = {
  Arquitecto: 'Arquitecto',
  Trabajador: 'Trabajador',
  Visualizador: 'Visualizador',
};

const RESTRICCIONES: Record<string, string[]> = {
  Arquitecto: ['Control total del proyecto', 'Invita colaboradores por correo o enlace', 'Gestiona roles, evidencias e inventario'],
  Trabajador: ['Crea y actualiza tareas y turnos', 'Sube evidencias de avance del proyecto', 'Registra entradas/salidas de material'],
  Visualizador: ['Solo lectura: ver tareas, turnos, evidencias e inventario', 'No puede crear, editar ni eliminar registros'],
};

const AceptarInvitacionPage = ({ isLoggedIn, onLoginSuccess }: AceptarInvitacionPageProps) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [estado, setEstado] = useState<'cargando' | 'error' | 'ok'>('cargando');
  const [mensaje, setMensaje] = useState('');
  const [rol, setRol] = useState('');

  // Login controlado, igual que en LoginPage, para reutilizar el componente Login
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  useEffect(() => {
    // Deja una marca de "hay una invitación pendiente" para que App.tsx no
    // redirija a /dashboard apenas se inicie sesión — primero se acepta el link.
    sessionStorage.setItem('invitacion_pendiente', token || '');

    if (isLoggedIn) {
      aceptarInvitacion();
    } else {
      setEstado('error');
      setMensaje('__necesita_login__');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const aceptarInvitacion = async () => {
    setEstado('cargando');
    try {
      const tokenSesion = localStorage.getItem('token');
      const respuesta = await fetch(`${API_URL}/invitaciones/${token}/aceptar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenSesion}` },
      });
      const data = await respuesta.json();

      if (!respuesta.ok) throw new Error(data?.detail || 'El enlace no es válido.');

      sessionStorage.removeItem('invitacion_pendiente');
      setRol(data.rol);
      setMensaje(data.mensaje);
      setEstado('ok');
    } catch (err: any) {
      setEstado('error');
      setMensaje(err.message || 'No se pudo procesar la invitación.');
    }
  };

  const handleEnviarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo_electronico: correo, contrasena }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data?.detail || 'Credenciales incorrectas.');

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario_id', String(data.usuario_id));
      localStorage.setItem('usuario_nombre', data.nombre || correo);
      onLoginSuccess();
      // El useEffect de arriba corre de nuevo (isLoggedIn ahora true) y acepta la invitación.
    } catch (err: any) {
      alert(err.message || 'No se pudo iniciar sesión.');
    }
  };

  if (estado === 'cargando') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', color: 'white' }}>
        <p>Procesando invitación...</p>
      </div>
    );
  }

  if (estado === 'error' && mensaje === '__necesita_login__') {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '20px', background: '#000', color: '#ffd60a', fontWeight: 700 }}>
          Te invitaron a un proyecto en Titan V — inicia sesión para unirte
        </div>
        <Login
          correo={correo}
          contrasena={contrasena}
          onCorreoChange={(e) => setCorreo(e.target.value)}
          onContrasenaChange={(e) => setContrasena(e.target.value)}
          onEnviar={handleEnviarLogin}
          onVolverPrincipal={() => navigate('/')}
        />
        <p style={{ textAlign: 'center', marginTop: '-10px', paddingBottom: '20px' }}>
          ¿No tienes cuenta?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            style={{ color: '#ffd60a', fontWeight: 700 }}
          >
            Regístrate primero
          </a>{' '}
          y vuelve a abrir este mismo link.
        </p>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#121212', color: 'white', gap: '16px' }}>
        <p style={{ color: '#ff4757' }}>{mensaje}</p>
        <button onClick={() => navigate('/dashboard')} style={{ background: '#ffd60a', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: 700, cursor: 'pointer' }}>
          Ir al panel
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#121212', color: 'white', gap: '16px', padding: '30px' }}>
      <h2 style={{ color: '#ffd60a' }}>¡Listo!</h2>
      <p>{mensaje}</p>
      <p>Tu rol en este proyecto: <strong>{ROL_LABEL[rol] || rol}</strong></p>
      <div style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '16px 20px', maxWidth: '420px', width: '100%' }}>
        <p style={{ color: '#ffd60a', fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>
          Restricciones de tu rol en este proyecto:
        </p>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#ccc', lineHeight: '1.7' }}>
          {(RESTRICCIONES[rol] || []).map((restriccion, i) => (
            <li key={i}>{restriccion}</li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ background: '#ffd60a', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: 700, cursor: 'pointer' }}
      >
        Ir al panel
      </button>
    </div>
  );
};

export default AceptarInvitacionPage;
