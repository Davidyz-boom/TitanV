import React, { useState } from 'react';
import axios from 'axios';

interface RegistroProps {
  onRegistrar?: (datos: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    usuario: string;
    contrasena: string;
  }) => void;
  onVolver?: () => void;
}

const API_URL = 'http://localhost:8000';

const Registro: React.FC<RegistroProps> = ({ onRegistrar, onVolver }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  // Validaciones en tiempo real para contraseña robusta (Requerimiento del docente)
  const tieneLongitud = contrasena.length >= 8;
  const tieneLetras = /[a-zA-Z]/.test(contrasena);
  const tieneNumOSimbolo = /[\d!@#$%^&*(),.?":{}|<>_\-]/.test(contrasena);
  const esContrasenaValida = tieneLongitud && tieneLetras && tieneNumOSimbolo;

  const manejarRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorValidacion('');

    if (!nombre.trim() || !apellido.trim() || !correo.trim() || !telefono.trim() || !usuario.trim() || !contrasena) {
      setErrorValidacion('Todos los campos con (*) son estrictamente obligatorios.');
      return;
    }

    if (!esContrasenaValida) {
      setErrorValidacion('La contraseña debe tener al menos 8 caracteres, e incluir letras y al menos un número o símbolo.');
      return;
    }

    try {
      setCargando(true);
      const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`.trim();

      // Guardar usuario en PostgreSQL mediante FastAPI
      const respuesta = await axios.post(`${API_URL}/auth/registro`, {
        nombre_completo: nombreCompleto,
        correo_electronico: correo.trim(),
        contrasena: contrasena,
        rol: 3, // Operario / Usuario registrado por defecto
      });

      alert(
        `✅ REGISTRO COMPLETADO EN LA BASE DE DATOS\n\n` +
        `ID de Usuario: #${respuesta.data.id}\n` +
        `Nombre: ${respuesta.data.nombre_completo}\n` +
        `Correo: ${respuesta.data.correo_electronico}\n\n` +
        `¡Ya puedes iniciar sesión con tu cuenta de acceso a tus obras!`
      );

      if (onRegistrar) {
        onRegistrar({ nombre, apellido, correo, telefono, usuario, contrasena });
      } else if (onVolver) {
        onVolver();
      }
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      const detalle = error.response?.data?.detail || error.message || 'Error al guardar el usuario en la base de datos.';
      setErrorValidacion(`⚠️ ${detalle}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.formulario}>
        <h1 style={estilos.titulo}>
          TITAN <span style={estilos.acento}>V</span>
        </h1>

        <p style={estilos.subtitulo}>
          Crear una nueva cuenta &bull; Registro Obligatorio
        </p>

        {errorValidacion && (
          <div style={estilos.alertaError}>
            {errorValidacion}
          </div>
        )}

        <form onSubmit={manejarRegistro}>
          <div style={estilos.fila}>
            <div style={estilos.grupo}>
              <label style={estilos.label}>
                Nombre <span style={estilos.requerido}>* (Obligatorio)</span>
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                style={estilos.input}
              />
            </div>

            <div style={estilos.grupo}>
              <label style={estilos.label}>
                Apellido <span style={estilos.requerido}>* (Obligatorio)</span>
              </label>
              <input
                type="text"
                placeholder="Tu apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                style={estilos.input}
              />
            </div>
          </div>

          <div style={estilos.grupo}>
            <label style={estilos.label}>
              Correo electrónico <span style={estilos.requerido}>* (Obligatorio)</span>
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              style={estilos.input}
            />
          </div>

          <div style={estilos.fila}>
            <div style={estilos.grupo}>
              <label style={estilos.label}>
                Número de teléfono <span style={estilos.requerido}>* (Obligatorio)</span>
              </label>
              <input
                type="tel"
                placeholder="300 000 0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                style={estilos.input}
              />
            </div>

            <div style={estilos.grupo}>
              <label style={estilos.label}>
                Nombre de usuario <span style={estilos.requerido}>* (Obligatorio)</span>
              </label>
              <input
                type="text"
                placeholder="Elige un usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                style={estilos.input}
              />
            </div>
          </div>

          <div style={estilos.grupo}>
            <label style={estilos.label}>
              Contraseña <span style={estilos.requerido}>* (Obligatorio - Letras y Números/Símbolos)</span>
            </label>
            <input
              type="password"
              placeholder="Crea una contraseña segura"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              minLength={8}
              style={estilos.input}
            />

            {/* REGLAS EN VIVO DE LA CONTRASEÑA */}
            <div style={estilos.reglasPassword}>
              <div style={{ color: tieneLongitud ? '#22c55e' : '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{tieneLongitud ? '✓' : '○'}</span> Mínimo 8 caracteres
              </div>
              <div style={{ color: tieneLetras ? '#22c55e' : '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{tieneLetras ? '✓' : '○'}</span> Contiene letras (a-z / A-Z)
              </div>
              <div style={{ color: tieneNumOSimbolo ? '#22c55e' : '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{tieneNumOSimbolo ? '✓' : '○'}</span> Contiene números (0-9) o símbolos (@, #, $, ...)
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando || (contrasena.length > 0 && !esContrasenaValida)}
            style={{
              ...estilos.boton,
              backgroundColor: cargando || (contrasena.length > 0 && !esContrasenaValida) ? '#64748b' : '#ffcc00',
              cursor: cargando || (contrasena.length > 0 && !esContrasenaValida) ? 'not-allowed' : 'pointer',
            }}
          >
            {cargando ? 'Guardando en Base de Datos...' : 'Crear cuenta'}
          </button>

          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              style={{
                width: '100%',
                padding: '11px',
                marginTop: '12px',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ← Volver al inicio de sesión
            </button>
          )}
        </form>

        <p style={estilos.pie}>
          Al crear tu cuenta aceptas nuestros términos y condiciones &bull; Sistema Titan V
        </p>
      </div>
    </div>
  );
};

const estilos = {
  contenedor: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: '30px',
    boxSizing: 'border-box' as const,
  },
  formulario: {
    width: '100%',
    maxWidth: '620px',
    backgroundColor: '#1e1e1e',
    padding: '40px',
    borderRadius: '16px',
    border: '1px solid #333',
    boxShadow: '0 10px 35px rgba(0,0,0,0.6)',
    boxSizing: 'border-box' as const,
  },
  titulo: {
    textAlign: 'center' as const,
    color: '#ffffff',
    margin: '0',
    fontSize: '30px',
    letterSpacing: '2px',
  },
  acento: {
    color: '#ffcc00',
  },
  subtitulo: {
    textAlign: 'center' as const,
    color: '#999999',
    marginBottom: '24px',
    fontSize: '14px',
  },
  fila: {
    display: 'flex',
    gap: '15px',
  },
  grupo: {
    marginBottom: '16px',
    flex: 1,
  },
  label: {
    display: 'block',
    color: '#dddddd',
    fontSize: '13px',
    marginBottom: '6px',
    fontWeight: 'bold',
  },
  requerido: {
    color: '#ffd60a',
    fontSize: '11px',
    fontWeight: 'normal',
    marginLeft: '4px',
  },
  input: {
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box' as const,
    backgroundColor: '#121212',
    color: '#ffffff',
    border: '1px solid #444',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '14px',
  },
  reglasPassword: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  alertaError: {
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '18px',
  },
  boton: {
    width: '100%',
    padding: '13px',
    marginTop: '8px',
    backgroundColor: '#ffcc00',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  pie: {
    textAlign: 'center' as const,
    color: '#777777',
    fontSize: '12px',
    marginTop: '20px',
    lineHeight: '1.5',
  },
};

export default Registro;