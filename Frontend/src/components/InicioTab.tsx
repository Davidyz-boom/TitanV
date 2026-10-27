import videoHero from '../assets/video_landing.mp4';
import logoImg from '../assets/logo.png';

interface ProyectoResumen {
  id: number;
  nombre_proyecto: string;
  ubicacion_direccion?: string;
  estado?: string;
}

interface InicioTabProps {
  proyectos: ProyectoResumen[];
  cargando: boolean;
  proyectoSeleccionado: ProyectoResumen | null;
  onEntrarProyecto: (proyecto: ProyectoResumen) => void;
  onSalirProyecto: () => void;
  onIrA: (tab: string) => void;
  onCrearProyecto: () => void;
  puedeCrearProyecto: boolean;
  puedeVerModulo: (tab: string) => boolean;
  onCambiarEstadoProyecto: (estado: string) => Promise<void>;
  onEliminarProyecto: () => Promise<void>;
}

const ESTADOS_PROYECTO = ['Planificación', 'En Ejecución', 'Finalizado'];

const MODULOS = [
  { tab: 'colaboradores', icono: 'fa-user-group', titulo: 'Colaboradores', texto: 'Invita por correo y gestiona los roles del equipo.' },
  { tab: 'materiales', icono: 'fa-boxes-stacked', titulo: 'Inventario Insumos', texto: 'Controla entradas y stock de material.' },
  { tab: 'inventario', icono: 'fa-warehouse', titulo: 'Inventario', texto: 'Consulta el stock y el historial de movimientos de materiales.' },
  { tab: 'tareas', icono: 'fa-tasks', titulo: 'Gestión de Tareas', texto: 'Crea tareas, supervisa su estado y gestiona comentarios técnicos.' },
  { tab: 'turnos', icono: 'fa-clock', titulo: 'Turnos y Asistencia', texto: 'Programa turnos y registra la asistencia del equipo.' },
  { tab: 'evidencias', icono: 'fa-camera', titulo: 'Evidencias de Obra', texto: 'Sube fotos y documentos del avance del proyecto.' },
];

export const InicioTab = ({
  proyectos,
  cargando,
  proyectoSeleccionado,
  onEntrarProyecto,
  onSalirProyecto,
  onIrA,
  onCrearProyecto,
  puedeCrearProyecto,
  puedeVerModulo,
  onCambiarEstadoProyecto,
  onEliminarProyecto,
}: InicioTabProps) => {
  if (cargando) {
    return (
      <div className="tab-content active">
        <div className="section-header">
          <h2><i className="fas fa-house"></i> Bienvenido a Titan V</h2>
        </div>
        <p className="muted-text">Cargando...</p>
      </div>
    );
  }

  // Dentro de un proyecto: atajos a los módulos del proyecto activo.
  if (proyectoSeleccionado) {
    return (
      <div className="tab-content active animated-fadeIn">
        <div className="panel-hero-banner panel-hero-project">
          <video autoPlay loop muted playsInline className="panel-hero-video">
            <source src={videoHero} type="video/mp4" />
          </video>
          <div className="panel-hero-overlay" />
          <div className="panel-hero-content">
            <div className="panel-hero-badge"><img src={logoImg} alt="" /> Proyecto activo</div>
            <h1 className="panel-hero-title">{proyectoSeleccionado.nombre_proyecto}</h1>
            <p className="panel-hero-subtitle">Gestiona el equipo, los insumos y el avance de esta obra desde un solo lugar.</p>
          </div>
        </div>
        <div className="section-header">
          <h2><i className="fas fa-grid-2"></i> Módulos de la obra</h2>
          <p className="muted-text">
            Estado actual: <strong>{proyectoSeleccionado.estado || 'Planificación'}</strong>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: '#666' }}>
                  Cambiar estado
                </label>
                <select
                  value={proyectoSeleccionado.estado || 'Planificación'}
                  onChange={(e) => void onCambiarEstadoProyecto(e.target.value)}
                  className="project-status-select"
                >
                  {ESTADOS_PROYECTO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={() => void onEliminarProyecto()}
                className="btn-delete"
                style={{ padding: '10px 14px' }}
              >
                <i className="fas fa-trash"></i> Eliminar proyecto
              </button>
          </div>
        </div>
        <div className="grid">
          {MODULOS.filter((m) => puedeVerModulo(m.tab)).map((m) => (
            <div key={m.tab} className="card card-interactive" onClick={() => onIrA(m.tab)}>
              <div className="card-header">
                <h3><span className="card-icon-bubble"><i className={`fas ${m.icono}`}></i></span> {m.titulo}</h3>
              </div>
              <p className="card-description">{m.texto}</p>
              <div className="card-footer-action">Abrir módulo <i className="fas fa-arrow-right"></i></div>
            </div>
          ))}
        </div>
        <button
          onClick={onSalirProyecto}
          style={{
            marginTop: '20px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px 16px',
            fontWeight: 700,
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <i className="fas fa-arrow-left"></i> Cambiar de proyecto
        </button>
      </div>
    );
  }

  // Sin proyecto activo: listar proyectos para entrar o crear uno.
  return (
    <div className="tab-content active animated-fadeIn">
      <div className="panel-hero-banner">
        <video autoPlay loop muted playsInline className="panel-hero-video">
          <source src={videoHero} type="video/mp4" />
        </video>
        <div className="panel-hero-overlay" />
        <div className="panel-hero-content">
          <div className="panel-hero-badge"><img src={logoImg} alt="" /> Plataforma de control constructivo</div>
          <h1 className="panel-hero-title">Bienvenido a <span>Titan V</span></h1>
          <p className="panel-hero-subtitle">Selecciona una obra para administrar cada detalle de tu operación.</p>
        </div>
      </div>
      <div className="section-header">
        <h2><i className="fas fa-diagram-project"></i> Mis proyectos</h2>
        <p className="muted-text">Entra a un proyecto para trabajar en sus módulos, o crea uno nuevo.</p>
      </div>

      <div className="grid">
        {puedeCrearProyecto && <div
          className="card card-interactive create-project-card"
          onClick={onCrearProyecto}
        >
          <div className="card-header" style={{ justifyContent: 'center' }}>
            <h3><i className="fas fa-plus-circle"></i> Crear proyecto</h3>
          </div>
          <p className="card-description">
            Registra una nueva obra para empezar a gestionar su equipo, inventario, tareas y evidencias.
          </p>
        </div>}

        {proyectos.length === 0 ? (
          <div className="card">
            <div className="card-header">
              <h3><i className="fas fa-diagram-project"></i> Mis proyectos</h3>
            </div>
            <p className="empty-msg">Todavía no tienes ningún proyecto. Crea el primero para comenzar.</p>
          </div>
        ) : (
          proyectos.map((p) => (
            <div key={p.id} className="card card-interactive" onClick={() => onEntrarProyecto(p)}>
              <div className="card-header">
                <h3><i className="fas fa-diagram-project"></i> {p.nombre_proyecto}</h3>
              </div>
              <p className="card-description">
                {p.ubicacion_direccion ? p.ubicacion_direccion : 'Sin ubicación registrada.'}
              </p>
              <div className="card-footer-action">Entrar al proyecto <i className="fas fa-arrow-right"></i></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
