import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Material { id: number; nombre_material: string; unidad_medida: string; proyecto_id: number; }
interface Inventario { proyecto_id: number; material_id: number; cantidad_disponible: number; material_nombre?: string; unidad_medida?: string; }
interface Movimiento { id: number; proyecto_id: number; material_id: number; usuario_id: number; tipo_movimiento: string; cantidad: number; fecha_movimiento: string; material_nombre?: string; unidad_medida?: string; usuario_nombre?: string; }

export const InventarioTab = ({ proyectoId, proyectoNombre, rolProyecto }: { proyectoId: number; proyectoNombre?: string; rolProyecto?: string }) => {
  const esAdministrador = rolProyecto === 'Arquitecto';
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [tipo, setTipo] = useState<'Entrada' | 'Salida'>('Entrada');
  const [cantidad, setCantidad] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const [m, i, k] = await Promise.all([
        fetchConToken(`/materiales/?proyecto_id=${proyectoId}`),
        fetchConToken(`/movimientos/inventario/${proyectoId}`),
        fetchConToken(`/movimientos/?proyecto_id=${proyectoId}`),
      ]);
      if (!m.ok || !i.ok || !k.ok) throw new Error('No se pudo cargar el inventario.');
      setMateriales(await m.json()); setInventario(await i.json()); setMovimientos(await k.json());
    } catch (err: any) { setError(err.message || 'No se pudo cargar el inventario.'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [proyectoId]);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esAdministrador) return;
    const valor = Number(cantidad);
    if (!materialId || !Number.isFinite(valor) || valor <= 0) return;
    setGuardando(true);
    try {
      const resp = await fetchConToken('/movimientos/', { method: 'POST', body: JSON.stringify({ proyecto_id: proyectoId, material_id: Number(materialId), tipo_movimiento: tipo, cantidad: valor }) });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.detail || 'No se pudo registrar el movimiento.');
      setMaterialId(''); setCantidad(''); await cargar();
    } catch (err: any) { alert(err.message || 'No se pudo registrar el movimiento.'); }
    finally { setGuardando(false); }
  };

  const nombreMaterial = (id: number) => materiales.find((m) => m.id === id)?.nombre_material || `#${id}`;
  const unidadMaterial = (id: number) => materiales.find((m) => m.id === id)?.unidad_medida || '';

  return <div className="tab-content active">
    <div className="section-header"><h2><i className="fas fa-warehouse"></i> Inventario</h2>{proyectoNombre && <p style={{ color: '#666' }}>Obra: <strong>{proyectoNombre}</strong></p>}</div>
    {error && <div className="empty-msg" style={{ color: '#dc2626', background: '#fff', borderRadius: 10, marginBottom: 20 }}>{error}</div>}

    <div className="card">
      <div className="card-header"><h3><i className="fas fa-warehouse"></i> Inventario por obra</h3></div>
      {cargando ? <div className="empty-msg">Cargando stock...</div> : <div className="table-card" style={{ marginTop: 0 }}><table><thead><tr><th>Proyecto</th><th>Material</th><th>Stock actual</th></tr></thead><tbody>
        {inventario.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center' }}>No hay stock registrado todavía.</td></tr> : inventario.map((i) => <tr key={`${i.proyecto_id}-${i.material_id}`}><td>{proyectoNombre || `#${i.proyecto_id}`}</td><td>{i.material_nombre || nombreMaterial(i.material_id)}</td><td><strong>{i.cantidad_disponible}</strong> {i.unidad_medida || unidadMaterial(i.material_id)}</td></tr>)}
      </tbody></table></div>}
    </div>

    {esAdministrador && <div className="card" style={{ marginTop: 30 }}>
      <div className="card-header"><h3><i className="fas fa-right-left"></i> Movimientos</h3></div>
      <form onSubmit={registrar} className="form-horizontal request-form">
        <div className="input-group"><label>Material</label><select value={materialId} onChange={(e) => setMaterialId(e.target.value)} required><option value="">Selecciona un material</option>{materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre_material}</option>)}</select></div>
        <div className="input-group"><label>Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value as 'Entrada' | 'Salida')}><option value="Entrada">Entrada</option><option value="Salida">Salida</option></select></div>
        <div className="input-group"><label>Cantidad</label><input type="number" min="0.01" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required /></div>
        <button className="btn-save" type="submit" disabled={guardando}>{guardando ? 'Registrando...' : `Registrar ${tipo.toLowerCase()}`}</button>
      </form>
    </div>}

    <div className="card" style={{ marginTop: 30 }}>
      <div className="card-header"><h3><i className="fas fa-clock-rotate-left"></i> Kardex</h3></div>
      <div className="table-card" style={{ marginTop: 0 }}><table><thead><tr><th>Fecha</th><th>Material</th><th>Proyecto</th><th>Usuario</th><th>Tipo</th><th>Cantidad</th></tr></thead><tbody>
        {movimientos.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>No hay movimientos registrados.</td></tr> : movimientos.map((m) => <tr key={m.id}><td>{new Date(m.fecha_movimiento).toLocaleString()}</td><td>{m.material_nombre || nombreMaterial(m.material_id)}</td><td>{proyectoNombre || `#${m.proyecto_id}`}</td><td>{m.usuario_nombre || `#${m.usuario_id}`}</td><td><span className={`estado estado-${m.tipo_movimiento.toLowerCase()}`}>{m.tipo_movimiento}</span></td><td>{m.cantidad} {m.unidad_medida || unidadMaterial(m.material_id)}</td></tr>)}
      </tbody></table></div>
    </div>
  </div>;
};
