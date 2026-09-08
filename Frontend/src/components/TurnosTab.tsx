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
}

const ESTADOS = ['Programado', 'Presente', 'Ausente'];

export const TurnosTab = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [proyectoId, setProyectoId] = useState<number | ''>('');
  const [usuarioId, setUsuarioId] = useState<number | ''>('');
  const [fechaTurno, setFechaTurno] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [estadoAsistencia, setEstadoAsistencia] = useState('Programado');

  const cargarTodo = async () => {
    setCargando(true);
    setError('');
    try {
      const [rTurnos, rProyectos, rUsuarios] = await Promise.all([
        fetchConToken('/turnos/'),
        fetchConToken('/proyectos/'),
        fetchConToken('/usuarios/'),
      ]);
      if (!rTurnos.ok) throw new Error('No se pudieron cargar los turnos.');
      setTurnos(await rTurnos.json());
      setProyectos(rProyectos.ok ? await rProyectos.json() : []);
      setUsuarios(rUsuarios.ok ? await rUsuarios.json() : []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los turnos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const nombreProyecto = (id: number) => proyectos.find((p) => p.id === id)?.nombre_proyecto || `Proyecto #${id}`;
  const nombreUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nombre_completo || `Usuario #${id}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoId || !usuarioId || !fechaTurno || !horaInicio || !horaFin) return;

    setGuardando(true);
    try {
      const respuesta = await fetchConToken('/turnos/', {
        method: 'POST',
        body: JSON.stringify({
          proyecto_id: Number(proyectoId),
          usuario_id: Number(usuarioId),
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
      if (!respuesta.ok) throw new Error('No se pudo actualizar la asistencia.');
      await cargarTodo();
    } catch (err: any) {
      alert(err.message || 'No se pudo actualizar la asistencia.');
    }
  };

  const eliminarTurno = async (id: number) => {
    if (!window.confirm('¿Eliminar este turno?')) return;
    try {
      const respuesta = await fetchConToken(`/turnos/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) throw new Error('No se pudo eliminar el turno.');
      await cargarTodo();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el turno.');
    }
  };

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-clock"></i> Turnos y Asistencia</h2>
      </div>
      <div className="grid">
        <div className="card">
          <div className="card-header"><h3><i className="fas fa-plus-circle"></i> Programar Turno</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Proyecto</label>
              <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value ? Number(e.target.value) : '')} required>
                <option value="">Selecciona un proyecto</option>
                {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre_proyecto}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Operario</label>
              <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value ? Number(e.target.value) : '')} required>
                <option value="">Selecciona un operario</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Fecha del turno</label>
              <input type="date" value={fechaTurno} onChange={(e) => setFechaTurno(e.target.value)} required />
            </div>
            <div className="date-row">
              <div className="input-group">
                <label>Hora inicio</label>
                <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Hora fin</label>
                <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Asistencia</label>
              <select value={estadoAsistencia} onChange={(e) => setEstadoAsistencia(e.target.value)}>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-save" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Programar turno'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3><i className="fas fa-list"></i> Turnos registrados</h3></div>
          <div className="project-container">
            {error && <div className="empty-msg" style={{ color: '#dc2626' }}>{error}</div>}
            {cargando && <div className="empty-msg">Cargando turnos...</div>}
            {!cargando && !error && turnos.length === 0 && (
              <div className="empty-msg">No hay turnos registrados todavía.</div>
            )}
            {!cargando && turnos.map((t) => (
              <div key={t.id} className="project-item">
                <div>
                  <h4>{nombreUsuario(t.usuario_id)}</h4>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {nombreProyecto(t.proyecto_id)} — {t.fecha_turno} · {t.hora_inicio}–{t.hora_fin}
                  </span>
                  <div style={{ marginTop: '6px' }}>
                    <select
                      value={t.estado_asistencia}
                      onChange={(e) => cambiarEstado(t.id, e.target.value)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => eliminarTurno(t.id)} className="btn-delete">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
