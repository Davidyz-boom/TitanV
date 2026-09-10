import React, { useState } from 'react';
import axios from 'axios';
import logoImg from '../assets/logo.png';

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

  // Validación de seguridad de contraseña
  const tieneLetras = /[a-zA-Z]/.test(contrasena);
  const tieneNumeros = /[0-9]/.test(contrasena);
  const tieneSimbolos = /[^a-zA-Z0-9]/.test(contrasena);
  const longitudMinima = contrasena.length >= 8;
  const contrasenaValida = longitudMinima && tieneLetras && tieneNumeros && tieneSimbolos;

  const manejarRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!contrasenaValida) {
      alert(
        '⚠️ La contraseña no cumple con los requisitos de seguridad requeridos:\n\n' +
        '• Mínimo 8 caracteres\n' +
        '• Debe contener letras (A-Z o a-z)\n' +
        '• Debe contener números (0-9)\n' +
        '• Debe contener caracteres especiales / símbolos (ej: *, #, @, $, !)'
      );
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
        rol: 3, // Operario / Usuario estándar por defecto
      });

      alert(
        `✅ REGISTRO COMPLETADO EN LA BASE DE DATOS POSTGRESQL\n\n` +
        `ID de Usuario: #${respuesta.data.id}\n` +
        `Nombre: ${respuesta.data.nombre_completo}\n` +
        `Correo: ${respuesta.data.correo_electronico}\n` +
        `Rol asignado: Operario / Usuario (Estándar)\n\n` +
        `¡Ya puedes iniciar sesión con tu correo y contraseña!`
      );

      if (onRegistrar) {
        onRegistrar({ nombre, apellido, correo, telefono, usuario, contrasena });
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
        {/* LOGO DE TITAN V + TÍTULO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <img src={logoImg} alt="Titan V Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
          <h1 style={{ ...estilos.titulo, margin: 0 }}>
            TITAN <span style={estilos.acento}>V</span>
          </h1>
        </div>

        <p style={estilos.subtitulo}>
          Crear una nueva cuenta en el sistema de gestión de obra
        </p>

        {/* AVISO DE CAMPOS OBLIGATORIOS */}
        <div style={{
          backgroundColor: 'rgba(255, 214, 10, 0.1)',
          border: '1px solid rgba(255, 214, 10, 0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#ffd60a',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          <i className="fas fa-info-circle" style={{ fontSize: '14px' }}></i>
          <span>Los campos marcados con <strong style={{ color: '#ff4d4f', fontSize: '14px' }}>*</strong> son obligatorios para completar tu registro.</span>
        </div>

        <form onSubmit={manejarRegistro}>
          <div style={estilos.fila}>
            <div style={estilos.grupo}>
              <label style={estilos.label}>
                Nombre <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
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
                Apellido <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
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
              Correo electrónico <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
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
              Número de teléfono <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
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
              Nombre de usuario <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
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

          <div style={estilos.grupo}>
            <label style={estilos.label}>
              Contraseña <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
            </label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres (letras, números y símbolos)"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              style={estilos.input}
            />

            {/* LISTA DE REQUISITOS DE CONTRASEÑA EN TIEMPO REAL */}
            <div style={{
              marginTop: '8px',
              padding: '10px 12px',
              backgroundColor: '#161616',
              borderRadius: '6px',
              border: '1px solid #333',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <span style={{ color: '#888', fontWeight: 700, marginBottom: '2px' }}>
                Requisitos de seguridad de la contraseña:
              </span>
              <span style={{ color: longitudMinima ? '#4ade80' : '#888' }}>
                {longitudMinima ? '✓' : '○'} Mínimo 8 caracteres
              </span>
              <span style={{ color: tieneLetras ? '#4ade80' : '#888' }}>
                {tieneLetras ? '✓' : '○'} Debe contener letras (A-Z, a-z)
              </span>
              <span style={{ color: tieneNumeros ? '#4ade80' : '#888' }}>
                {tieneNumeros ? '✓' : '○'} Debe contener números (0-9)
              </span>
              <span style={{ color: tieneSimbolos ? '#4ade80' : '#888' }}>
                {tieneSimbolos ? '✓' : '○'} Debe contener símbolos especiales (*, #, @, $, !, etc.)
              </span>
            </div>
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
          Al crear tu cuenta aceptas nuestros términos y condiciones de servicio Titan V.
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
  }

};

export default Registro;