import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const API_URL = 'http://localhost:8000';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
});

interface Proyecto {
  id: number;
  nombre_proyecto: string;
}

const ESTADOS_DISPONIBLES = ['Pendiente', 'En Proceso', 'Completada'];

const TareasTab: React.FC = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Campos del formulario
  const [nombreTarea, setNombreTarea] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [estado, setEstado] = useState<string>('Pendiente');
  const [proyectoId, setProyectoId] = useState<number>(1);
  const [usuarioId, setUsuarioId] = useState<number>(1);

  // Tarea seleccionada para comentarios
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  // Filtro
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    obtenerTareas();
    obtenerProyectos();
  }, []);

  const mostrarNotificacion = (tipo: 'exito' | 'error', texto: string) => {
    setNotificacion({ tipo, texto });
    setTimeout(() => {
      setNotificacion(null);
    }, 5000);
  };

  const obtenerProyectos = async () => {
    try {
      const respuesta = await axios.get<Proyecto[]>(`${API_URL}/proyectos/`);
      setProyectos(respuesta.data);
      if (respuesta.data.length > 0) {
        setProyectoId(respuesta.data[0].id);
      }
    } catch (error) {
      console.warn('No se pudieron cargar proyectos:', error);
    }
  };

  const formatearError = (error: any, fallback: string) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      return '⚠️ Error de Red: No se pudo conectar con el servidor backend (http://localhost:8000). Asegúrate de tener uvicorn corriendo en la terminal: "cd backend" y luego "uvicorn app.main:app --reload --port 8000".';
    }
    return error.response?.data?.detail || error.message || fallback;
  };

  const obtenerTareas = async () => {
    try {
      setCargando(true);
      const respuesta = await axios.get<Tarea[]>(`${API_URL}/tareas/`);
      setTareas(respuesta.data);
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
    <div style={{ padding: '30px', width: '100%', boxSizing: 'border-box' }}>
      {/* Encabezado */}
      <div className="section-header" style={{ marginBottom: '25px' }}>
        <h1 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '26px' }}>
          Gestión de Tareas y Comentarios
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
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
            backgroundColor: notificacion.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
            color: notificacion.tipo === 'exito' ? '#15803d' : '#b91c1c',
            border: `1px solid ${notificacion.tipo === 'exito' ? '#86efac' : '#fca5a5'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notificacion.texto}</span>
          <button
            onClick={() => setNotificacion(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Contenido en Grilla: Formulario + Listado & Comentarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Formulario de Creación */}
        <div
          style={{
            backgroundColor: 'rgba(16, 21, 31, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255, 214, 10, 0.2)',
          }}
        >
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ color: '#ffffff', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ffd60a' }}>➕</span> Nueva Tarea
            </h2>
          </div>

          <form onSubmit={crearTarea} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: 0 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ffd60a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Nombre de la Tarea *
              </label>
              <input
                type="text"
                placeholder="Ej: Fundición de losa piso 2"
                value={nombreTarea}
                onChange={(e) => setNombreTarea(e.target.value)}
                required
                maxLength={150}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(10, 13, 20, 0.85)',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ffd60a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Descripción Detallada
              </label>
              <textarea
                placeholder="Detalla las especificaciones técnicas o instrucciones para el operario..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(10, 13, 20, 0.85)',
                  color: '#ffffff',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ffd60a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Estado Inicial
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '13px',
                    backgroundColor: 'rgba(10, 13, 20, 0.85)',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  {ESTADOS_DISPONIBLES.map((est) => (
                    <option key={est} value={est} style={{ backgroundColor: '#10151f', color: '#fff' }}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ffd60a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Proyecto
                </label>
                {proyectos.length > 0 ? (
                  <select
                    value={proyectoId}
                    onChange={(e) => setProyectoId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: '13px',
                      backgroundColor: 'rgba(10, 13, 20, 0.85)',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id} style={{ backgroundColor: '#10151f', color: '#fff' }}>
                        {p.nombre_proyecto}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Cargando...</span>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ffd60a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ID Operario Asignado
              </label>
              <input
                type="number"
                min="1"
                value={usuarioId}
                onChange={(e) => setUsuarioId(Number(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(10, 13, 20, 0.85)',
                  color: '#ffffff',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              style={{
                backgroundColor: guardando ? '#64748b' : '#ffd60a',
                color: '#000000',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                fontSize: '14px',
                marginTop: '6px',
                boxShadow: '0 4px 15px rgba(255, 214, 10, 0.25)',
                transition: 'background 0.2s',
              }}
            >
              {guardando ? 'Guardando en BD...' : 'Guardar Tarea'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Listado de Tareas y Panel de Comentarios Reubicado */}
        <div style={{ display: 'grid', gridTemplateColumns: tareaSeleccionada ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Tarjeta de Lista de Tareas */}
          <div
            style={{
              backgroundColor: 'rgba(16, 21, 31, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255, 214, 10, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '14px',
                marginBottom: '16px',
              }}
            >
              <div>
                <h2 style={{ color: '#ffffff', margin: 0, fontSize: '18px' }}>
                  Listado de Tareas ({tareasFiltradas.length})
                </h2>
              </div>

              {/* Filtro por estado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Filtrar:</span>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '12px',
                    backgroundColor: 'rgba(10, 13, 20, 0.85)',
                    color: '#ffffff',
                  }}
                >
                  <option value="Todos" style={{ backgroundColor: '#10151f', color: '#fff' }}>Todos los estados</option>
                  {ESTADOS_DISPONIBLES.map((est) => (
                    <option key={est} value={est} style={{ backgroundColor: '#10151f', color: '#fff' }}>
                      {est}
                    </option>
                  ))}
                </select>
                <button
                  onClick={obtenerTareas}
                  title="Recargar tareas"
                  style={{
                    backgroundColor: '#ffd60a',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  🔄
                </button>
              </div>
            </div>

            {cargando ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Cargando tareas desde PostgreSQL...
              </div>
            ) : tareasFiltradas.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
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
                      key={t.id}
                      style={{
                        padding: '16px',
                        border: estaSeleccionada ? '2px solid #ffd60a' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: estaSeleccionada ? 'rgba(255, 214, 10, 0.12)' : 'rgba(20, 26, 38, 0.75)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: estaSeleccionada ? '0 4px 15px rgba(255, 214, 10, 0.25)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#ffd60a', fontWeight: 700 }}>#{t.id}</span>
                            <strong style={{ color: '#ffffff', fontSize: '15px' }}>{t.nombre_tarea}</strong>
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
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                            title="Cambiar estado de la tarea"
                          >
                            {ESTADOS_DISPONIBLES.map((est) => (
                              <option key={est} value={est} style={{ backgroundColor: '#10151f', color: '#fff' }}>
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
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '12px',
                          color: '#94a3b8',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span>🏗 Proyecto: #{t.proyecto_id}</span>
                          <span>👤 Operario: #{t.usuario_id}</span>
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setTareaSeleccionada(estaSeleccionada ? null : t)}
                            style={{
                              backgroundColor: estaSeleccionada ? '#000000' : '#ffd60a',
                              color: estaSeleccionada ? '#ffd60a' : '#000000',
                              border: 'none',
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
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
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