import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Turno {
  id: number;
  proyecto_id: number;
  usuario_id: number;
  fecha_turno: string;
  hora_inicio: string;
  hora_fin: string;
  estado_asistencia: string;
}

interface Proyecto {
  id: number;
  nombre_proyecto: string;
}

interface Usuario {
  id: number;
  nombre_completo: string;
  correo_electronico?: string;
}

interface TurnosTabProps {
  rol?: number;
}

const ESTADOS = ['Programado', 'Prioridad', 'Confirmado', 'Presente', 'Ausente'];

export const TurnosTab = ({ rol }: TurnosTabProps = {}) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const [proyectoId, setProyectoId] = useState<number | ''>('');
  const [usuarioId, setUsuarioId] = useState<number | ''>('');
  const [fechaTurno, setFechaTurno] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [estadoAsistencia, setEstadoAsistencia] = useState('Programado');

  const currentUserId = Number(localStorage.getItem('usuario_id') || '1');
  const currentUserName = localStorage.getItem('usuario_nombre') || 'Mi Usuario';
  const rolEfectivo = rol !== undefined ? rol : Number(localStorage.getItem('usuario_rol') || '3');
  const esAdmin = rolEfectivo === 1;

  const cargarTodo = async () => {
    setCargando(true);
    setError('');
    try {
      // Si no es admin, solo carga turnos y proyectos de este usuario/obra
      const urlTurnos = esAdmin ? '/turnos/' : `/turnos/?usuario_id=${currentUserId}`;
      const urlProyectos = esAdmin ? '/proyectos/' : `/proyectos/?usuario_id=${currentUserId}`;

      const [rTurnos, rProyectos, rUsuarios] = await Promise.all([
        fetchConToken(urlTurnos),
        fetchConToken(urlProyectos),
        fetchConToken('/usuarios/'),
      ]);

      if (!rTurnos.ok) throw new Error('No se pudieron cargar los turnos.');
      const listTurnos = await rTurnos.json();
      const listProyectos = rProyectos.ok ? await rProyectos.json() : [];
      const listUsuarios = rUsuarios.ok ? await rUsuarios.json() : [];

      setTurnos(listTurnos);
      setProyectos(listProyectos);
      setUsuarios(listUsuarios);

      // Selección por defecto del proyecto
      if (listProyectos.length > 0 && !proyectoId) {
        setProyectoId(listProyectos[0].id);
      }

      // Si no es admin, el operario siempre es el usuario actual
      if (!esAdmin) {
        setUsuarioId(currentUserId);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los turnos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolEfectivo]);

  const nombreProyecto = (id: number) => proyectos.find((p) => p.id === id)?.nombre_proyecto || `Proyecto #${id}`;
  const nombreUsuario = (id: number) => {
    if (!esAdmin && id === currentUserId) return currentUserName;
    return usuarios.find((u) => u.id === id)?.nombre_completo || `Usuario #${id}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idOperario = esAdmin ? Number(usuarioId) : currentUserId;
    if (!proyectoId || !idOperario || !fechaTurno || !horaInicio || !horaFin) return;

    setGuardando(true);
    try {
      const respuesta = await fetchConToken('/turnos/', {
        method: 'POST',
        body: JSON.stringify({
          proyecto_id: Number(proyectoId),
          usuario_id: idOperario,
          fecha_turno: fechaTurno,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          estado_asistencia: estadoAsistencia,
        }),
      });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo crear el turno.');
      }
      setFechaTurno('');
      setHoraInicio('');
      setHoraFin('');
      setEstadoAsistencia('Programado');
      await cargarTodo();
    } catch (err: any) {
      alert(err.message || 'No se pudo crear el turno.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      const respuesta = await fetchConToken(`/turnos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado_asistencia: nuevoEstado }),
      });
      if (!respuesta.ok) throw new Error('No se pudo actualizar el estado del turno.');
      await cargarTodo();
    } catch (err: any) {
      alert(err.message || 'No se pudo actualizar la asistencia.');
    }
  };

  const eliminarTurno = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este turno?')) return;
    try {
      const respuesta = await fetchConToken(`/turnos/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) throw new Error('No se pudo eliminar el turno.');
      await cargarTodo();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el turno.');
    }
  };

  const renderBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'Prioridad':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
            background: '#fef3c7',
            color: '#b45309',
            border: '1px solid #f59e0b'
          }}>
            <i className="fas fa-bolt"></i> Prioridad
          </span>
        );
      case 'Confirmado':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
            background: '#dcfce7',
            color: '#15803d',
            border: '1px solid #22c55e'
          }}>
            <i className="fas fa-check-circle"></i> Confirmado
          </span>
        );
      case 'Programado':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #38bdf8'
          }}>
            <i className="fas fa-clock"></i> Programado
          </span>
        );
      case 'Presente':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#f3e8ff',
            color: '#6b21a8',
            border: '1px solid #c084fc'
          }}>
            <i className="fas fa-user-check"></i> Presente
          </span>
        );
      case 'Ausente':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #f87171'
          }}>
            <i className="fas fa-user-times"></i> Ausente
          </span>
        );
      default:
        return (
          <span style={{ padding: '3px 8px', borderRadius: '10px', background: '#f1f5f9', fontSize: '11px' }}>
            {estado}
          </span>
        );
    }
  };

  const turnosFiltrados = turnos.filter((t) => {
    if (filtroEstado === 'todos') return true;
    return t.estado_asistencia.toLowerCase() === filtroEstado.toLowerCase();
  });

  return (
    <div className="tab-content active">
      <div className="section-header">
        <div>
          <h2><i className="fas fa-clock"></i> Gestión de Turnos y Asistencia</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            {esAdmin
              ? 'Panel de control de turnos: el Administrador puede revisar los turnos solicitados y marcarlos con Prioridad o Confirmado.'
              : 'Agenda tu turno para tu obra registrada. El Administrador revisará y asignará el estado de Prioridad o Confirmado.'}
          </p>
        </div>
      </div>

      {/* Banner de rol */}
      <div style={{
        padding: '10px 16px',
        background: esAdmin ? '#fefce8' : '#eff6ff',
        border: `1px solid ${esAdmin ? '#fef08a' : '#bfdbfe'}`,
        borderRadius: '8px',
        color: esAdmin ? '#854d0e' : '#1e40af',
        marginBottom: '16px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <i className={esAdmin ? 'fas fa-shield-alt' : 'fas fa-user-shield'}></i>
        <span>
          {esAdmin ? (
            <strong>👑 Modo Administrador:</strong>
          ) : (
            <strong>👤 Modo Operario:</strong>
          )}{' '}
          {esAdmin
            ? 'Visualizando turnos de todas las obras. Puedes cambiar el estado a Prioridad o Confirmado en 1 clic.'
            : 'Solo visualizas y programas turnos para las obras que registraste.'}
        </span>
      </div>

      <div className="grid">
        {/* Formulario para programar turno */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-plus-circle"></i> Programar Turno</h3>
          </div>

          {proyectos.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '8px' }}></i>
              <h4 style={{ margin: '0 0 6px 0', color: '#92400e' }}>No hay obras disponibles</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>
                Primero debes registrar una obra en la pestaña <strong>Proyectos de Obra</strong> para poder programar un turno.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Proyecto de Obra *</label>
                <select
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">-- Selecciona un proyecto --</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre_proyecto}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Operario / Colaborador *</label>
                {esAdmin ? (
                  <select
                    value={usuarioId}
                    onChange={(e) => setUsuarioId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">-- Selecciona un operario --</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-user-circle" style={{ color: '#0284c7' }}></i>
                    <span>{currentUserName} (Tú - Operario Registrado)</span>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Fecha del turno *</label>
                <input
                  type="date"
                  value={fechaTurno}
                  onChange={(e) => setFechaTurno(e.target.value)}
                  required
                />
              </div>

              <div className="date-row">
                <div className="input-group">
                  <label>Hora inicio *</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Hora fin *</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Estado Inicial de la Asistencia</label>
                <select
                  value={estadoAsistencia}
                  onChange={(e) => setEstadoAsistencia(e.target.value)}
                  disabled={!esAdmin} // Para operarios entra por defecto en Programado
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                {!esAdmin && (
                  <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    ℹ️ Entra como "Programado". El Administrador revisará y podrá marcarlo como "Prioridad" o "Confirmado".
                  </small>
                )}
              </div>

              <button type="submit" className="btn-save" disabled={guardando}>
                {guardando ? 'Guardando turno...' : '📅 Programar Turno'}
              </button>
            </form>
          )}
        </div>

        {/* Listado de turnos */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3><i className="fas fa-list-check"></i> Turnos Registrados ({turnosFiltrados.length})</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              >
                <option value="todos">Todos los estados</option>
                <option value="prioridad">⚡ Prioridad</option>
                <option value="confirmado">✅ Confirmados</option>
                <option value="programado">🕒 Programados</option>
                <option value="presente">👤 Presentes</option>
                <option value="ausente">❌ Ausentes</option>
              </select>
            </div>
          </div>

          <div className="project-container">
            {error && <div className="empty-msg" style={{ color: '#dc2626' }}>{error}</div>}
            {cargando && <div className="empty-msg">Cargando turnos...</div>}
            {!cargando && !error && turnosFiltrados.length === 0 && (
              <div className="empty-msg">
                <i className="fas fa-calendar-times" style={{ fontSize: '30px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}></i>
                No hay turnos registrados que coincidan con la búsqueda.
              </div>
            )}

            {!cargando && turnosFiltrados.map((t) => (
              <div key={t.id} className="project-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                        <i className="fas fa-user-hard-hat" style={{ color: '#f59e0b', marginRight: '4px' }}></i>
                        {nombreUsuario(t.usuario_id)}
                      </h4>
                      {renderBadgeEstado(t.estado_asistencia)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      <i className="fas fa-building" style={{ color: '#94a3b8', marginRight: '4px' }}></i>
                      <strong>{nombreProyecto(t.proyecto_id)}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      <i className="fas fa-calendar-day" style={{ color: '#94a3b8', marginRight: '4px' }}></i>
                      Fecha: <strong>{t.fecha_turno}</strong> · Horario: <strong>{t.hora_inicio} a {t.hora_fin}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => eliminarTurno(t.id)}
                    className="btn-delete"
                    title="Eliminar turno"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                {/* Acciones de gestión para el Administrador */}
                {esAdmin ? (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                      Acciones Admin:
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(t.id, 'Prioridad')}
                      style={{
                        padding: '4px 10px',
                        background: t.estado_asistencia === 'Prioridad' ? '#f59e0b' : '#fff',
                        color: t.estado_asistencia === 'Prioridad' ? '#fff' : '#b45309',
                        border: '1px solid #f59e0b',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fas fa-bolt"></i> Prioridad
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(t.id, 'Confirmado')}
                      style={{
                        padding: '4px 10px',
                        background: t.estado_asistencia === 'Confirmado' ? '#10b981' : '#fff',
                        color: t.estado_asistencia === 'Confirmado' ? '#fff' : '#15803d',
                        border: '1px solid #10b981',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fas fa-check-circle"></i> Confirmar
                    </button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Cambiar a:</span>
                      <select
                        value={t.estado_asistencia}
                        onChange={(e) => cambiarEstado(t.id, e.target.value)}
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  // Mensaje de estado para el Operario
                  <div style={{
                    padding: '6px 10px',
                    background: t.estado_asistencia === 'Prioridad'
                      ? '#fffbeb'
                      : t.estado_asistencia === 'Confirmado'
                      ? '#f0fdf4'
                      : '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: t.estado_asistencia === 'Prioridad'
                      ? '#b45309'
                      : t.estado_asistencia === 'Confirmado'
                      ? '#15803d'
                      : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {t.estado_asistencia === 'Prioridad' && (
                      <>
                        <i className="fas fa-exclamation-circle" style={{ color: '#f59e0b' }}></i>
                        <span>Turno catalogado como <strong>ALTA PRIORIDAD</strong> por la administración.</span>
                      </>
                    )}
                    {t.estado_asistencia === 'Confirmado' && (
                      <>
                        <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                        <span>Turno <strong>CONFIRMADO</strong> por la administración para ejecución de labores.</span>
                      </>
                    )}
                    {t.estado_asistencia === 'Programado' && (
                      <>
                        <i className="fas fa-clock" style={{ color: '#0284c7' }}></i>
                        <span>Turno programado pendiente de validación o asignación de prioridad por el administrador.</span>
                      </>
                    )}
                    {['Presente', 'Ausente'].includes(t.estado_asistencia) && (
                      <>
                        <i className="fas fa-info-circle"></i>
                        <span>Registro de asistencia cerrado ({t.estado_asistencia}).</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
