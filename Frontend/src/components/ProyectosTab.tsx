import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Proyecto {
  id: number;
  nombre_proyecto: string;
  ubicacion_direccion: string;
  estado: 'Planificación' | 'En Ejecución' | 'Finalizado';
  fecha_inicio: string;
  fecha_fin_estimada: string;
}

const ESTADOS: Proyecto['estado'][] = ['Planificación', 'En Ejecución', 'Finalizado'];

interface ProyectosTabProps {
  onProyectoCreado?: () => void;
}

export const ProyectosTab = ({ onProyectoCreado }: ProyectosTabProps = {}) => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [estado, setEstado] = useState<Proyecto['estado']>('Planificación');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [guardando, setGuardando] = useState(false);

  const rolStorage = localStorage.getItem('usuario_rol');
  const esAdmin = Number(rolStorage) === 1;
  const usuarioId = localStorage.getItem('usuario_id') || '1';

  const cargarProyectos = async () => {
    setCargando(true);
    setError('');
    try {
      const url = esAdmin ? '/proyectos/' : `/proyectos/?usuario_id=${usuarioId}`;
      const respuesta = await fetchConToken(url);
      if (!respuesta.ok) throw new Error('No se pudieron cargar los proyectos.');
      setProyectos(await respuesta.json());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los proyectos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProyectos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProyecto || !ubicacion || !fechaInicio || !fechaFin) return;

    setGuardando(true);
    try {
      const respuesta = await fetchConToken(`/proyectos/?usuario_id=${usuarioId}`, {
        method: 'POST',
        body: JSON.stringify({
          nombre_proyecto: nombreProyecto,
          ubicacion_direccion: ubicacion,
          estado,
          fecha_inicio: fechaInicio,
          fecha_fin_estimada: fechaFin,
        }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo crear el proyecto.');
      }

      setNombreProyecto('');
      setUbicacion('');
      setEstado('Planificación');
      setFechaInicio('');
      setFechaFin('');
      await cargarProyectos();
      onProyectoCreado?.();
    } catch (err: any) {
      alert(err.message || 'No se pudo crear el proyecto.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarProyecto = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar el proyecto "${nombre}"?`)) return;
    try {
      const respuesta = await fetchConToken(`/proyectos/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo eliminar el proyecto.');
      }
      await cargarProyectos();
      onProyectoCreado?.();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el proyecto.');
    }
  };

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-project-diagram"></i> Panel de Proyectos Activos</h2>
      </div>
      <div className="grid">
        <div className="card">
          <div className="card-header"><h3><i className="fas fa-plus-circle"></i> Crear Nuevo Proyecto</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nombre de la Obra</label>
              <input type="text" value={nombreProyecto} onChange={(e) => setNombreProyecto(e.target.value)} placeholder="Ej: Edificio Calle 100" required />
            </div>
            <div className="input-group">
              <label>Ubicación</label>
              <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej: Calle 100 #15-30, Bogotá" required />
            </div>
            <div className="input-group">
              <label>Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value as Proyecto['estado'])}>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="date-row">
              <div className="input-group">
                <label>Fecha Inicio</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Fin Estimado</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn-save" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Registrar e Iniciar Obra'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3><i className="fas fa-list"></i> Obras Registradas</h3></div>
          <div className="project-container">
            {error && <div className="empty-msg" style={{ color: '#dc2626' }}>{error}</div>}
            {cargando && <div className="empty-msg">Cargando proyectos...</div>}
            {!cargando && !error && proyectos.length === 0 && (
              <div className="empty-msg">No hay proyectos registrados actualmente.</div>
            )}
            {!cargando && proyectos.map((p) => (
              <div key={p.id} className="project-item">
                <div>
                  <h4>{p.nombre_proyecto}</h4>
                  <span style={{ fontSize: '12px', color: '#666' }}>{p.ubicacion_direccion} — {p.estado}</span>
                </div>
                <button onClick={() => eliminarProyecto(p.id, p.nombre_proyecto)} className="btn-delete">
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
