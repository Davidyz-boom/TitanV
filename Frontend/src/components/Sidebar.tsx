interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar = ({ activeTab, onSelectTab, onLogout }: SidebarProps) => {
  return (
    <div className="sidebar">
      <div className="logo">
        TITAN <span>V</span>
      </div>
      <div className="sidebar-menu">
        <a
          className={activeTab === 'inicio' ? 'active' : ''}
          onClick={() => onSelectTab('inicio')}
        >
          Inicio
        </a>
        <a 
          className={activeTab === 'proyectos' ? 'active' : ''} 
          onClick={() => onSelectTab('proyectos')}
        >
          Proyectos de Obra
        </a>
        <a 
          className={activeTab === 'materiales' ? 'active' : ''} 
          onClick={() => onSelectTab('materiales')}
        >
          Inventario Insumos
        </a>
        <a 
          className={activeTab === 'usuarios' ? 'active' : ''} 
          onClick={() => onSelectTab('usuarios')}
        >
          Gestión de Usuarios
        </a>
        <a 
          className={activeTab === 'productos' ? 'active' : ''} 
          onClick={() => onSelectTab('productos')}
        >
          Catálogo / Productos
        </a>
        <a onClick={onLogout} style={{ marginTop: '20px', color: '#ff4757' }}>
          Cerrar Sesión
        </a>
      </div>
    </div>
  );
};