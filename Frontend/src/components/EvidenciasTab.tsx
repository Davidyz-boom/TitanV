import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Evidencia {
  id: number;
  proyecto_id: number;
  usuario_id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  descripcion?: string;
  fecha_subida: string;
}

interface Proyecto {
  id: number;
  nombre_proyecto: string;
}

const API_URL = 'http://localhost:8000';

export const EvidenciasTab = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoId, setProyectoId] = useState<number | ''>('');
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const [archivo, setArchivo] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');

  const rolStorage = localStorage.getItem('usuario_rol');
  const esAdmin = Number(rolStorage) === 1;
  const usuarioId = localStorage.getItem('usuario_id') || '1';

  const cargarProyectos = async () => {
    const url = esAdmin ? '/proyectos/' : `/proyectos/?usuario_id=${usuarioId}`;
    const respuesta = await fetchConToken(url);
    if (respuesta.ok) {
      const data = await respuesta.json();
      setProyectos(data);
      if (data.length > 0) setProyectoId(data[0].id);
    }
  };

  const cargarEvidencias = async (id: number) => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await fetchConToken(`/proyectos/${id}/evidencias/`);
      if (!respuesta.ok) throw new Error('No se pudieron cargar las evidencias.');
      setEvidencias(await respuesta.json());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las evidencias.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProyectos();
  }, []);

  useEffect(() => {
    if (proyectoId) cargarEvidencias(Number(proyectoId));
  }, [proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !proyectoId) return;

    setSubiendo(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      if (descripcion) formData.append('descripcion', descripcion);

      const token = localStorage.getItem('token');
      const respuesta = await fetch(
        `${API_URL}/proyectos/${proyectoId}/evidencias/?usuario_id=${usuarioId}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData, // OJO: sin Content-Type manual, el navegador arma el boundary del multipart
        }
      );

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo subir el archivo.');
      }

      setArchivo(null);
      setDescripcion('');
      (document.getElementById('input-archivo-evidencia') as HTMLInputElement).value = '';
      await cargarEvidencias(Number(proyectoId));
    } catch (err: any) {
      alert(err.message || 'No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarEvidencia = async (id: number) => {
    if (!window.confirm('¿Eliminar esta evidencia?')) return;
    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoId}/evidencias/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) throw new Error('No se pudo eliminar.');
      await cargarEvidencias(Number(proyectoId));
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar la evidencia.');
    }
  };

  const esImagen = (nombre: string) => /\.(jpg|jpeg|png|webp)$/i.test(nombre);

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-camera"></i> Evidencias de Obra</h2>
      </div>

      <div className="input-group" style={{ maxWidth: '360px', marginBottom: '20px' }}>
        <label>Proyecto</label>
        <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value ? Number(e.target.value) : '')}>
          {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre_proyecto}</option>)}
        </select>
      </div>

      <div className="grid">
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
            <button type="submit" className="btn-save" disabled={subiendo || !proyectoId}>
              {subiendo ? 'Subiendo...' : 'Subir evidencia'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3><i className="fas fa-images"></i> Evidencias del proyecto</h3></div>
          <div className="project-container">
            {error && <div className="empty-msg" style={{ color: '#dc2626' }}>{error}</div>}
            {cargando && <div className="empty-msg">Cargando evidencias...</div>}
            {!cargando && !error && evidencias.length === 0 && (
              <div className="empty-msg">Todavía no hay evidencias para este proyecto.</div>
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
                <button onClick={() => eliminarEvidencia(ev.id)} className="btn-delete">
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
