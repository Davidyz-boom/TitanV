import { useEffect, useState } from 'react';
import { fetchConToken } from '../api';

interface Proyecto {
  id: number;
  nombre_proyecto: string;
  ubicacion_direccion: string;
}

interface Colaborador {
  id: number;
  proyecto_id: number;
  usuario_id: number;
  rol: 'Arquitecto' | 'Trabajador' | 'Visualizador';
  fecha_vinculacion: string;
  usuario_nombre: string;
  usuario_correo: string;
}

const ROLES: Colaborador['rol'][] = ['Arquitecto', 'Trabajador', 'Visualizador'];

const nombreProyectoFijo = (proyectos: Proyecto[], id: number) =>
  proyectos.find((p) => p.id === id)?.nombre_proyecto || `Proyecto #${id}`;

const RESTRICCIONES: Record<Colaborador['rol'], string[]> = {
  Arquitecto: [
    'Control total del proyecto: crear/editar/eliminar proyectos y colaboradores.',
    'Invitar colaboradores por correo o enlace.',
    'Cambiar roles y eliminar colaboradores del proyecto.',
  ],
  Trabajador: [
    'Crear y actualizar tareas y turnos del proyecto.',
    'Subir evidencias de avance (fotos, PDF, video).',
    'Registrar entradas y salidas de material en el kardex.',
    'No puede invitar ni administrar colaboradores.',
  ],
  Visualizador: [
    'Solo lectura: ver tareas, turnos, evidencias e inventario.',
    'No puede crear, editar ni eliminar registros.',
    'No puede subir evidencias ni registrar movimientos.',
  ],
};

const COLOR_ROL: Record<Colaborador['rol'], { bg: string; color: string }> = {
  Arquitecto: { bg: '#fef3c7', color: '#b45309' },
  Trabajador: { bg: '#e0f2fe', color: '#0369a1' },
  Visualizador: { bg: '#f1f5f9', color: '#475569' },
};

interface ColaboradoresTabProps {
  proyectoId?: number;
}

export const ColaboradoresTab = ({ proyectoId: proyectoFijo }: ColaboradoresTabProps) => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoId, setProyectoId] = useState<number | ''>('');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [cargandoColaboradores, setCargandoColaboradores] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [correo, setCorreo] = useState('');
  const [rolInvitacion, setRolInvitacion] = useState<Exclude<Colaborador['rol'], 'Arquitecto'>>('Trabajador');
  const [invitando, setInvitando] = useState(false);
  const [enlaceInvitacion, setEnlaceInvitacion] = useState('');
  const [cambiandoRol, setCambiandoRol] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const usuarioId = Number(localStorage.getItem('usuario_id') || 0);

  const cargarProyectos = async () => {
    setError('');
    try {
      const respuesta = await fetchConToken('/proyectos/');
      if (!respuesta.ok) throw new Error('No se pudieron cargar los proyectos.');
      const datos = await respuesta.json();
      setProyectos(datos);
      if (datos.length === 1) {
        setProyectoId(datos[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los proyectos.');
    } finally {
      setCargandoProyectos(false);
    }
  };

  const cargarColaboradores = async (id: number) => {
    setCargandoColaboradores(true);
    setError('');
    setMensaje('');
    try {
      const respuesta = await fetchConToken(`/proyectos/${id}/colaboradores/`);
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudieron cargar los colaboradores.');
      }
      setColaboradores(await respuesta.json());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los colaboradores.');
      setColaboradores([]);
    } finally {
      setCargandoColaboradores(false);
    }
  };

  useEffect(() => {
    cargarProyectos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (proyectoFijo) {
      setProyectoId(proyectoFijo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoFijo]);

  useEffect(() => {
    if (proyectoId !== '') {
      cargarColaboradores(proyectoId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const proyectosVisibles = proyectoFijo ? proyectos.filter((p) => p.id === proyectoFijo) : proyectos;

  const proyectoSeleccionado =
    proyectos.find((p) => p.id === proyectoId) || null;

  const colaboradorActual = colaboradores.find((c) => c.usuario_id === usuarioId);
  const esArquitecto = colaboradorActual?.rol === 'Arquitecto';

  const invitarPorCorreo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (proyectoId === '' || !correo.trim()) return;

    setInvitando(true);
    setError('');
    setMensaje('');
    setEnlaceInvitacion('');
    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoId}/colaboradores/`, {
        method: 'POST',
        body: JSON.stringify({ correo_electronico: correo.trim(), rol: rolInvitacion }),
      });
      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(data?.detail || 'No se pudo invitar al colaborador.');

      setCorreo('');
      setMensaje(data.mensaje || 'Invitación procesada.');
      if (!data.correo_enviado && data.enlace_url) {
        setEnlaceInvitacion(data.enlace_url);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo invitar al colaborador.');
    } finally {
      setInvitando(false);
    }
  };

  const copiarEnlaceInvitacion = () => {
    navigator.clipboard.writeText(enlaceInvitacion);
    alert('Enlace copiado. Compártelo con la persona invitada.');
  };

  const cambiarRol = async (colaborador: Colaborador, rol: Colaborador['rol']) => {
    if (proyectoId === '' || rol === colaborador.rol) return;
    if (rol !== 'Arquitecto' && colaborador.rol === 'Arquitecto') {
      if (!window.confirm(`¿Degradar a "${colaborador.usuario_nombre}" (${colaborador.rol}) a ${rol}?`)) return;
    }

    setCambiandoRol(colaborador.id);
    setError('');
    setMensaje('');
    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoId}/colaboradores/${colaborador.id}`, {
        method: 'PUT',
        body: JSON.stringify({ rol }),
      });
      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(data?.detail || 'No se pudo cambiar el rol.');

      setMensaje(`Rol de ${data.usuario_nombre} actualizado a ${data.rol}.`);
      await cargarColaboradores(proyectoId as number);
    } catch (err: any) {
      setError(err.message || 'No se pudo cambiar el rol.');
    } finally {
      setCambiandoRol(null);
    }
  };

  const eliminarColaborador = async (colaborador: Colaborador) => {
    if (proyectoId === '') return;
    if (!window.confirm(`¿Quitar a "${colaborador.usuario_nombre}" de este proyecto?`)) return;

    setEliminando(colaborador.id);
    setError('');
    setMensaje('');
    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoId}/colaboradores/${colaborador.id}`, {
        method: 'DELETE',
      });
      if (!respuesta.ok && respuesta.status !== 204) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo quitar al colaborador.');
      }

      setMensaje(`${colaborador.usuario_nombre} fue quitado del proyecto.`);
      await cargarColaboradores(proyectoId as number);
    } catch (err: any) {
      setError(err.message || 'No se pudo quitar al colaborador.');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-user-group"></i> Colaboradores del Proyecto</h2>
      </div>

      {error && <div className="empty-msg" style={{ color: '#dc2626', padding: '15px' }}>{error}</div>}
      {mensaje && <div className="empty-msg" style={{ color: '#16a34a', padding: '15px' }}>{mensaje}</div>}

      <div className="grid">
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-envelope"></i> Invitar por correo electrónico</h3>
          </div>
          {proyectos.length === 0 ? (
            <p className="empty-msg">
              {cargandoProyectos
                ? 'Cargando proyectos...'
                : 'Aún no tienes proyectos. Crea uno en la sección de Proyectos de Obra.'}
            </p>
          ) : (
            <>
              <form onSubmit={invitarPorCorreo}>
                <div className="input-group">
                  <label>Proyecto</label>
                  {proyectoFijo ? (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: '#fef9c3', color: '#854d0e',
                        padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                      }}
                    >
                      <i className="fas fa-diagram-project"></i>
                      {proyectoFijo && nombreProyectoFijo(proyectosVisibles, proyectoFijo)}
                    </div>
                  ) : (
                    <select
                      value={proyectoId}
                      onChange={(e) => setProyectoId(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}
                    >
                      <option value="" disabled>Selecciona un proyecto</option>
                      {proyectosVisibles.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre_proyecto}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="input-group">
                  <label>Correo electrónico de la persona</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="ej: colaborador@correo.com"
                    required
                    disabled={!esArquitecto}
                  />
                </div>
                <div className="input-group">
                  <label>Rol al unirse</label>
                  <select
                    value={rolInvitacion}
                    onChange={(e) => setRolInvitacion(e.target.value as Exclude<Colaborador['rol'], 'Arquitecto'>)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}
                    disabled={!esArquitecto}
                  >
                    <option value="Trabajador">Trabajador — participa y sube avances</option>
                    <option value="Visualizador">Visualizador — solo lectura</option>
                  </select>
                </div>
                <button type="submit" className="btn-save" disabled={invitando || !esArquitecto}>
                  {invitando ? 'Invitando...' : 'Invitar por correo'}
                </button>
                {!esArquitecto && proyectoSeleccionado && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '10px', textAlign: 'center' }}>
                    Solo el Arquitecto del proyecto puede invitar colaboradores.
                  </p>
                )}
              </form>
              {enlaceInvitacion && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                  <input readOnly value={enlaceInvitacion} style={{ flex: 1, padding: '8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                  <button onClick={copiarEnlaceInvitacion} style={{ background: '#ffd60a', border: 'none', borderRadius: '6px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>
                    Copiar enlace
                  </button>
                </div>
              )}
              <p style={{ padding: '0 25px 20px', fontSize: '12px', color: '#888' }}>
                Se enviará un correo con un enlace de invitación. La persona no necesita tener cuenta:
                al abrirlo puede registrarse y queda vinculada al proyecto con el rol elegido. El enlace expira en 7 días.
              </p>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-list"></i> Colaboradores del proyecto</h3>
          </div>
          {proyectos.length === 0 ? (
            <p className="empty-msg">Sin proyectos disponibles.</p>
          ) : (
            <>
              <div style={{ padding: '15px 25px' }}>
                {proyectoFijo ? (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      backgroundColor: '#fef9c3', color: '#854d0e',
                      padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                    }}
                  >
                    <i className="fas fa-diagram-project"></i>
                    {nombreProyectoFijo(proyectosVisibles, proyectoFijo)}
                  </div>
                ) : (
                  <select
                    value={proyectoId}
                    onChange={(e) => setProyectoId(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}
                  >
                    <option value="" disabled>Selecciona un proyecto</option>
                    {proyectosVisibles.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre_proyecto}</option>
                    ))}
                  </select>
                )}
              </div>

              {cargandoColaboradores ? (
                <p className="empty-msg">Cargando colaboradores...</p>
              ) : proyectoId === '' ? (
                <p className="empty-msg">Selecciona un proyecto para ver su equipo.</p>
              ) : colaboradores.length === 0 ? (
                <p className="empty-msg">Este proyecto todavía no tiene colaboradores.</p>
              ) : (
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        {esArquitecto && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {colaboradores.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>
                            {c.usuario_nombre}
                            {c.usuario_id === usuarioId && (
                              <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>(tú)</span>
                            )}
                          </td>
                          <td style={{ color: '#475569' }}>{c.usuario_correo}</td>
                          <td>
                            {esArquitecto ? (
                              <select
                                value={c.rol}
                                onChange={(e) => cambiarRol(c, e.target.value as Colaborador['rol'])}
                                disabled={cambiandoRol === c.id}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            ) : (
                              <span
                                style={{
                                  backgroundColor: COLOR_ROL[c.rol].bg,
                                  color: COLOR_ROL[c.rol].color,
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                }}
                              >
                                {c.rol}
                              </span>
                            )}
                          </td>
                          {esArquitecto && (
                            <td>
                              <button
                                onClick={() => eliminarColaborador(c)}
                                disabled={eliminando === c.id}
                                className="btn-delete"
                                style={{ fontSize: '12px' }}
                              >
                                <i className="fas fa-user-minus"></i> Quitar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h3><i className="fas fa-shield-halved"></i> Restricciones por rol en el proyecto</h3>
        </div>
        <div style={{ padding: '20px 25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {(Object.keys(RESTRICCIONES) as Colaborador['rol'][]).map((rol) => (
            <div key={rol}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: COLOR_ROL[rol].bg,
                  color: COLOR_ROL[rol].color,
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                {rol}
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                {RESTRICCIONES[rol].map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};