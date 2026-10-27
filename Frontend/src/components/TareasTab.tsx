import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchConToken } from '../api';
import Comentarios from './Comentarios';

export interface Tarea {
  id: number;
  nombre_tarea: string;
  descripcion?: string;
  estado: string; // 'Pendiente' | 'En Proceso' | 'Completada'
  fecha_asignacion?: string;
  proyecto_id: number;
  usuario_id: number;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
});

interface Proyecto {
  id: number;
  nombre_proyecto: string;
}

interface Usuario {
  id: number;
  nombre_completo: string;
}

const ESTADOS_DISPONIBLES = ['Pendiente', 'En Proceso', 'Completada'];

interface TareasTabProps {
  proyectoId?: number;
}

const TareasTab: React.FC<TareasTabProps> = ({ proyectoId: proyectoFijo }) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Campos del formulario
  const [nombreTarea, setNombreTarea] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [estado, setEstado] = useState<string>('Pendiente');
  const [proyectoId, setProyectoId] = useState<number>(proyectoFijo ?? 1);
  const [usuarioId, setUsuarioId] = useState<number>(1);

  // Tarea seleccionada para comentarios
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  // Filtro
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    obtenerProyectos();
    obtenerUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (proyectoId) obtenerTareas(Number(proyectoId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const mostrarNotificacion = (tipo: 'exito' | 'error', texto: string) => {
    setNotificacion({ tipo, texto });
    setTimeout(() => {
      setNotificacion(null);
    }, 5000);
  };

  const obtenerProyectos = async () => {
    try {
      // El backend filtra por la identidad del token: solo proyectos donde el
      // usuario autenticado es colaborador.
      const respuesta = await fetchConToken('/proyectos/');
      if (!respuesta.ok) throw new Error('No se pudieron cargar proyectos.');
      const data = await respuesta.json();
      const visibles = proyectoFijo ? (data as Proyecto[]).filter((p) => p.id === proyectoFijo) : data;
      setProyectos(visibles);
      if (visibles.length > 0) {
        setProyectoId(visibles[0].id);
      } else if (proyectoFijo) {
        setProyectoId(proyectoFijo);
      }
    } catch (error) {
      console.warn('No se pudieron cargar proyectos:', error);
    }
  };

  const obtenerUsuarios = async () => {
    try {
      const respuesta = await axios.get<Usuario[]>(`${API_URL}/usuarios/`, authHeaders());
      setUsuarios(respuesta.data);
      if (respuesta.data.length > 0) {
        setUsuarioId(respuesta.data[0].id);
      }
    } catch (error) {
      console.warn('No se pudieron cargar usuarios:', error);
    }
  };

  const nombreUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nombre_completo || `Usuario #${id}`;

  const formatearError = (error: any, fallback: string) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      return '⚠️ Error de Red: No se pudo conectar con el servidor backend (http://localhost:8000). Asegúrate de tener uvicorn corriendo en la terminal: "cd backend" y luego "uvicorn app.main:app --reload --port 8000".';
    }
    return error.response?.data?.detail || error.message || fallback;
  };

  const obtenerTareas = async (idProyecto?: number) => {
    try {
      setCargando(true);
      const query = idProyecto ? `/?proyecto_id=${idProyecto}` : '/';
      const respuesta = await fetchConToken(`/tareas${query}`);
      if (!respuesta.ok) throw new Error('No se pudieron cargar las tareas.');
      setTareas(await respuesta.json());
    } catch (error: any) {
      console.error('Error al cargar las tareas:', error);
      mostrarNotificacion('error', formatearError(error, 'No se pudieron cargar las tareas desde el backend.'));
    } finally {
      setCargando(false);
    }
  };

  const crearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreTarea.trim()) {
      mostrarNotificacion('error', 'El nombre de la tarea es obligatorio.');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        nombre_tarea: nombreTarea.trim(),
        descripcion: descripcion.trim(),
        estado: estado,
        proyecto_id: Number(proyectoId) || 1,
        usuario_id: Number(usuarioId) || 1,
      };

      const respuesta = await axios.post<Tarea>(`${API_URL}/tareas/`, payload, authHeaders());
      setTareas((prev) => [respuesta.data, ...prev]);

      // Limpiar formulario
      setNombreTarea('');
      setDescripcion('');
      setEstado('Pendiente');
      mostrarNotificacion('exito', `Tarea "${respuesta.data.nombre_tarea}" creada exitosamente.`);
    } catch (error: any) {
      console.error('Error al crear la tarea:', error);
      mostrarNotificacion('error', formatearError(error, 'Error al crear la tarea en la base de datos.'));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (idTarea: number, nuevoEstado: string) => {
    try {
      const respuesta = await axios.put<Tarea>(
        `${API_URL}/tareas/${idTarea}`,
        { estado: nuevoEstado },
        authHeaders()
      );

      setTareas((prev) =>
        prev.map((t) => (t.id === idTarea ? { ...t, estado: respuesta.data.estado } : t))
      );

      if (tareaSeleccionada?.id === idTarea) {
        setTareaSeleccionada((prev) => (prev ? { ...prev, estado: respuesta.data.estado } : null));
      }

      mostrarNotificacion('exito', `Estado de la tarea #${idTarea} actualizado a "${nuevoEstado}".`);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      mostrarNotificacion('error', 'No se pudo actualizar el estado de la tarea.');
    }
  };

  const eliminarTarea = async (idTarea: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la tarea "${nombre}" (ID: ${idTarea})?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/tareas/${idTarea}`, authHeaders());
      setTareas((prev) => prev.filter((t) => t.id !== idTarea));

      if (tareaSeleccionada?.id === idTarea) {
        setTareaSeleccionada(null);
      }

      mostrarNotificacion('exito', `Tarea "${nombre}" eliminada correctamente.`);
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
      mostrarNotificacion('error', 'No se pudo eliminar la tarea.');
    }
  };

  const obtenerColorEstado = (est: string) => {
    switch (est) {
      case 'Pendiente':
        return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
      case 'En Proceso':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
      case 'Completada':
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const tareasFiltradas = tareas.filter((t) => {
    if (filtroEstado === 'Todos') return true;
    return t.estado === filtroEstado;
  });

  return (
    <div className="tab-content active" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Encabezado */}
      <div className="section-header">
        <h2><i className="fas fa-tasks"></i> Gestión de Tareas y Comentarios</h2>
        <p className="muted-text" style={{ margin: '6px 0 0', fontSize: '14px' }}>
          Crea, supervisa estados y gestiona el historial de notas técnicas de cada tarea en tiempo real.
        </p>
      </div>

      {/* Banner de Notificación */}
      {notificacion && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: notificacion.tipo === 'exito' ? 'rgba(34, 197, 94, .14)' : 'rgba(239, 68, 68, .14)',
            color: notificacion.tipo === 'exito' ? '#86efac' : '#fca5a5',
            border: `1px solid ${notificacion.tipo === 'exito' ? 'rgba(134, 239, 172, .4)' : 'rgba(252, 165, 165, .4)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notificacion.texto}</span>
          <button
            onClick={() => setNotificacion(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Contenido en Grilla: Formulario + Listado & Comentarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Formulario de Creación */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-plus-circle"></i> Nueva Tarea</h3>
          </div>

          <form onSubmit={crearTarea}>
            <div className="input-group">
              <label>Nombre de la tarea *</label>
              <input
                type="text"
                placeholder="Ej: Fundición de losa piso 2"
                value={nombreTarea}
                onChange={(e) => setNombreTarea(e.target.value)}
                required
                maxLength={150}
              />
            </div>

            <div className="input-group">
              <label>Descripción detallada</label>
              <textarea
                placeholder="Detalla las especificaciones técnicas o instrucciones para el operario..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                style={{
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div className="date-row">
              <div className="input-group">
                <label>Estado inicial</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {ESTADOS_DISPONIBLES.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Proyecto</label>
                {proyectos.length > 0 ? (
                  <select value={proyectoId} onChange={(e) => setProyectoId(Number(e.target.value))}>
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {p.nombre_proyecto}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={proyectoId}
                    onChange={(e) => setProyectoId(Number(e.target.value) || 1)}
                    required
                  />
                )}
              </div>
            </div>

            <div className="input-group">
              <label>Asignar a</label>
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(Number(e.target.value))}
                required
              >
                <option value="" disabled>Selecciona un operario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-save" disabled={guardando}>
              {guardando ? 'Guardando en BD...' : 'Guardar Tarea'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Listado de Tareas y Panel de Comentarios Reubicado */}
        <div style={{ display: 'grid', gridTemplateColumns: tareaSeleccionada ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Tarjeta de Lista de Tareas */}
          <div className="card">
            <div
              className="card-header"
              style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}
            >
              <h3><i className="fas fa-list"></i> Listado de Tareas ({tareasFiltradas.length})</h3>

              {/* Filtro por estado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="muted-text" style={{ fontSize: '12px', fontWeight: 600 }}>Filtrar:</span>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                >
                  <option value="Todos">Todos los estados</option>
                  {ESTADOS_DISPONIBLES.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => obtenerTareas(Number(proyectoId))}
                  title="Recargar tareas"
                  style={{
                    backgroundColor: 'rgba(255, 214, 10, .12)',
                    border: '1px solid rgba(255, 214, 10, .45)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#ffd60a',
                  }}
                >
                  🔄
                </button>
              </div>
            </div>

            <div style={{ padding: '20px 24px 24px' }}>
            {cargando ? (
              <div className="empty-msg" style={{ padding: '40px' }}>
                Cargando tareas desde PostgreSQL...
              </div>
            ) : tareasFiltradas.length === 0 ? (
              <div
                className="empty-msg"
                style={{
                  padding: '40px 20px',
                  backgroundColor: 'rgba(8, 11, 17, .6)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, .18)',
                  color: '#94a3b8',
                }}
              >
                <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>No hay tareas registradas con este filtro.</p>
                <span style={{ fontSize: '13px' }}>Usa el formulario para registrar la primera tarea de obra.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '650px', overflowY: 'auto' }}>
                {tareasFiltradas.map((t) => {
                  const colorEst = obtenerColorEstado(t.estado);
                  const estaSeleccionada = tareaSeleccionada?.id === t.id;

                  return (
                    <div
                      className="task-item"
                      key={t.id}
                      style={{
                        padding: '16px',
                        border: estaSeleccionada ? '1px solid rgba(255, 214, 10, .65)' : '1px solid rgba(255, 255, 255, .12)',
                        backgroundColor: estaSeleccionada ? 'rgba(255, 214, 10, .07)' : 'rgba(8, 11, 17, .72)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: estaSeleccionada ? '0 4px 12px rgba(255, 214, 10, .18)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>#{t.id}</span>
                            <strong style={{ color: '#fff', fontSize: '15px' }}>{t.nombre_tarea}</strong>
                          </div>
                          {t.descripcion && (
                            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0', lineHeight: '1.4' }}>
                              {t.descripcion}
                            </p>
                          )}
                        </div>

                        {/* Dropdown de Estado para cambiar en tiempo real */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <select
                            value={t.estado}
                            onChange={(e) => cambiarEstado(t.id, e.target.value)}
                            style={{
                              backgroundColor: colorEst.bg,
                              color: colorEst.text,
                              border: `1px solid ${colorEst.border}`,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                            title="Cambiar estado de la tarea"
                          >
                            {ESTADOS_DISPONIBLES.map((est) => (
                              <option key={est} value={est} style={{ backgroundColor: '#fff', color: '#000' }}>
                                {est}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Meta información */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, .08)',
                          fontSize: '12px',
                          color: '#94a3b8',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span>🏗 Proyecto: #{t.proyecto_id}</span>
                          <span>👤 Operario: {nombreUsuario(t.usuario_id)}</span>
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setTareaSeleccionada(estaSeleccionada ? null : t)}
                            style={{
                              backgroundColor: estaSeleccionada ? 'rgba(255, 214, 10, .15)' : '#ffd60a',
                              color: estaSeleccionada ? '#ffd60a' : '#000000',
                              border: estaSeleccionada ? '1px solid rgba(255, 214, 10, .65)' : 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            💬 {estaSeleccionada ? 'Ocultar Comentarios' : 'Ver Comentarios'}
                          </button>

                          <button
                            onClick={() => eliminarTarea(t.id, t.nombre_tarea)}
                            className="btn-delete"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                            title="Eliminar tarea"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* Panel Lateral Reubicado para Comentarios */}
          {tareaSeleccionada && (
            <div>
              <Comentarios
                tareaId={tareaSeleccionada.id}
                tareaNombre={tareaSeleccionada.nombre_tarea}
                onCerrar={() => setTareaSeleccionada(null)}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TareasTab;
