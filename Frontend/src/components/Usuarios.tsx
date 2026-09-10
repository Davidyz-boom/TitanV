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
    <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 5px 0' }}>
            <i className="fas fa-users-cog"></i> Gestión de Usuarios y Asignación de Roles
          </h2>
          <p style={{ color: '#475569', margin: 0, fontSize: '14px' }}>
            Como Administrador puedes visualizar todos los usuarios y asignar o modificar sus roles en el sistema.
          </p>
        </div>
        <button
          onClick={cargarUsuarios}
          style={{
            backgroundColor: '#000',
            color: '#ffd60a',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          🔄 Actualizar Lista
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          Cargando usuarios desde PostgreSQL...
        </div>
      ) : usuarios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          No hay usuarios registrados aún en la base de datos.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>ID</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Nombre Completo</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Correo Electrónico</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Rol Actual</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Asignar Nuevo Rol</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>#{u.id}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#0f172a', fontWeight: 600 }}>{u.nombre_completo}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{u.correo_electronico}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{
                      backgroundColor: u.rol === 1 ? '#fef3c7' : u.rol === 2 ? '#e0e7ff' : '#e0f2fe',
                      color: u.rol === 1 ? '#b45309' : u.rol === 2 ? '#3730a3' : '#0369a1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      {formatearRol(u.rol)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <select
                      value={u.rol}
                      disabled={actualizandoId === u.id}
                      onChange={(e) => cambiarRol(u.id, Number(e.target.value), u.nombre_completo)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        backgroundColor: '#fff',
                        fontWeight: 600,
                        cursor: actualizandoId === u.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value={1}>🛡️ Administrador</option>
                      <option value={2}>👔 Supervisor</option>
                      <option value={3}>👷 Operario / Usuario</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: u.activo ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
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