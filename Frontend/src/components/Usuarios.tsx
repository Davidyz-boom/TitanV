import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Usuario {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  rol: number;
  activo: boolean;
}

const API_URL = 'http://localhost:8000';

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const respuesta = await axios.get<Usuario[]>(`${API_URL}/usuarios/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      setUsuarios(respuesta.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const cambiarRol = async (usuarioId: number, nuevoRol: number, nombreUsuario: string) => {
    try {
      setActualizandoId(usuarioId);
      const respuesta = await axios.put(
        `${API_URL}/usuarios/${usuarioId}`,
        { rol: nuevoRol },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
      );

      if (respuesta.status === 200) {
        alert(`✅ Rol actualizado para ${nombreUsuario} a ${formatearRol(nuevoRol)}`);
        // Si el usuario editado es el mismo en sesión, actualizar localStorage
        const miId = localStorage.getItem('usuario_id');
        if (miId && Number(miId) === usuarioId) {
          localStorage.setItem('usuario_rol', String(nuevoRol));
        }
        await cargarUsuarios();
      }
    } catch (error: any) {
      const detalle = error.response?.data?.detail || 'No se pudo cambiar el rol del usuario.';
      alert(`⚠️ Error: ${detalle}`);
    } finally {
      setActualizandoId(null);
    }
  };

  const formatearRol = (rol: number) => {
    switch (rol) {
      case 1:
        return 'Administrador';
      case 2:
        return 'Supervisor';
      case 3:
        return 'Operario / Usuario';
      default:
        return 'Colaborador';
    }
  };

  return (
    <div style={{
      padding: '28px',
      backgroundColor: 'rgba(16, 21, 31, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 214, 10, 0.2)',
      boxShadow: '0 16px 36px rgba(0,0,0,0.5), 0 0 20px rgba(255, 214, 10, 0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#ffd60a' }}><i className="fas fa-users-cog"></i></span> Gestión de Usuarios y Asignación de Roles
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
            Como Administrador puedes visualizar todos los usuarios y asignar o modificar sus roles en el sistema.
          </p>
        </div>
        <button
          onClick={cargarUsuarios}
          style={{
            backgroundColor: '#ffd60a',
            color: '#000000',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '0 4px 15px rgba(255, 214, 10, 0.25)',
            transition: '0.2s',
          }}
        >
          🔄 Actualizar Lista
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Cargando usuarios desde PostgreSQL...
        </div>
      ) : usuarios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
          No hay usuarios registrados aún en la base de datos.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(24, 31, 46, 0.95)', color: '#ffd60a' }}>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>ID</th>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Nombre Completo</th>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Correo Electrónico</th>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Rol Actual</th>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Asignar Nuevo Rol</th>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#ffd60a' }}>#{u.id}</td>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>{u.nombre_completo}</td>
                  <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{u.correo_electronico}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      backgroundColor: u.rol === 1 ? 'rgba(255, 214, 10, 0.15)' : u.rol === 2 ? 'rgba(129, 140, 248, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: u.rol === 1 ? '#ffd60a' : u.rol === 2 ? '#a5b4fc' : '#38bdf8',
                      border: `1px solid ${u.rol === 1 ? 'rgba(255, 214, 10, 0.4)' : u.rol === 2 ? 'rgba(129, 140, 248, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      display: 'inline-block'
                    }}>
                      {formatearRol(u.rol)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <select
                      value={u.rol}
                      disabled={actualizandoId === u.id}
                      onChange={(e) => cambiarRol(u.id, Number(e.target.value), u.nombre_completo)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        fontSize: '13px',
                        backgroundColor: 'rgba(10, 14, 22, 0.95)',
                        color: '#ffffff',
                        fontWeight: 600,
                        cursor: actualizandoId === u.id ? 'not-allowed' : 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value={1}>🛡️ Administrador</option>
                      <option value={2}>👔 Supervisor</option>
                      <option value={3}>👷 Operario / Usuario</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 16px', color: u.activo ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    {u.activo ? '● Activo' : '○ Inactivo'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Usuarios;