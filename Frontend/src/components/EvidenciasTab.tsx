import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Evidencia {
  id: number;
  tarea_id: number;
  usuario_id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  descripcion?: string;
  fecha_subida: string;
}

interface Tarea {
  id: number;
  nombre_tarea: string;
  proyecto_id: number;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

interface EvidenciasTabProps {
  proyectoId?: number;
  rolProyecto?: string;
}

export const EvidenciasTab = ({ proyectoId: proyectoFijo, rolProyecto }: EvidenciasTabProps) => {
  const rolSistema = Number(localStorage.getItem('rol') || 3);
  const esAdministrador = rolSistema === 1 || rolProyecto === 'Arquitecto';
  const esTrabajador = rolSistema === 2 || rolProyecto === 'Trabajador';
  const esVisualizador = rolProyecto === 'Visualizador' || (!esAdministrador && !esTrabajador);

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tareaId, setTareaId] = useState<number | ''>('');
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const [archivo, setArchivo] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');

  const usuarioId = localStorage.getItem('usuario_id') || '1';

  const cargarTareas = async () => {
    const query = proyectoFijo ? `/?proyecto_id=${proyectoFijo}` : '';
    const respuesta = await fetchConToken(`/tareas${query}`);
    if (respuesta.ok) {
      const data = await respuesta.json();
      setTareas(data);
      if (data.length > 0) setTareaId(data[0].id);
    }
  };

  const cargarEvidencias = async (id: number) => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await fetchConToken(`/tareas/${id}/evidencias/`);
      if (!respuesta.ok) throw new Error('No se pudieron cargar las evidencias.');
      setEvidencias(await respuesta.json());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las evidencias.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  useEffect(() => {
    if (tareaId) cargarEvidencias(Number(tareaId));
  }, [tareaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !tareaId) return;

    setSubiendo(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      if (descripcion) formData.append('descripcion', descripcion);

      const token = localStorage.getItem('token');
      const respuesta = await fetch(
        `${API_URL}/tareas/${tareaId}/evidencias/?usuario_id=${usuarioId}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        }
      );

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo subir el archivo.');
      }

      setArchivo(null);
      setDescripcion('');
      (document.getElementById('input-archivo-evidencia') as HTMLInputElement).value = '';
      await cargarEvidencias(Number(tareaId));
    } catch (err: any) {
      alert(err.message || 'No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarEvidencia = async (id: number) => {
    if (!window.confirm('¿Eliminar esta evidencia?')) return;
    try {
      const respuesta = await fetchConToken(`/tareas/${tareaId}/evidencias/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) throw new Error('No se pudo eliminar.');
      await cargarEvidencias(Number(tareaId));
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar la evidencia.');
    }
  };

  const esImagen = (nombre: string) => /\.(jpg|jpeg|png|webp)$/i.test(nombre);

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-camera"></i> Evidencias de Tareas</h2>
      </div>

      {esVisualizador && (
        <div style={{
          backgroundColor: 'rgba(74, 222, 128, 0.12)',
          border: '1px solid rgba(74, 222, 128, 0.35)',
          color: '#4ade80',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <i className="fas fa-eye" style={{ fontSize: '16px' }}></i>
          <span><strong>Modo Visualizador (Solo Lectura):</strong> Consulta fotos y archivos técnicos adjuntos sin modificar ni eliminar evidencias.</span>
        </div>
      )}

      <div className="input-group" style={{ maxWidth: '360px', marginBottom: '20px' }}>
        <label>Tarea</label>
        <select value={tareaId} onChange={(e) => setTareaId(e.target.value ? Number(e.target.value) : '')}>
          {tareas.length === 0 && <option value="">No hay tareas creadas</option>}
          {tareas.map((t) => <option key={t.id} value={t.id}>{t.nombre_tarea}</option>)}
        </select>
      </div>

      <div className="grid" style={{ gridTemplateColumns: esVisualizador ? '1fr' : undefined }}>
        {!esVisualizador && (
          <div className="card">
            <div className="card-header"><h3><i className="fas fa-upload"></i> Subir evidencia</h3></div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Archivo (foto, PDF o video)</label>
                <input
                  id="input-archivo-evidencia"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Descripción (opcional)</label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Vaciado de placa nivel 2" maxLength={300} />
              </div>
              <button type="submit" className="btn-save" disabled={subiendo || !tareaId}>
                {subiendo ? 'Subiendo...' : 'Subir evidencia'}
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h3><i className="fas fa-images"></i> Evidencias de la tarea</h3></div>
          <div className="project-container">
            {error && <div className="empty-msg" style={{ color: '#dc2626' }}>{error}</div>}
            {cargando && <div className="empty-msg">Cargando evidencias...</div>}
            {!cargando && !error && evidencias.length === 0 && (
              <div className="empty-msg">Todavía no hay evidencias para esta tarea.</div>
            )}
            {!cargando && evidencias.map((ev) => (
              <div key={ev.id} className="project-item" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {esImagen(ev.nombre_archivo) ? (
                    <img
                      src={`${API_URL}${ev.ruta_archivo}`}
                      alt={ev.nombre_archivo}
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f1f1', borderRadius: '6px' }}>
                      <i className="fas fa-file" style={{ fontSize: '20px', color: '#888' }}></i>
                    </div>
                  )}
                  <div>
                    <a href={`${API_URL}${ev.ruta_archivo}`} target="_blank" rel="noreferrer">
                      <h4 style={{ margin: 0 }}>{ev.nombre_archivo}</h4>
                    </a>
                    {ev.descripcion && <span style={{ fontSize: '12px', color: '#666' }}>{ev.descripcion}</span>}
                    <div style={{ fontSize: '11px', color: '#999' }}>{new Date(ev.fecha_subida).toLocaleString()}</div>
                  </div>
                </div>
                {esAdministrador && (
                  <button onClick={() => eliminarEvidencia(ev.id)} className="btn-delete">
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
