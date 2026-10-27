import { useEffect, useMemo, useState } from 'react';
import { fetchConToken } from '../api';

interface Material {
  id: number;
  nombre_material: string;
  unidad_medida: string;
  proyecto_id: number;
  cantidad_inicial: number;
  cantidad_disponible: number;
}

interface Solicitud {
  id: number;
  proyecto_id: number;
  material_id: number;
  usuario_id: number;
  cantidad: number;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Entregada';
  fecha_solicitud: string;
  material_nombre?: string;
  unidad_medida?: string;
  usuario_nombre?: string;
}

interface MaterialesTabProps {
  proyectoId: number;
  proyectoNombre?: string;
  rolProyecto?: string;
}

const estadoClass = (estado: Solicitud['estado']) => `estado estado-${estado.toLowerCase()}`;

const UNIDADES_MEDIDA = [
  'Unidad', 'Bulto', 'Saco', 'Caja', 'Rollo', 'Varilla',
  'Kilogramo (kg)', 'Gramo (g)', 'Tonelada (t)',
  'Litro (L)', 'Galón',
  'Metro (m)', 'Metro cuadrado (m²)', 'Metro cúbico (m³)',
];

export const MaterialesTab = ({ proyectoId, proyectoNombre, rolProyecto }: MaterialesTabProps) => {
  const esAdministrador = rolProyecto === 'Arquitecto';
  const puedeCrearSolicitud = esAdministrador || rolProyecto === 'Trabajador';
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<Material | null>(null);
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('');
  const [cantidadInicial, setCantidadInicial] = useState('');
  const [materialSolicitud, setMaterialSolicitud] = useState('');
  const [cantidadSolicitud, setCantidadSolicitud] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardandoSolicitud, setGuardandoSolicitud] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const [materialesResp, solicitudesResp] = await Promise.all([
        fetchConToken(`/materiales/?proyecto_id=${proyectoId}`),
        fetchConToken(`/solicitudes/?proyecto_id=${proyectoId}`),
      ]);
      if (!materialesResp.ok) throw new Error('No se pudieron cargar los materiales.');
      if (!solicitudesResp.ok) throw new Error('No se pudieron cargar las solicitudes.');
      setMateriales(await materialesResp.json());
      setSolicitudes(await solicitudesResp.json());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const materialesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return materiales;
    return materiales.filter((m) => `${m.nombre_material} ${m.unidad_medida}`.toLowerCase().includes(termino));
  }, [materiales, busqueda]);

  const limpiarFormulario = () => {
    setNombre('');
    setUnidad('');
    setCantidadInicial('');
    setEditando(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esAdministrador) return;
    if (!nombre.trim() || !unidad.trim()) return;
    const cantidad = Number(cantidadInicial);
    if (!editando && (!Number.isFinite(cantidad) || cantidad < 0)) return;
    setGuardando(true);
    try {
      const respuesta = editando
        ? await fetchConToken(`/materiales/${editando.id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre_material: nombre.trim(), unidad_medida: unidad.trim() }),
          })
        : await fetchConToken('/materiales/', {
            method: 'POST',
            body: JSON.stringify({
              nombre_material: nombre.trim(),
              unidad_medida: unidad.trim(),
              cantidad_inicial: cantidad,
              proyecto_id: proyectoId,
            }),
          });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo guardar el material.');
      }
      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'No se pudo guardar el material.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (material: Material) => {
    if (!esAdministrador) return;
    setEditando(material);
    setNombre(material.nombre_material);
    setUnidad(material.unidad_medida);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarMaterial = async (id: number, nombreMaterial: string) => {
    if (!esAdministrador) return;
    if (!window.confirm(`¿Eliminar "${nombreMaterial}" del catálogo?`)) return;
    try {
      const respuesta = await fetchConToken(`/materiales/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo eliminar el material.');
      }
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el material.');
    }
  };

  const crearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeCrearSolicitud) return;
    const cantidad = Number(cantidadSolicitud);
    if (!materialSolicitud || !Number.isFinite(cantidad) || cantidad <= 0) return;
    setGuardandoSolicitud(true);
    try {
      const respuesta = await fetchConToken('/solicitudes/', {
        method: 'POST',
        body: JSON.stringify({ proyecto_id: proyectoId, material_id: Number(materialSolicitud), cantidad }),
      });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo crear la solicitud.');
      }
      setMaterialSolicitud('');
      setCantidadSolicitud('');
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'No se pudo crear la solicitud.');
    } finally {
      setGuardandoSolicitud(false);
    }
  };

  const cambiarEstado = async (solicitud: Solicitud, estado: Solicitud['estado']) => {
    if (!esAdministrador) return;
    try {
      const respuesta = await fetchConToken(`/solicitudes/${solicitud.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(data?.detail || 'No se pudo actualizar la solicitud.');
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'No se pudo actualizar la solicitud.');
    }
  };

  
  return (
    <div className="tab-content active materiales-page">
      <div className="section-header">
        <h2><i className="fas fa-boxes-stacked"></i> Materiales</h2>
        {proyectoNombre && <p style={{ color: '#666' }}>Proyecto activo: <strong>{proyectoNombre}</strong></p>}
      </div>

      {error && <div className="empty-msg" style={{ color: '#dc2626', background: '#fff', borderRadius: 10, marginBottom: 20 }}>{error}</div>}

      <div className="grid">
        {esAdministrador && <div className="card">
          <div className="card-header"><h3><i className={editando ? 'fas fa-pen' : 'fas fa-plus-circle'}></i> {editando ? 'Editar material' : 'Crear material'}</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nombre del material</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cemento Gris ARGOS" required />
            </div>
            <div className="input-group">
              <label>Unidad de medida</label>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)} required>
                <option value="">Selecciona una unidad</option>
                {editando && unidad && !UNIDADES_MEDIDA.includes(unidad) && <option value={unidad}>{unidad}</option>}
                {UNIDADES_MEDIDA.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
              </select>
            </div>
            {!editando && <div className="input-group">
              <label>Cantidad inicial</label>
              <input type="number" min="0" step="0.01" value={cantidadInicial} onChange={(e) => setCantidadInicial(e.target.value)} placeholder="Ej: 50" required />
              <small style={{ color: '#666' }}>La cantidad se registra en el inventario usando la unidad indicada.</small>
            </div>}
            <button type="submit" className="btn-save" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear material'}
            </button>
            {editando && <button type="button" className="btn-secondary" onClick={limpiarFormulario}>Cancelar edición</button>}
          </form>
        </div>}

        <div className="card">
          <div className="card-header"><h3><i className="fas fa-search"></i> Buscar en catálogo</h3></div>
          <div style={{ padding: 20 }}>
            <input className="search-input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por material o unidad..." />
          </div>
          {cargando ? <div className="empty-msg">Cargando catálogo...</div> : materialesFiltrados.length === 0 ? <div className="empty-msg">No hay materiales que coincidan.</div> : (
            <div className="table-card" style={{ marginTop: 0 }}>
              <table>
                <thead><tr><th>Material</th><th>Cantidad inicial</th><th>Unidad</th>{esAdministrador && <th>Acciones</th>}</tr></thead>
                <tbody>{materialesFiltrados.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.nombre_material}</strong></td>
                    <td>{m.cantidad_inicial}</td>
                    <td>{m.unidad_medida}</td>
                    {esAdministrador && <td className="actions-cell">
                      <button className="btn-edit" onClick={() => iniciarEdicion(m)}><i className="fas fa-pen"></i></button>
                      <button className="btn-delete" onClick={() => eliminarMaterial(m.id, m.nombre_material)}><i className="fas fa-trash"></i></button>
                    </td>}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 30 }}>
        <div className="card-header"><h3><i className="fas fa-file-circle-plus"></i> Solicitudes de materiales</h3></div>
        {puedeCrearSolicitud && <form onSubmit={crearSolicitud} className="form-horizontal request-form">
          <div className="input-group"><label>Material</label><select value={materialSolicitud} onChange={(e) => setMaterialSolicitud(e.target.value)} required><option value="">Selecciona un material</option>{materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre_material} ({m.unidad_medida})</option>)}</select></div>
          <div className="input-group"><label>Cantidad</label><input type="number" min="0.01" step="0.01" value={cantidadSolicitud} onChange={(e) => setCantidadSolicitud(e.target.value)} required /></div>
          <button type="submit" className="btn-save" disabled={guardandoSolicitud}>{guardandoSolicitud ? 'Enviando...' : 'Crear solicitud'}</button>
        </form>}

        <div className="table-card" style={{ marginTop: 0 }}>
          {solicitudes.length === 0 ? <div className="empty-msg">Todavía no hay solicitudes registradas.</div> : (
            <table>
              <thead><tr><th>Proyecto</th><th>Material</th><th>Cantidad</th><th>Estado</th><th>Historial / fecha</th>{esAdministrador && <th>Acciones</th>}</tr></thead>
              <tbody>{solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{proyectoNombre || `#${s.proyecto_id}`}</td>
                  <td>{s.material_nombre || `#${s.material_id}`}</td>
                  <td>{s.cantidad} {s.unidad_medida || ''}</td>
                  <td><span className={estadoClass(s.estado)}>{s.estado}</span></td>
                  <td>{new Date(s.fecha_solicitud).toLocaleString()}</td>
                  {esAdministrador && <td className="actions-cell">
                    {s.estado === 'Pendiente' && <><button className="btn-small" onClick={() => cambiarEstado(s, 'Aprobada')}>Aprobar</button><button className="btn-small danger" onClick={() => cambiarEstado(s, 'Rechazada')}>Rechazar</button></>}
                    {s.estado === 'Aprobada' && <button className="btn-small" onClick={() => cambiarEstado(s, 'Entregada')}>Entregar</button>}
                  </td>}
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
