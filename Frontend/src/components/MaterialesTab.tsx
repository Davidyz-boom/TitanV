import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface ProyectoDetalle {
  proyecto_id: number;
  proyecto_nombre: string;
  cantidad: number;
}

interface MaterialResumen {
  id: number;
  nombre_material: string;
  unidad_medida: string;
  stock_total: number;
  cantidad_asignada_proyectos: number;
  stock_disponible_bodega: number;
  proyectos_detalle: ProyectoDetalle[];
}

interface MaterialesTabProps {
  rol?: number;
}

export const MaterialesTab = ({ rol = 1 }: MaterialesTabProps) => {
  const [materiales, setMateriales] = useState<MaterialResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Formulario nuevo material
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('');
  const [stockInicial, setStockInicial] = useState<number | ''>('');
  const [guardando, setGuardando] = useState(false);

  // Modal para agregar cantidad / reabastecer
  const [materialReabastecer, setMaterialReabastecer] = useState<MaterialResumen | null>(null);
  const [cantidadAgregar, setCantidadAgregar] = useState<number | ''>('');
  const [reabasteciendo, setReabasteciendo] = useState(false);

  // Filtro de búsqueda
  const [busqueda, setBusqueda] = useState('');

  const esAdmin = rol === 1;

  const cargarInventario = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await fetchConToken('/materiales/inventario-resumen');
      if (!respuesta.ok) throw new Error('No se pudo cargar el inventario de materiales.');
      const data: MaterialResumen[] = await respuesta.json();
      setMateriales(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la base de datos de inventario.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const handleCrearMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !unidad) return;

    setGuardando(true);
    try {
      const respuesta = await fetchConToken('/materiales/', {
        method: 'POST',
        body: JSON.stringify({
          nombre_material: nombre.trim(),
          unidad_medida: unidad.trim(),
          stock_total: Number(stockInicial) || 0.0,
        }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo registrar el material.');
      }

      setNombre('');
      setUnidad('');
      setStockInicial('');
      await cargarInventario();
      alert('✅ Material registrado exitosamente en el inventario general.');
    } catch (err: any) {
      alert(`⚠️ ${err.message || 'Error al crear el material.'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleReabastecer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialReabastecer || !cantidadAgregar || Number(cantidadAgregar) <= 0) {
      alert('Ingresa una cantidad válida mayor a 0.');
      return;
    }

    setReabasteciendo(true);
    try {
      const respuesta = await fetchConToken(`/materiales/${materialReabastecer.id}/reabastecer`, {
        method: 'POST',
        body: JSON.stringify({ cantidad: Number(cantidadAgregar) }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo reabastecer el material.');
      }

      alert(`✅ Se agregaron ${cantidadAgregar} ${materialReabastecer.unidad_medida} a "${materialReabastecer.nombre_material}".`);
      setMaterialReabastecer(null);
      setCantidadAgregar('');
      await cargarInventario();
    } catch (err: any) {
      alert(`⚠️ ${err.message || 'Error al reabastecer el material.'}`);
    } finally {
      setReabasteciendo(false);
    }
  };

  const eliminarMaterial = async (id: number, nombreMaterial: string) => {
    if (!window.confirm(`¿Eliminar "${nombreMaterial}" del catálogo e inventario?`)) return;
    try {
      const respuesta = await fetchConToken(`/materiales/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo eliminar el material.');
      }
      await cargarInventario();
    } catch (err: any) {
      alert(`⚠️ ${err.message || 'No se pudo eliminar el material.'}`);
    }
  };

  // Cálculos para tarjetas de métricas
  const totalStockRegistrado = materiales.reduce((sum, m) => sum + (m.stock_total || 0), 0);
  const totalColocadoEnObras = materiales.reduce((sum, m) => sum + (m.cantidad_asignada_proyectos || 0), 0);
  const totalDisponibleBodega = materiales.reduce((sum, m) => sum + (m.stock_disponible_bodega || 0), 0);

  const materialesFiltrados = materiales.filter((m) =>
    m.nombre_material.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.unidad_medida.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="tab-content active" style={{ display: 'block' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
          <i className="fas fa-boxes-stacked" style={{ color: '#eab308' }}></i>
          Control de Inventario y Materiales
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
          Visualiza los materiales registrados en almacén, las cantidades colocadas en las obras y agrega más stock.
        </p>
      </div>

      {/* TARJETAS DE RESUMEN METRICO */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tipos de Insumo</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{materiales.length}</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Stock Total Registrado</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
            {totalStockRegistrado.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>uds/bultos</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Colocado en Obras</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
            {totalColocadoEnObras.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>asignadas</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Disponible en Bodega</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
            {totalDisponibleBodega.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>libres</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: esAdmin ? '340px 1fr' : '1fr', gap: '20px' }}>
        {/* FORMULARIO PARA REGISTRAR NUEVO MATERIAL (SOLO ADMIN) */}
        {esAdmin && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-plus-circle" style={{ color: '#eab308' }}></i> Nuevo Material
            </h3>
            <form onSubmit={handleCrearMaterial}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Nombre del Material
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Cemento Gris ARGOS"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Unidad de Medida
                </label>
                <input
                  type="text"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  placeholder="Ej: Bultos, Metros Cúbicos, Varillas"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Stock Inicial en Bodega
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={stockInicial}
                  onChange={(e) => setStockInicial(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 100"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#ffd60a',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(255, 214, 10, 0.3)',
                }}
              >
                {guardando ? 'Registrando...' : 'Agregar al Inventario'}
              </button>
            </form>
          </div>
        )}

        {/* TABLA DE INVENTARIO CON ACCIÓN DE REABASTECER Y DETALLE DE OBRAS */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Inventario Consolidado (Registrado vs. Colocado)
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Control en tiempo real de insumos en bodega y asignados en proyectos
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar material..."
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '180px' }}
              />
              <button
                onClick={cargarInventario}
                style={{ backgroundColor: '#0f172a', color: '#ffd60a', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
              >
                🔄 Refrescar
              </button>
            </div>
          </div>

          {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '14px' }}>{error}</div>}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Cargando inventario desde PostgreSQL...</div>
          ) : materialesFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              No se encontraron materiales registrados.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                    <th style={{ padding: '12px 14px' }}>Material</th>
                    <th style={{ padding: '12px 14px' }}>Unidad</th>
                    <th style={{ padding: '12px 14px' }}>Stock Total</th>
                    <th style={{ padding: '12px 14px' }}>En Obras</th>
                    <th style={{ padding: '12px 14px' }}>Disponible</th>
                    <th style={{ padding: '12px 14px' }}>Obras con Insumo</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materialesFiltrados.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {m.nombre_material}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>
                        {m.unidad_medida}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563eb' }}>
                        {m.stock_total.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#d97706' }}>
                        {m.cantidad_asignada_proyectos.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: m.stock_disponible_bodega > 0 ? '#16a34a' : '#dc2626' }}>
                        {m.stock_disponible_bodega.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {m.proyectos_detalle.length === 0 ? (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Sin obras asignadas</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {m.proyectos_detalle.map((p) => (
                              <span key={p.proyecto_id} style={{ fontSize: '11px', color: '#334155', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                🏗️ <strong>{p.proyecto_nombre}</strong>: {p.cantidad} {m.unidad_medida}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setMaterialReabastecer(m);
                              setCantidadAgregar('');
                            }}
                            title="Agregar más cantidad a este material"
                            style={{
                              backgroundColor: '#ffd60a',
                              color: '#000',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <i className="fas fa-plus"></i> Reabastecer
                          </button>

                          {esAdmin && (
                            <button
                              type="button"
                              onClick={() => eliminarMaterial(m.id, m.nombre_material)}
                              title="Eliminar material"
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA AGREGAR MÁS CANTIDAD / REABASTECER MATERIAL (REQUERIMIENTO 1) */}
      {materialReabastecer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '26px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                ➕ Agregar Más Cantidad
              </h3>
              <button
                type="button"
                onClick={() => setMaterialReabastecer(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{materialReabastecer.nombre_material}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Stock actual: <strong>{materialReabastecer.stock_total} {materialReabastecer.unidad_medida}</strong>
              </div>
            </div>

            <form onSubmit={handleReabastecer}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Cantidad adicional a ingresar ({materialReabastecer.unidad_medida}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  autoFocus
                  required
                  value={cantidadAgregar}
                  onChange={(e) => setCantidadAgregar(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 50"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMaterialReabastecer(null)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reabasteciendo}
                  style={{
                    flex: 1,
                    padding: '11px',
                    backgroundColor: '#ffd60a',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: reabasteciendo ? 'not-allowed' : 'pointer',
                  }}
                >
                  {reabasteciendo ? 'Guardando...' : 'Confirmar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
