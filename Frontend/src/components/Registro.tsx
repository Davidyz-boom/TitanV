import React, { useState } from 'react';
import axios from 'axios';

interface RegistroProps {
  onRegistrar?: (datos: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    contrasena: string;
  }) => void;
  onVolver?: () => void;
}

const API_URL = 'http://127.0.0.1:8000/api';

const validarContrasena = (valor: string): string | null => {
  if (valor.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(valor)) {
    return 'La contraseña debe tener al menos una letra mayúscula.';
  }
  if (!/[0-9]/.test(valor)) {
    return 'La contraseña debe tener al menos un número.';
  }
  return null;
};

const Registro: React.FC<RegistroProps> = ({ onRegistrar, onVolver }) => {

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);

  const manejarRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errorContrasena = validarContrasena(contrasena);
    if (errorContrasena) {
      alert(errorContrasena);
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
        rol: 3, // Operario por defecto
      });

      alert(
        `✅ REGISTRO COMPLETADO EN LA BASE DE DATOS\n\n` +
        `ID de Usuario: #${respuesta.data.id}\n` +
        `Nombre: ${respuesta.data.nombre_completo}\n` +
        `Correo: ${respuesta.data.correo_electronico}\n\n` +
        `¡Ya puedes iniciar sesión con tu cuenta!`
      );

      if (onRegistrar) {
        onRegistrar({ nombre, apellido, correo, telefono, contrasena });
      } else if (onVolver) {
        onVolver();
      }
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      const detalle = error.response?.data?.detail || error.message || 'Error al guardar el usuario en la base de datos.';
      alert(`⚠️ No se pudo registrar el usuario: ${detalle}`);
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
          Crear una nueva cuenta
        </p>

        <form onSubmit={manejarRegistro}>

          <div style={estilos.fila}>

            <div style={estilos.grupo}>
              <label style={estilos.label}>
                Nombre
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
                Apellido
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
              Correo electrónico
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

          <div style={estilos.grupo}>
            <label style={estilos.label}>
              Número de teléfono
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
              Contraseña
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type={verContrasena ? 'text' : 'password'}
                placeholder="Crea una contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                style={{ ...estilos.input, paddingRight: '40px' }}
              />

              <button
                type="button"
                onClick={() => setVerContrasena(!verContrasena)}
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {verContrasena ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {contrasena.length > 0 && (
              <ul style={estilos.listaRequisitos}>
                <li style={contrasena.length >= 8 ? estilos.requisitoOk : estilos.requisitoFalta}>
                  {contrasena.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                </li>
                <li style={/[A-Z]/.test(contrasena) ? estilos.requisitoOk : estilos.requisitoFalta}>
                  {/[A-Z]/.test(contrasena) ? '✓' : '○'} Al menos una mayúscula
                </li>
                <li style={/[0-9]/.test(contrasena) ? estilos.requisitoOk : estilos.requisitoFalta}>
                  {/[0-9]/.test(contrasena) ? '✓' : '○'} Al menos un número
                </li>
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              ...estilos.boton,
              backgroundColor: cargando ? '#999' : '#ffcc00',
              cursor: cargando ? 'not-allowed' : 'pointer',
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
                padding: '10px',
                marginTop: '10px',
                backgroundColor: 'transparent',
                color: '#aaa',
                border: '1px solid #444',
                borderRadius: '7px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ← Volver al inicio de sesión
            </button>
          )}

        </form>

        <p style={estilos.pie}>
          Al crear tu cuenta aceptas nuestros términos y condiciones.
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
    boxSizing: 'border-box' as const
  },

  formulario: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: '#1e1e1e',
    padding: '40px',
    borderRadius: '16px',
    border: '1px solid #333',
    boxShadow: '0 10px 35px rgba(0,0,0,0.6)',
    boxSizing: 'border-box' as const
  },

  titulo: {
    textAlign: 'center' as const,
    color: '#ffffff',
    margin: '0',
    fontSize: '30px',
    letterSpacing: '2px'
  },

  acento: {
    color: '#ffcc00'
  },

  subtitulo: {
    textAlign: 'center' as const,
    color: '#999999',
    marginBottom: '30px',
    fontSize: '15px'
  },

  fila: {
    display: 'flex',
    gap: '15px'
  },

  grupo: {
    marginBottom: '18px',
    flex: 1
  },

  label: {
    display: 'block',
    color: '#dddddd',
    fontSize: '14px',
    marginBottom: '7px',
    fontWeight: 'bold'
  },

  input: {
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box' as const,
    backgroundColor: '#121212',
    color: '#ffffff',
    border: '1px solid #444',
    borderRadius: '7px',
    outline: 'none',
    fontSize: '14px'
  },

  boton: {
    width: '100%',
    padding: '13px',
    marginTop: '10px',
    backgroundColor: '#ffcc00',
    color: '#000000',
    border: 'none',
    borderRadius: '7px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  pie: {
    textAlign: 'center' as const,
    color: '#777777',
    fontSize: '11px',
    marginTop: '20px',
    lineHeight: '1.5'
  },

  listaRequisitos: {
    listStyle: 'none',
    padding: 0,
    margin: '8px 0 0 0',
    fontSize: '12px',
  },

  requisitoOk: {
    color: '#4ade80',
    marginBottom: '3px',
  },

  requisitoFalta: {
    color: '#888',
    marginBottom: '3px',
  },

};

export default Registro;