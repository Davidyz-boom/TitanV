interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  proyecto: { id: number; nombre_proyecto: string } | null;
  onSalirProyecto: () => void;
  puedeVerModulo?: (tab: string) => boolean;
}

const ITEMS_MODULO = ['colaboradores', 'materiales', 'inventario', 'tareas', 'turnos', 'evidencias'];

export const Sidebar = ({ activeTab, onSelectTab, onLogout, proyecto, onSalirProyecto, puedeVerModulo }: SidebarProps) => {
  const sinProyecto = !proyecto;
  const puedeVer = (tab: string) => (puedeVerModulo ? puedeVerModulo(tab) : true);

  const manejarClick = (tab: string) => {
    if (sinProyecto && ITEMS_MODULO.includes(tab)) {
      alert('Primero entra a un proyecto desde "Inicio" para desbloquear estas secciones.');
      return;
    }
    onSelectTab(tab);
  };
  

  const claseItem = (tab: string) => {
    let clase = activeTab === tab ? 'active' : '';
    if (sinProyecto && ITEMS_MODULO.includes(tab)) clase += ' bloqueado';
    return clase.trim();
  };

  const icono = (tab: string) =>
    sinProyecto && ITEMS_MODULO.includes(tab) ? (
      <i className="fas fa-lock" style={{ fontSize: '11px', marginLeft: '6px' }}></i>
    ) : null;

  const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';
  const correoUsuario = localStorage.getItem('usuario_correo') || '';
  const rolRaw = localStorage.getItem('rol');
  const rolInfo = (() => {
    switch (rolRaw) {
      case '1':
        return { label: 'Administrador', icon: 'fa-crown', color: '#ffd60a', bg: 'rgba(255, 214, 10, 0.15)' };
      case '2':
        return { label: 'Supervisor', icon: 'fa-helmet-safety', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
      default:
        return { label: 'Operario / Vis.', icon: 'fa-eye', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' };
    }
  })();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo-circle">
            <img src={logoImg} alt="Logo de Titan V" className="sidebar-logo-img" />
          </div>
          <div className="logo-title">TITAN <span>V</span></div>
        </div>
        <p className="sidebar-caption">Control de obra</p>
      </div>

      {proyecto && (
        <div
          className="sidebar-project-card"
        >
          <div className="sidebar-project-label">
            Proyecto activo
          </div>
          <div className="sidebar-project-name">
            <i className="fas fa-diagram-project" style={{ marginRight: '6px' }}></i>
            {proyecto.nombre_proyecto}
          </div>
          <button
            onClick={onSalirProyecto}
            className="sidebar-change-project"
          >
            Cambiar de proyecto
          </button>
        </div>
      )}

      <div className="sidebar-menu">
        <a className={claseItem('inicio')} onClick={() => manejarClick('inicio')}>
          <i className="fas fa-house"></i><span>Inicio</span>
        </a>
        <a className={claseItem('proyectos')} onClick={() => manejarClick('proyectos')}>
          <i className="fas fa-diagram-project"></i><span>Proyectos de Obra</span>
        </a>
        {puedeVer('colaboradores') && <a className={claseItem('colaboradores')} onClick={() => manejarClick('colaboradores')}>
          <i className="fas fa-user-group"></i><span>Colaboradores {icono('colaboradores')}</span>
        </a>}
        {puedeVer('materiales') && <a className={claseItem('materiales')} onClick={() => manejarClick('materiales')}>
          <i className="fas fa-boxes-stacked"></i><span>Materiales {icono('materiales')}</span>
        </a>}
        {puedeVer('inventario') && <a className={claseItem('inventario')} onClick={() => manejarClick('inventario')}>
          <i className="fas fa-warehouse"></i><span>Inventario Insumos {icono('inventario')}</span>
        </a>}
        {puedeVer('tareas') && <a className={claseItem('tareas')} onClick={() => manejarClick('tareas')}>
          <i className="fas fa-list-check"></i><span>Gestión de Tareas {icono('tareas')}</span>
        </a>}
        {puedeVer('turnos') && <a className={claseItem('turnos')} onClick={() => manejarClick('turnos')}>
          <i className="fas fa-clock"></i><span>Turnos y Asistencia {icono('turnos')}</span>
        </a>}
        {puedeVer('evidencias') && <a className={claseItem('evidencias')} onClick={() => manejarClick('evidencias')}>
          <i className="fas fa-camera"></i><span>Evidencias {icono('evidencias')}</span>
        </a>}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <i className="fas fa-user-circle user-icon-circle"></i>
          <div className="user-text-info">
            <span className="user-session-label">Sesión iniciada como</span>
            <span className="user-session-name" title={nombreUsuario}>{nombreUsuario}</span>
            {correoUsuario && <span className="user-session-email" title={correoUsuario}>{correoUsuario}</span>}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '4px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: 700,
                color: rolInfo.color,
                backgroundColor: rolInfo.bg,
                border: `1px solid ${rolInfo.color}40`,
                width: 'fit-content'
              }}
            >
              <i className={`fas ${rolInfo.icon}`} style={{ fontSize: '9px' }}></i>
              {rolInfo.label}
            </span>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="sidebar-logout-btn">
          <i className="fas fa-arrow-right-from-bracket"></i> Cerrar sesión
        </button>
      </div>
    </div>
  );
};
import logoImg from '../assets/logo.png';
