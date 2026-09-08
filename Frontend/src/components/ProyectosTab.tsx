import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Proyecto {
  id: number;
  nombre_proyecto: string;
  ubicacion_direccion: string;
  estado: 'Planificación' | 'En Ejecución' | 'Finalizado';
  fecha_inicio: string;
  fecha_fin_estimada: string;
  usuario_creador_id?: number;
}

interface MaterialCatalogo {
  id: number;
  nombre_material: string;
  unidad_medida: string;
  stock_total: number;
}

interface MaterialProyecto {
  material_id: number;
  nombre_material: string;
  unidad_medida: string;
  cantidad: number;
}

interface ObreroProyecto {
  usuario_id: number;
  nombre_completo: string;
  correo: string;
  rol_en_obra: string;
}

interface ResumenObra {
  id: number;
  nombre_proyecto: string;
  ubicacion_direccion: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  materiales: MaterialProyecto[];
  cantidad_obreros: number;
  obreros: ObreroProyecto[];
  total_turnos: number;
  total_evidencias: number;
}

const ESTADOS: Proyecto['estado'][] = ['Planificación', 'En Ejecución', 'Finalizado'];

interface ProyectosTabProps {
  onProyectoCreado?: () => void;
  rol?: number;
}

export const ProyectosTab = ({ onProyectoCreado, rol = 1 }: ProyectosTabProps = {}) => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [catalogoMateriales, setCatalogoMateriales] = useState<MaterialCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Formulario nuevo proyecto
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [estado, setEstado] = useState<Proyecto['estado']>('Planificación');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [materialInicialId, setMaterialInicialId] = useState<number | ''>('');
  const [cantidadInicial, setCantidadInicial] = useState<number | ''>('');
  const [guardando, setGuardando] = useState(false);

  // Modal para Asignar Material a una Obra
  const [proyectoParaMaterial, setProyectoParaMaterial] = useState<Proyecto | null>(null);
  const [materialAsignarId, setMaterialAsignarId] = useState<number | ''>('');
  const [cantidadAsignar, setCantidadAsignar] = useState<number | ''>('');
  const [asignandoMaterial, setAsignandoMaterial] = useState(false);

  // Modal o vista de Resumen de Obra
  const [resumenObra, setResumenObra] = useState<ResumenObra | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  const usuarioId = localStorage.getItem('usuario_id') || '1';
  const esAdmin = rol === 1;

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      // Si no es admin, filtrar por usuarioId para ver ÚNICAMENTE las obras que él registró
      const url = esAdmin ? '/proyectos/' : `/proyectos/?usuario_id=${usuarioId}`;
      const [rProyectos, rMateriales] = await Promise.all([
        fetchConToken(url),
        fetchConToken('/materiales/'),
      ]);

      if (!rProyectos.ok) throw new Error('No se pudieron cargar los proyectos de obra.');
      const listProyectos: Proyecto[] = await rProyectos.json();
      setProyectos(listProyectos);

      if (rMateriales.ok) {
        setCatalogoMateriales(await rMateriales.json());
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const cargarResumenObra = async (id: number) => {
    setCargandoResumen(true);
    try {
      const res = await fetchConToken(`/proyectos/${id}/resumen`);
      if (res.ok) {
        const data: ResumenObra = await res.json();
        setResumenObra(data);
      }
    } catch (err) {
      console.error('Error al cargar resumen de obra:', err);
    } finally {
      setCargandoResumen(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  const handleSubmitCrear = async (e: React.FormEvent) => {
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

      const nuevoProyecto: Proyecto = await respuesta.json();

      // Si seleccionó un material inicial requerido para el proyecto, asignarlo inmediatamente
      if (materialInicialId && cantidadInicial && Number(cantidadInicial) > 0) {
        await fetchConToken(`/proyectos/${nuevoProyecto.id}/materiales`, {
          method: 'POST',
          body: JSON.stringify({
            material_id: Number(materialInicialId),
            cantidad: Number(cantidadInicial),
          }),
        });
      }

      setNombreProyecto('');
      setUbicacion('');
      setEstado('Planificación');
      setFechaInicio('');
      setFechaFin('');
      setMaterialInicialId('');
      setCantidadInicial('');
      await cargarDatos();
      onProyectoCreado?.();
      alert('✅ Obra registrada exitosamente. Ahora aparece en tu lista de obras.');
    } catch (err: any) {
      alert(`⚠️ ${err.message || 'Error al crear la obra.'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleAsignarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoParaMaterial || !materialAsignarId || !cantidadAsignar || Number(cantidadAsignar) <= 0) {
      alert('Por favor selecciona un material y especifica una cantidad válida.');
      return;
    }

    setAsignandoMaterial(true);
    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoParaMaterial.id}/materiales`, {
        method: 'POST',
        body: JSON.stringify({
          material_id: Number(materialAsignarId),
          cantidad: Number(cantidadAsignar),
        }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo asignar el material a la obra.');
      }

      alert('✅ Material asignado e ingresado a la obra exitosamente.');
      setProyectoParaMaterial(null);
      setMaterialAsignarId('');
      setCantidadAsignar('');
      if (resumenObra && resumenObra.id === proyectoParaMaterial.id) {
        await cargarResumenObra(proyectoParaMaterial.id);
      }
    } catch (err: any) {
      alert(`⚠️ ${err.message || 'Error al asignar el material.'}`);
    } finally {
      setAsignandoMaterial(false);
    }
  };

  const eliminarProyecto = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar la obra "${nombre}"?`)) return;
    try {
      const respuesta = await fetchConToken(`/proyectos/${id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo eliminar la obra.');
      }
      await cargarDatos();
      onProyectoCreado?.();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar la obra.');
    }
  };

  return (
    <div className="tab-content active" style={{ display: 'block' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
          <i className="fas fa-project-diagram" style={{ color: '#eab308' }}></i>
          {esAdmin ? 'Panel de Todas las Obras (Administrador)' : 'Mis Obras de Construcción'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
          {esAdmin
            ? 'Supervisa todas las obras del sistema, asigna insumos y audita el personal y avance.'
            : 'Registra tus obras y supervisa exclusivamente los proyectos que registraste, sus materiales y avances.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        {/* FORMULARIO PARA REGISTRAR OBRA (DISPONIBLE PARA ADMIN Y USUARIOS REGISTRADOS) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-plus-circle" style={{ color: '#eab308' }}></i>
            {esAdmin ? 'Crear Nuevo Proyecto' : 'Registrar mi Obra'}
          </h3>

          <form onSubmit={handleSubmitCrear}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Nombre de la Obra <span style={{ color: '#ffd60a' }}>* (Obligatorio)</span>
              </label>
              <input
                type="text"
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                placeholder="Ej: Conjunto Residencial Los Álamos"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Ubicación / Dirección <span style={{ color: '#ffd60a' }}>* (Obligatorio)</span>
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej: Cra 15 #85-20, Bogotá"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Estado <span style={{ color: '#ffd60a' }}>*</span>
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as Proyecto['estado'])}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Fecha Inicio <span style={{ color: '#ffd60a' }}>*</span>
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Fin Estimado <span style={{ color: '#ffd60a' }}>*</span>
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* SELECCIÓN DE MATERIAL INICIAL REQUERIDO */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                📦 Material inicial necesario (opcional)
              </label>
              <select
                value={materialInicialId}
                onChange={(e) => setMaterialInicialId(e.target.value ? Number(e.target.value) : '')}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '8px' }}
              >
                <option value="">-- Seleccionar material del catálogo --</option>
                {catalogoMateriales.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre_material} ({m.unidad_medida})
                  </option>
                ))}
              </select>

              {materialInicialId && (
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="Cantidad necesaria para la obra"
                  value={cantidadInicial}
                  onChange={(e) => setCantidadInicial(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={guardando}
              style={{
                width: '100%',
                padding: '12px',
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
              {guardando ? 'Guardando Obra...' : esAdmin ? 'Registrar e Iniciar Obra' : 'Registrar mi Obra'}
            </button>
          </form>
        </div>

        {/* LISTADO DE OBRAS (ADMIN VE TODAS / USUARIO VE SOLO LAS QUE ÉL REGISTRÓ) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {esAdmin ? `Todas las Obras Registradas (${proyectos.length})` : `Mis Obras Registradas (${proyectos.length})`}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {esAdmin
                  ? 'Listado general de todas las obras en el sistema'
                  : 'Solo puedes ver y supervisar las obras registradas por ti'}
              </span>
            </div>

            <button
              onClick={cargarDatos}
              style={{ backgroundColor: '#0f172a', color: '#ffd60a', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
            >
              🔄 Refrescar
            </button>
          </div>

          {error && <div style={{ color: '#dc2626', marginBottom: '14px' }}>{error}</div>}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Cargando obras...</div>
          ) : proyectos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              {esAdmin
                ? 'No hay proyectos de obra registrados aún.'
                : 'Todavía no has registrado ninguna obra. Usa el formulario de la izquierda para registrar tu primera obra.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {proyectos.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{p.nombre_proyecto}</h4>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: p.estado === 'En Ejecución' ? '#dcfce7' : '#fef3c7',
                          color: p.estado === 'En Ejecución' ? '#15803d' : '#b45309',
                        }}
                      >
                        {p.estado}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      📍 {p.ubicacion_direccion} &bull; 🗓️ {p.fecha_inicio} al {p.fecha_fin_estimada}
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN: ASIGNAR MATERIAL, VER RESUMEN, ELIMINAR */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setProyectoParaMaterial(p);
                        setMaterialAsignarId('');
                        setCantidadAsignar('');
                      }}
                      style={{
                        backgroundColor: '#ffd60a',
                        color: '#000',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="fas fa-boxes-stacked"></i> Asignar Insumo
                    </button>

                    <button
                      type="button"
                      disabled={cargandoResumen}
                      onClick={() => cargarResumenObra(p.id)}
                      style={{
                        backgroundColor: '#e2e8f0',
                        color: '#1e293b',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: cargandoResumen ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className={cargandoResumen ? 'fas fa-spinner fa-spin' : 'fas fa-eye'}></i> Resumen
                    </button>

                    {esAdmin && (
                      <button
                        type="button"
                        onClick={() => eliminarProyecto(p.id, p.nombre_proyecto)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        title="Eliminar obra"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE ASIGNAR MATERIALES A LA OBRA */}
      {proyectoParaMaterial && (
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
              maxWidth: '440px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                ➕ Asignar Material a la Obra
              </h3>
              <button
                type="button"
                onClick={() => setProyectoParaMaterial(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{proyectoParaMaterial.nombre_proyecto}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>📍 {proyectoParaMaterial.ubicacion_direccion}</div>
            </div>

            <form onSubmit={handleAsignarMaterial}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Seleccionar Material del Catálogo
                </label>
                <select
                  value={materialAsignarId}
                  onChange={(e) => setMaterialAsignarId(e.target.value ? Number(e.target.value) : '')}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">-- Elige el material a entregar --</option>
                  {catalogoMateriales.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre_material} ({m.unidad_medida}) - En catálogo: {m.stock_total}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Cantidad a Ingresar en la Obra
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  placeholder="Ej: 30"
                  value={cantidadAsignar}
                  onChange={(e) => setCantidadAsignar(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setProyectoParaMaterial(null)}
                  style={{ flex: 1, padding: '11px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={asignandoMaterial}
                  style={{ flex: 1, padding: '11px', backgroundColor: '#ffd60a', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: asignandoMaterial ? 'not-allowed' : 'pointer' }}
                >
                  {asignandoMaterial ? 'Asignando...' : 'Asignar a la Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE / RESUMEN DE LA OBRA */}
      {resumenObra && (
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
              padding: '28px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Resumen Integral de Obra</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{resumenObra.nombre_proyecto}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>📍 {resumenObra.ubicacion_direccion}</span>
              </div>
              <button
                type="button"
                onClick={() => setResumenObra(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* METRICAS DE LA OBRA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Insumos</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{resumenObra.materiales.length}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Obreros</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>{resumenObra.cantidad_obreros}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Turnos</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706' }}>{resumenObra.total_turnos}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Evidencias</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{resumenObra.total_evidencias}</div>
              </div>
            </div>

            {/* TABLA DE MATERIALES EN LA OBRA */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              📦 Insumos Colocados en esta Obra
            </h4>
            {resumenObra.materiales.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                No hay materiales ingresados todavía en esta obra.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Material</th>
                    <th style={{ padding: '8px 10px' }}>Unidad</th>
                    <th style={{ padding: '8px 10px' }}>Cantidad Asignada</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenObra.materiales.map((m) => (
                    <tr key={m.material_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{m.nombre_material}</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{m.unidad_medida}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#16a34a' }}>{m.cantidad} {m.unidad_medida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              type="button"
              onClick={() => setResumenObra(null)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', color: '#ffd60a', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Cerrar Resumen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
