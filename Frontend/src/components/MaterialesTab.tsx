import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Material {
  id: number;
  nombre_material: string;
  unidad_medida: string;
}

interface Proyecto {
  id: number;
  nombre_proyecto: string;
}

interface InventarioItem {
  proyecto_id: number;
  material_id: number;
  cantidad_disponible: number;
}

interface MovimientoItem {
  id: number;
  proyecto_id: number;
  material_id: number;
  usuario_id: number;
  tipo_movimiento: string;
  cantidad: number;
  fecha_movimiento: string;
}

export const MaterialesTab = () => {
  const [subTab, setSubTab] = useState<'asignar' | 'historial' | 'catalogo'>('asignar');

  // Estados generales
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para nuevo material en catálogo
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('');
  const [guardandoCatalogo, setGuardandoCatalogo] = useState(false);

  // Estados para asignar / registrar movimiento a obra
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<number | ''>('');
  const [materialSeleccionado, setMaterialSeleccionado] = useState<number | ''>('');
  const [tipoMovimiento, setTipoMovimiento] = useState<'Entrada' | 'Salida'>('Entrada');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);
  const [stockObra, setStockObra] = useState<InventarioItem[]>([]);

  // Estados para historial
  const [historial, setHistorial] = useState<MovimientoItem[]>([]);
  const [filtroObraHistorial, setFiltroObraHistorial] = useState<number | ''>('');
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Cargar catálogo y proyectos iniciales
  const cargarDatosIniciales = async () => {
    setCargando(true);
    try {
      const [resMat, resProy] = await Promise.all([
        fetchConToken('/materiales/'),
        fetchConToken('/proyectos/'),
      ]);

      if (resMat.ok) setMateriales(await resMat.json());
      if (resProy.ok) {
        const proys = await resProy.json();
        setProyectos(proys);
        if (proys.length > 0 && !proyectoSeleccionado) {
          setProyectoSeleccionado(proys[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar datos de materiales:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar inventario del proyecto seleccionado
  const cargarStockObra = async (proyId: number) => {
    try {
      const res = await fetchConToken(`/movimientos/inventario/${proyId}`);
      if (res.ok) {
        setStockObra(await res.json());
      } else {
        setStockObra([]);
      }
    } catch {
      setStockObra([]);
    }
  };

  useEffect(() => {
    if (proyectoSeleccionado) {
      cargarStockObra(Number(proyectoSeleccionado));
    }
  }, [proyectoSeleccionado]);

  // Cargar historial de movimientos
  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const url = filtroObraHistorial
        ? `/movimientos/?proyecto_id=${filtroObraHistorial}`
        : '/movimientos/';
      const res = await fetchConToken(url);
      if (res.ok) {
        setHistorial(await res.json());
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    if (subTab === 'historial') {
      cargarHistorial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, filtroObraHistorial]);

  // Manejar creación de material en catálogo
  const handleCrearCatalogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !unidad) return;

    setGuardandoCatalogo(true);
    try {
      const res = await fetchConToken('/materiales/', {
        method: 'POST',
        body: JSON.stringify({ nombre_material: nombre, unidad_medida: unidad }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo crear el material.');
      }
      setNombre('');
      setUnidad('');
      await cargarDatosIniciales();
      alert('✅ Material agregado al catálogo correctamente.');
    } catch (err: any) {
      alert(`⚠️ ${err.message || 'Error al guardar material.'}`);
    } finally {
      setGuardandoCatalogo(false);
    }
  };

  // Manejar asignación / entrada / salida de material en la obra
  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado || !materialSeleccionado || !cantidad || Number(cantidad) <= 0) {
      alert('Por favor completa todos los campos requeridos con una cantidad válida.');
      return;
    }

    setGuardandoMovimiento(true);
    try {
      const res = await fetchConToken('/movimientos/', {
        method: 'POST',
        body: JSON.stringify({
          proyecto_id: Number(proyectoSeleccionado),
          material_id: Number(materialSeleccionado),
          tipo_movimiento: tipoMovimiento,
          cantidad: Number(cantidad),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || 'Error al registrar movimiento.');
      }

      alert(
        tipoMovimiento === 'Entrada'
          ? `✅ Se agregaron ${cantidad} unidades de material a la obra correctamente.`
          : `✅ Se registraron ${cantidad} unidades de material como utilizadas en la obra.`
      );

      setCantidad('');
      await cargarStockObra(Number(proyectoSeleccionado));
      if (subTab === 'historial') await cargarHistorial();
    } catch (err: any) {
      alert(`⚠️ ${err.message || 'No se pudo registrar el movimiento.'}`);
    } finally {
      setGuardandoMovimiento(false);
    }
  };

  const getNombreMaterial = (matId: number) => {
    const mat = materiales.find((m) => m.id === matId);
    return mat ? mat.nombre_material : `Material #${matId}`;
  };

  const getUnidadMaterial = (matId: number) => {
    const mat = materiales.find((m) => m.id === matId);
    return mat ? mat.unidad_medida : '';
  };

  const getNombreProyecto = (proyId: number) => {
    const proy = proyectos.find((p) => p.id === proyId);
    return proy ? proy.nombre_proyecto : `Obra #${proyId}`;
  };

  return (
    <div className="tab-content active animated-fadeIn">
      <div className="section-header">
        <h2>
          <i className="fas fa-boxes-stacked"></i> Gestión de Materiales e Inventario de Obras
        </h2>
        <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>
          Asigna los materiales que necesita cada obra, agrega insumos adicionales en cualquier momento y consulta el historial de uso.
        </p>
      </div>

      {/* PESTAÑAS INTERNAS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSubTab('asignar')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: subTab === 'asignar' ? '#ffd60a' : '#e2e8f0',
            color: subTab === 'asignar' ? '#000' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
        >
          <i className="fas fa-dolly"></i> Asignar Insumos a la Obra
        </button>

        <button
          type="button"
          onClick={() => setSubTab('historial')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: subTab === 'historial' ? '#ffd60a' : '#e2e8f0',
            color: subTab === 'historial' ? '#000' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
        >
          <i className="fas fa-history"></i> Historial de Materiales Utilizados
        </button>

        <button
          type="button"
          onClick={() => setSubTab('catalogo')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: subTab === 'catalogo' ? '#ffd60a' : '#e2e8f0',
            color: subTab === 'catalogo' ? '#000' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
        >
          <i className="fas fa-list"></i> Catálogo General de Materiales
        </button>
      </div>

      {/* SUB-PESTAÑA 1: ASIGNAR MATERIALES / AGREGAR MÁS INSUMOS A LA OBRA */}
      {subTab === 'asignar' && (
        <div className="grid">
          {/* FORMULARIO DE ASIGNACIÓN */}
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-plus-circle"></i> Asignar / Agregar Material a la Obra
              </h3>
            </div>
            <form onSubmit={handleRegistrarMovimiento}>
              <div className="input-group">
                <label>Obra de Destino</label>
                <select
                  value={proyectoSeleccionado}
                  onChange={(e) => setProyectoSeleccionado(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">-- Seleccionar Obra --</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_proyecto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Material requerido</label>
                <select
                  value={materialSeleccionado}
                  onChange={(e) => setMaterialSeleccionado(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">-- Seleccionar Material del Catálogo --</option>
                  {materiales.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre_material} ({m.unidad_medida})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Acción</label>
                <select
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value as 'Entrada' | 'Salida')}
                >
                  <option value="Entrada">📥 Entrada / Agregar más insumos a la obra</option>
                  <option value="Salida">📤 Salida / Registrar material utilizado en obra</option>
                </select>
              </div>

              <div className="input-group">
                <label>Cantidad requerida</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 50"
                  required
                />
              </div>

              <button type="submit" className="btn-save" disabled={guardandoMovimiento || cargando}>
                {guardandoMovimiento
                  ? 'Guardando...'
                  : tipoMovimiento === 'Entrada'
                  ? '➕ Asignar / Sumar Material a la Obra'
                  : '➖ Registrar Material Utilizado'}
              </button>
            </form>
          </div>

          {/* STOCK DISPONIBLE EN LA OBRA SELECCIONADA */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>
                <i className="fas fa-warehouse"></i> Stock Actual de la Obra
              </h3>
              {proyectoSeleccionado && (
                <button
                  type="button"
                  onClick={() => cargarStockObra(Number(proyectoSeleccionado))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '12px' }}
                >
                  🔄 Actualizar
                </button>
              )}
            </div>

            <div className="project-container">
              {!proyectoSeleccionado ? (
                <div className="empty-msg">Selecciona una obra para consultar sus materiales en stock.</div>
              ) : stockObra.length === 0 ? (
                <div className="empty-msg">
                  Esta obra aún no tiene materiales asignados. Usa el formulario de la izquierda para agregar los insumos necesarios.
                </div>
              ) : (
                stockObra.map((item) => (
                  <div key={item.material_id} className="project-item">
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>{getNombreMaterial(item.material_id)}</h4>
                      <span style={{ fontSize: '13px', color: '#666' }}>
                        Unidad: {getUnidadMaterial(item.material_id)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          backgroundColor: item.cantidad_disponible > 0 ? '#dcfce7' : '#fee2e2',
                          color: item.cantidad_disponible > 0 ? '#15803d' : '#b91c1c',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontWeight: 800,
                          fontSize: '14px',
                          display: 'inline-block',
                        }}
                      >
                        {item.cantidad_disponible} {getUnidadMaterial(item.material_id)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 2: HISTORIAL DE MATERIALES UTILIZADOS (KARDEX COMPLETO) */}
      {subTab === 'historial' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>
                <i className="fas fa-clipboard-list"></i> Historial de Movimientos de Insumos
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                Auditoría detallada de entradas y materiales utilizados en las diferentes obras de construcción.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Filtrar por obra:</label>
              <select
                value={filtroObraHistorial}
                onChange={(e) => setFiltroObraHistorial(e.target.value ? Number(e.target.value) : '')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Todas las Obras --</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_proyecto}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={cargarHistorial}
                style={{
                  backgroundColor: '#000',
                  color: '#ffd60a',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                🔄 Refrescar
              </button>
            </div>
          </div>

          {cargandoHistorial ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              Cargando historial de materiales...
            </div>
          ) : historial.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              No hay registros de movimientos en el historial aún.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Fecha y Hora</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Obra / Proyecto</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Material</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Tipo de Movimiento</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>Cantidad</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>ID Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => {
                    const esEntrada = h.tipo_movimiento === 'Entrada';
                    return (
                      <tr key={h.id}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>
                          {new Date(h.fecha_movimiento).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0f172a' }}>
                          {getNombreProyecto(h.proyecto_id)}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          {getNombreMaterial(h.material_id)}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <span
                            style={{
                              backgroundColor: esEntrada ? '#dcfce7' : '#fee2e2',
                              color: esEntrada ? '#15803d' : '#b91c1c',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {esEntrada ? '📥 Entrada / Suministro' : '📤 Salida / Utilizado en Obra'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
                          {h.cantidad} {getUnidadMaterial(h.material_id)}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '12px' }}>
                          #{h.id}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-PESTAÑA 3: CATÁLOGO DE MATERIALES */}
      {subTab === 'catalogo' && (
        <div className="grid">
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-plus-circle"></i> Nuevo Material al Catálogo
              </h3>
            </div>
            <form onSubmit={handleCrearCatalogo}>
              <div className="input-group">
                <label>Nombre del material</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Cemento Gris ARGOS, Varilla 1/2, Arena..."
                  required
                />
              </div>
              <div className="input-group">
                <label>Unidad de medida</label>
                <input
                  type="text"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  placeholder="Ej: Bultos, Metros, Toneladas, Galones..."
                  required
                />
              </div>
              <button type="submit" className="btn-save" disabled={guardandoCatalogo}>
                {guardandoCatalogo ? 'Guardando...' : 'Agregar al Catálogo'}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-list"></i> Materiales Registrados en el Sistema
              </h3>
            </div>
            <div className="project-container">
              {cargando && <div className="empty-msg">Cargando materiales...</div>}
              {!cargando && materiales.length === 0 && (
                <div className="empty-msg">Todavía no hay materiales en el catálogo.</div>
              )}
              {!cargando &&
                materiales.map((m) => (
                  <div key={m.id} className="project-item">
                    <div>
                      <h4>{m.nombre_material}</h4>
                      <span style={{ fontSize: '12px', color: '#666' }}>Unidad: {m.unidad_medida}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID: #{m.id}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

