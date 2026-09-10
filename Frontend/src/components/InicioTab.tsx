import videoHero from '../assets/video_landing.mp4';
import logoImg from '../assets/logo.png';

interface InicioTabProps {
  onIrA: (tab: string) => void;
  tieneProyectos: boolean;
  cargando: boolean;
}

const ACCESOS_ADMIN = [
  { tab: 'proyectos', icono: 'fa-diagram-project', titulo: 'Proyectos de Obra', texto: 'Crea, visualiza y administra todas las obras del sistema.' },
  { tab: 'materiales', icono: 'fa-boxes-stacked', titulo: 'Inventario de Insumos', texto: 'Asigna materiales a obras, agrega insumos y consulta el historial.' },
  { tab: 'usuarios', icono: 'fa-users', titulo: 'Gestión de Usuarios', texto: 'Administra usuarios y asigna roles en tiempo real.' },
  { tab: 'tareas', icono: 'fa-tasks', titulo: 'Gestión de Tareas', texto: 'Supervisa estado de tareas y gestiona comentarios técnicos.' },
  { tab: 'turnos', icono: 'fa-clock', titulo: 'Turnos y Asistencia', texto: 'Programa turnos y registra la asistencia del equipo.' },
  { tab: 'evidencias', icono: 'fa-camera', titulo: 'Evidencias de Obra', texto: 'Supervisa las fotos y documentos del avance de cada proyecto.' },
];

const ACCESOS_USUARIO = [
  { tab: 'proyectos', icono: 'fa-diagram-project', titulo: 'Proyectos de Obra', texto: 'Crea tu obra y consulta el estado de tus proyectos.' },
  { tab: 'evidencias', icono: 'fa-camera', titulo: 'Evidencias de Obra', texto: 'Sube fotografías, planos y documentos de avance de tu proyecto.' },
];

export const InicioTab = ({ onIrA, tieneProyectos, cargando }: InicioTabProps) => {
  const rolStorage = localStorage.getItem('usuario_rol');
  const rol = Number(rolStorage !== null ? rolStorage : '3');
  const esAdmin = rol === 1;
  const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';

  const accesos = esAdmin ? ACCESOS_ADMIN : ACCESOS_USUARIO;

  if (cargando) {
    return (
      <div className="tab-content active animated-fadeIn">
        <div className="section-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#141414',
              border: '2px solid #ffd60a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 0 10px rgba(255, 214, 10, 0.3)',
              flexShrink: 0
            }}>
              <img src={logoImg} alt="Titan V" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            <span>Bienvenido a Titan V</span>
          </h2>
        </div>
        <p style={{ color: '#666' }}>Cargando información del sistema...</p>
      </div>
    );
  }

  return (
    <div className="tab-content active animated-fadeIn">
      {/* HERO BANNER CON VIDEO DE CONSTRUCCIÓN ANIMADO */}
      <div className="panel-hero-banner">
        <video autoPlay loop muted playsInline className="panel-hero-video">
          <source src={videoHero} type="video/mp4" />
          Tu navegador no soporta video.
        </video>
        <div className="panel-hero-overlay"></div>
        <div className="panel-hero-content">
          <div className="panel-hero-badge">
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#141414',
              border: '1.5px solid #ffd60a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginRight: '6px',
              flexShrink: 0
            }}>
              <img src={logoImg} alt="Titan V" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            <span>PLATAFORMA DE CONTROL CONSTRUCTIVO TITAN V</span>
          </div>
          <h1 className="panel-hero-title">
            ¡Hola, <span className="highlight">{nombreUsuario}</span>!
          </h1>
          <p className="panel-hero-subtitle">
            {esAdmin
              ? 'Panel de control maestro: Tienes acceso total para gestionar obras, insumos, tareas y usuarios.'
              : 'Bienvenido a tu panel de obra. Puedes crear tu proyecto y registrar las evidencias de avance.'}
          </p>
          <div className="panel-hero-tags">
            <span className={`hero-tag ${esAdmin ? 'tag-admin' : 'tag-user'}`}>
              <i className={esAdmin ? 'fas fa-shield-alt' : 'fas fa-user-check'}></i>
              {esAdmin ? 'Modo Administrador' : 'Modo Usuario / Constructor'}
            </span>
            <span className="hero-tag tag-status">
              <i className="fas fa-circle-dot"></i> Sistema Conectado a PostgreSQL
            </span>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '25px' }}>
        <h2><i className="fas fa-th-large"></i> Accesos Rápidos</h2>
      </div>

      {/* Si es usuario y no tiene proyectos aún, mostrar sugerencia */}
      {!tieneProyectos && !esAdmin && (
        <div
          className="card card-animated-pulse"
          style={{ cursor: 'pointer', maxWidth: '520px', marginBottom: '25px', borderLeft: '4px solid #ffd60a' }}
          onClick={() => onIrA('proyectos')}
        >
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-plus-circle" style={{ color: '#ffd60a', fontSize: '18px' }}></i>
            <h3 style={{ margin: 0 }}>Crea tu primer proyecto de obra</h3>
          </div>
          <p style={{ padding: '16px 20px', color: '#555', fontSize: '14px', margin: 0 }}>
            Para comenzar a subir evidencias y gestionar tu construcción, crea tu primer proyecto aquí.
          </p>
        </div>
      )}

      {/* GRILLA DE TARJETAS ANIMADAS */}
      <div className="grid">
        {accesos.map((a) => (
          <div
            key={a.tab}
            className="card card-interactive"
            style={{ cursor: 'pointer' }}
            onClick={() => onIrA(a.tab)}
          >
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="card-icon-bubble">
                <i className={`fas ${a.icono}`}></i>
              </div>
              <h3 style={{ margin: 0 }}>{a.titulo}</h3>
            </div>
            <p style={{ padding: '20px 25px', color: '#666', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
              {a.texto}
            </p>
            <div className="card-footer-action">
              <span>Ingresar</span>
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
