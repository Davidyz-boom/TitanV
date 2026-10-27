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

  const [proyectoEnlaceId, setProyectoEnlaceId] = useState<number | null>(null);
  const [rolEnlace, setRolEnlace] = useState<'Trabajador' | 'Visualizador'>('Trabajador');
  const [enlaceGenerado, setEnlaceGenerado] = useState('');
  const [generandoEnlace, setGenerandoEnlace] = useState(false);

  const usuarioId = localStorage.getItem('usuario_id') || '1';

  const cargarProyectos = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await fetchConToken(`/proyectos/?usuario_id=${usuarioId}`);
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

  const abrirGeneradorEnlace = (id: number) => {
    setProyectoEnlaceId(id);
    setRolEnlace('Trabajador');
    setEnlaceGenerado('');
  };

  const generarEnlace = async () => {
    if (!proyectoEnlaceId) return;
    setGenerandoEnlace(true);
    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoEnlaceId}/enlaces`, {
        method: 'POST',
        body: JSON.stringify({ rol: rolEnlace }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data?.detail || 'No se pudo generar el enlace.');

      const url = `${window.location.origin}/invitacion/${data.token}`;
      setEnlaceGenerado(url);
    } catch (err: any) {
      alert(err.message || 'No se pudo generar el enlace.');
    } finally {
      setGenerandoEnlace(false);
    }
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(enlaceGenerado);
    alert('Enlace copiado. Compártelo con la persona que quieres invitar.');
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
              <div key={p.id} className="project-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>{p.nombre_proyecto}</h4>
                    <span style={{ fontSize: '12px', color: '#666' }}>{p.ubicacion_direccion} — {p.estado}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => abrirGeneradorEnlace(p.id)}
                      style={{ background: '#ffd60a', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <i className="fas fa-share-nodes"></i> Compartir
                    </button>
                    <button onClick={() => eliminarProyecto(p.id, p.nombre_proyecto)} className="btn-delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                {proyectoEnlaceId === p.id && (
                  <div style={{ marginTop: '10px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Rol para quien entre con este enlace
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <select
                        value={rolEnlace}
                        onChange={(e) => setRolEnlace(e.target.value as 'Trabajador' | 'Visualizador')}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="Trabajador">Trabajador (puede subir avances)</option>
                        <option value="Visualizador">Visualizador (solo puede ver)</option>
                      </select>
                      <button
                        onClick={generarEnlace}
                        disabled={generandoEnlace}
                        style={{ background: '#000', color: '#ffd60a', border: 'none', borderRadius: '6px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {generandoEnlace ? 'Generando...' : 'Generar enlace'}
                      </button>
                    </div>
                    {enlaceGenerado && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input readOnly value={enlaceGenerado} style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        <button onClick={copiarEnlace} style={{ background: '#ffd60a', border: 'none', borderRadius: '6px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>
                          Copiar
                        </button>
                      </div>
                    )}
                    <p style={{ fontSize: '11px', color: '#888', marginTop: '8px', marginBottom: 0 }}>
                      El enlace expira en 7 días. Cualquiera que entre a Titan V con este link queda vinculado
                      con el rol que elegiste arriba — no necesitas saber su correo de antemano.
                    </p>
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
