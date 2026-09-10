import logoImg from '../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  bloqueado?: boolean;
}

const ITEMS_LIBRES = ['inicio', 'proyectos'];

export const Sidebar = ({ activeTab, onSelectTab, onLogout, bloqueado = false }: SidebarProps) => {
  const rolStorage = localStorage.getItem('usuario_rol');
  const rol = Number(rolStorage !== null ? rolStorage : '3');
  const esAdmin = rol === 1;

  const correoUsuario = localStorage.getItem('usuario_correo') || 'usuario@titanv.com';
  const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';

  const manejarClick = (tab: string) => {
    if (bloqueado && !ITEMS_LIBRES.includes(tab)) {
      alert('Primero crea tu primer proyecto en "Proyectos de Obra" para desbloquear esta sección.');
      return;
    }
    onSelectTab(tab);
  };

  const claseItem = (tab: string) => {
    let clase = activeTab === tab ? 'active' : '';
    if (bloqueado && !ITEMS_LIBRES.includes(tab)) clase += ' bloqueado';
    return clase.trim();
  };

  const icono = (tab: string) =>
    bloqueado && !ITEMS_LIBRES.includes(tab) ? (
      <i className="fas fa-lock" style={{ fontSize: '11px', marginLeft: '6px' }}></i>
    ) : null;

  return (
    <div className="sidebar">
      {/* CABECERA: LOGO + TITAN V */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src={logoImg} alt="Titan V Logo" className="sidebar-logo-img" />
          <div className="logo-title">
            TITAN <span>V</span>
          </div>
        </div>

        {/* INDICADOR DE ROL (ARRIBA) */}
        <div className="sidebar-role-wrapper">
          <div className={`sidebar-role-badge ${esAdmin ? 'role-admin' : 'role-user'}`}>
            <i className={esAdmin ? 'fas fa-shield-alt' : 'fas fa-hard-hat'}></i>
            <span>{esAdmin ? 'Rol: Administrador' : 'Rol: Usuario (Obra)'}</span>
          </div>
        </div>
      </div>

      {/* MENÚ DE NAVEGACIÓN SEGÚN EL ROL */}
      <div className="sidebar-menu">
        <a style={{ cursor: 'pointer' }} className={claseItem('inicio')} onClick={() => manejarClick('inicio')}>
          <i className="fas fa-home" style={{ width: '18px' }}></i>
          <span>Inicio</span>
        </a>

        <a style={{ cursor: 'pointer' }} className={claseItem('proyectos')} onClick={() => manejarClick('proyectos')}>
          <i className="fas fa-project-diagram" style={{ width: '18px' }}></i>
          <span>Proyectos de Obra</span>
        </a>

        {/* MÓDULOS DE ADMINISTRADOR: Solo visibles si es administrador */}
        {esAdmin && (
          <>
            <a style={{ cursor: 'pointer' }} className={claseItem('materiales')} onClick={() => manejarClick('materiales')}>
              <i className="fas fa-boxes-stacked" style={{ width: '18px' }}></i>
              <span>Inventario Insumos {icono('materiales')}</span>
            </a>

            <a style={{ cursor: 'pointer' }} className={claseItem('usuarios')} onClick={() => manejarClick('usuarios')}>
              <i className="fas fa-users" style={{ width: '18px' }}></i>
              <span>Gestión Usuarios {icono('usuarios')}</span>
            </a>

            <a style={{ cursor: 'pointer' }} className={claseItem('tareas')} onClick={() => manejarClick('tareas')}>
              <i className="fas fa-tasks" style={{ width: '18px' }}></i>
              <span>Gestión de Tareas {icono('tareas')}</span>
            </a>

            <a style={{ cursor: 'pointer' }} className={claseItem('turnos')} onClick={() => manejarClick('turnos')}>
              <i className="fas fa-clock" style={{ width: '18px' }}></i>
              <span>Turnos y Asistencia {icono('turnos')}</span>
            </a>
          </>
        )}

        {/* EVIDENCIAS: Accesible tanto para admin como usuario estándar (para su proyecto) */}
        <a style={{ cursor: 'pointer' }} className={claseItem('evidencias')} onClick={() => manejarClick('evidencias')}>
          <i className="fas fa-camera" style={{ width: '18px' }}></i>
          <span>Evidencias de Obra {icono('evidencias')}</span>
        </a>
      </div>

      {/* PIE DEL SIDEBAR: CUENTA CON LA QUE SE INICIÓ SESIÓN (ABAJO) Y CERRAR SESIÓN */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="user-icon-circle">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="user-text-info">
            <span className="user-session-label">Sesión iniciada como:</span>
            <span className="user-session-name" title={nombreUsuario}>{nombreUsuario}</span>
            <span className="user-session-email" title={correoUsuario}>{correoUsuario}</span>
          </div>
        </div>

        <button onClick={onLogout} className="sidebar-logout-btn">
          <i className="fas fa-sign-out-alt"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
