import logoTitan from '../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  bloqueado?: boolean;
  rol?: number;
}

const ITEMS_LIBRES = ['inicio', 'proyectos'];

export const Sidebar = ({ activeTab, onSelectTab, onLogout, bloqueado = false, rol = 3 }: SidebarProps) => {
  const esOperario = rol === 3;
  const esAdmin = rol === 1;

  const manejarClick = (tab: string) => {
    if (bloqueado && !ITEMS_LIBRES.includes(tab) && !esOperario) {
      alert('Primero crea tu primer proyecto en "Proyectos de Obra" para desbloquear esta sección.');
      return;
    }
    onSelectTab(tab);
  };

  const claseItem = (tab: string) => {
    let clase = activeTab === tab ? 'active' : '';
    if (bloqueado && !ITEMS_LIBRES.includes(tab) && !esOperario) clase += ' bloqueado';
    return clase.trim();
  };

  const icono = (tab: string) =>
    bloqueado && !ITEMS_LIBRES.includes(tab) && !esOperario ? (
      <i className="fas fa-lock" style={{ fontSize: '11px', marginLeft: '6px' }}></i>
    ) : null;

  return (
    <div className="sidebar">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <img
          src={logoTitan}
          alt="Titan V"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #ffd60a',
            boxShadow: '0 0 8px rgba(255, 214, 10, 0.4)',
          }}
        />
        <span>TITAN <span style={{ color: '#ffd60a' }}>V</span></span>
      </div>

      <div style={{ padding: '0 16px 10px 16px', textAlign: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: esAdmin ? '#ffd60a' : '#60a5fa',
            backgroundColor: esAdmin ? 'rgba(255, 214, 10, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            padding: '3px 10px',
            borderRadius: '20px',
            border: `1px solid ${esAdmin ? 'rgba(255, 214, 10, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            display: 'inline-block',
          }}
        >
          {esAdmin ? '👑 Vista Administrador' : '🛠️ Panel Operario'}
        </span>
      </div>

      <div className="sidebar-menu">
        {/* PANELES PARA USUARIO COMÚN / OPERARIO */}
        {esOperario ? (
          <>
            <a style={{ cursor: 'pointer' }} className={claseItem('proyectos')} onClick={() => manejarClick('proyectos')}>
              <i className="fas fa-hammer" style={{ marginRight: '8px' }}></i> Mi Obra de Construcción
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('materiales')} onClick={() => manejarClick('materiales')}>
              <i className="fas fa-boxes-stacked" style={{ marginRight: '8px' }}></i> Materiales de la Obra
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('turnos')} onClick={() => manejarClick('turnos')}>
              <i className="fas fa-clock" style={{ marginRight: '8px' }}></i> Turnos y Asistencia
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('evidencias')} onClick={() => manejarClick('evidencias')}>
              <i className="fas fa-camera" style={{ marginRight: '8px' }}></i> Evidencias de la Obra
            </a>
          </>
        ) : (
          /* PANELES COMPLETOS PARA ADMINISTRADOR / SUPERVISOR */
          <>
            <a style={{ cursor: 'pointer' }} className={claseItem('inicio')} onClick={() => manejarClick('inicio')}>
              <i className="fas fa-house" style={{ marginRight: '8px' }}></i> Inicio
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('proyectos')} onClick={() => manejarClick('proyectos')}>
              <i className="fas fa-project-diagram" style={{ marginRight: '8px' }}></i> Proyectos de Obra
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('materiales')} onClick={() => manejarClick('materiales')}>
              <i className="fas fa-boxes-stacked" style={{ marginRight: '8px' }}></i> Inventario Insumos {icono('materiales')}
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('usuarios')} onClick={() => manejarClick('usuarios')}>
              <i className="fas fa-users-gear" style={{ marginRight: '8px' }}></i> Gestión de Usuarios {icono('usuarios')}
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('productos')} onClick={() => manejarClick('productos')}>
              <i className="fas fa-list-check" style={{ marginRight: '8px' }}></i> Catálogo / Productos {icono('productos')}
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('tareas')} onClick={() => manejarClick('tareas')}>
              <i className="fas fa-tasks" style={{ marginRight: '8px' }}></i> Gestión de Tareas {icono('tareas')}
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('turnos')} onClick={() => manejarClick('turnos')}>
              <i className="fas fa-clock" style={{ marginRight: '8px' }}></i> Turnos y Asistencia {icono('turnos')}
            </a>
            <a style={{ cursor: 'pointer' }} className={claseItem('evidencias')} onClick={() => manejarClick('evidencias')}>
              <i className="fas fa-camera" style={{ marginRight: '8px' }}></i> Evidencias {icono('evidencias')}
            </a>
          </>
        )}

        <a onClick={onLogout} style={{ marginTop: '24px', color: '#ff4757', cursor: 'pointer' }}>
          <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i> Cerrar Sesión
        </a>
      </div>
    </div>
  );
};
