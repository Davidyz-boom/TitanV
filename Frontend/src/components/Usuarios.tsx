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
  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [rolesSeleccionados, setRolesSeleccionados] = useState<{ [id: number]: number }>({});
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

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

      // Inicializar el estado de roles seleccionados
      const mapaRoles: { [id: number]: number } = {};
      respuesta.data.forEach((u) => {
        mapaRoles[u.id] = u.rol;
      });
      setRolesSeleccionados(mapaRoles);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleCambioSelectRol = (usuarioId: number, nuevoRol: number) => {
    setRolesSeleccionados((prev) => ({
      ...prev,
      [usuarioId]: nuevoRol,
    }));
  };

  const guardarCambioRol = async (usuario: Usuario) => {
    const nuevoRol = rolesSeleccionados[usuario.id];
    if (nuevoRol === usuario.rol) {
      alert('El usuario ya tiene asignado este rol.');
      return;
    }

    try {
      setGuardandoId(usuario.id);
      await axios.put(
        `${API_URL}/usuarios/${usuario.id}`,
        { rol: nuevoRol },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
      );

      setMensajeExito(`✅ Rol de "${usuario.nombre_completo}" actualizado correctamente.`);
      setTimeout(() => setMensajeExito(''), 4000);
      await cargarUsuarios();
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      const detalle = error.response?.data?.detail || 'No se pudo actualizar el rol del usuario.';
      alert(`⚠️ ${detalle}`);
    } finally {
      setGuardandoId(null);
    }
  };

  const alternarEstadoActivo = async (usuario: Usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Deseas ${accion} la cuenta de "${usuario.nombre_completo}"?`)) return;

    try {
      setGuardandoId(usuario.id);
      await axios.put(
        `${API_URL}/usuarios/${usuario.id}`,
        { activo: !usuario.activo },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
      );

      setMensajeExito(`✅ Estado de "${usuario.nombre_completo}" actualizado.`);
      setTimeout(() => setMensajeExito(''), 4000);
      await cargarUsuarios();
    } catch (error: any) {
      alert(`⚠️ Error al cambiar estado: ${error.response?.data?.detail || error.message}`);
    } finally {
      setGuardandoId(null);
    }
  };

  const formatearRol = (rol: number) => {
    switch (rol) {
      case 1:
        return '👑 Administrador';
      case 2:
        return '📋 Supervisor';
      case 3:
        return '🛠️ Operario de Obra';
      default:
        return 'Colaborador';
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-users-gear" style={{ color: '#eab308' }}></i>
            Gestión de Usuarios y Roles (Administrador)
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            Edita y asigna los roles de cada usuario registrado en PostgreSQL (Administrador, Supervisor, Operario).
          </p>
        </div>

        <button
          onClick={cargarUsuarios}
          style={{
            backgroundColor: '#0f172a',
            color: '#ffd60a',
            border: 'none',
            padding: '9px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🔄 Actualizar Lista
        </button>
      </div>

      {mensajeExito && (
        <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
          {mensajeExito}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Cargando usuarios desde PostgreSQL...
        </div>
      ) : usuarios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          No hay usuarios registrados aún en la base de datos.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px' }}>ID</th>
                <th style={{ padding: '12px 14px' }}>Nombre Completo</th>
                <th style={{ padding: '12px 14px' }}>Correo Electrónico</th>
                <th style={{ padding: '12px 14px' }}>Rol Actual</th>
                <th style={{ padding: '12px 14px' }}>Estado</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Editar Rol (Administrador)</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const rolModificado = rolesSeleccionados[u.id] !== undefined ? rolesSeleccionados[u.id] : u.rol;
                const tieneCambioPendiente = rolModificado !== u.rol;
                const estaGuardando = guardandoId === u.id;

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#64748b' }}>#{u.id}</td>
                    <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 700 }}>{u.nombre_completo}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{u.correo_electronico}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          backgroundColor:
                            u.rol === 1 ? '#fef3c7' : u.rol === 2 ? '#dcfce7' : '#e0f2fe',
                          color:
                            u.rol === 1 ? '#b45309' : u.rol === 2 ? '#15803d' : '#0369a1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 800,
                          border: `1px solid ${u.rol === 1 ? '#fde68a' : u.rol === 2 ? '#bbf7d0' : '#bae6fd'}`,
                        }}
                      >
                        {formatearRol(u.rol)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={() => alternarEstadoActivo(u)}
                        disabled={estaGuardando}
                        title="Clic para cambiar estado"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: u.activo ? '#16a34a' : '#dc2626',
                          fontWeight: 700,
                          fontSize: '12px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {u.activo ? '● Activo' : '○ Inactivo'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <select
                          value={rolModificado}
                          onChange={(e) => handleCambioSelectRol(u.id, Number(e.target.value))}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: tieneCambioPendiente ? '2px solid #ffd60a' : '1px solid #cbd5e1',
                            backgroundColor: tieneCambioPendiente ? '#fffbeb' : '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <option value={1}>👑 1 - Administrador</option>
                          <option value={2}>📋 2 - Supervisor</option>
                          <option value={3}>🛠️ 3 - Operario de Obra</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => guardarCambioRol(u)}
                          disabled={!tieneCambioPendiente || estaGuardando}
                          style={{
                            backgroundColor: tieneCambioPendiente ? '#ffd60a' : '#f1f5f9',
                            color: tieneCambioPendiente ? '#000000' : '#94a3b8',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: tieneCambioPendiente && !estaGuardando ? 'pointer' : 'not-allowed',
                            boxShadow: tieneCambioPendiente ? '0 2px 6px rgba(255, 214, 10, 0.3)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {estaGuardando ? 'Guardando...' : 'Guardar Rol'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Usuarios;