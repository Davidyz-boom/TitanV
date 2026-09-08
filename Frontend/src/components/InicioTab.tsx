interface InicioTabProps {
  onIrA: (tab: string) => void;
  tieneProyectos: boolean;
  cargando: boolean;
}

const ACCESOS = [
  { tab: 'proyectos', icono: 'fa-diagram-project', titulo: 'Proyectos de Obra', texto: 'Crea y revisa los proyectos activos.' },
  { tab: 'tareas', icono: 'fa-tasks', titulo: 'Gestión de Tareas', texto: 'Crea tareas, supervisa su estado y gestiona comentarios técnicos.' },
  { tab: 'materiales', icono: 'fa-boxes-stacked', titulo: 'Inventario de Insumos', texto: 'Controla entradas y stock de material.' },
  { tab: 'usuarios', icono: 'fa-users', titulo: 'Gestión de Usuarios', texto: 'Administra el equipo de trabajo.' },
  { tab: 'productos', icono: 'fa-list', titulo: 'Catálogo / Productos', texto: 'Consulta el catálogo general.' },
  { tab: 'turnos', icono: 'fa-clock', titulo: 'Turnos y Asistencia', texto: 'Programa turnos y registra la asistencia del equipo.' },
  { tab: 'evidencias', icono: 'fa-camera', titulo: 'Evidencias de Obra', texto: 'Sube fotos y documentos del avance del proyecto.' },
];

export const InicioTab = ({ onIrA, tieneProyectos, cargando }: InicioTabProps) => {
  if (cargando) {
    return (
      <div className="tab-content active">
        <div className="section-header">
          <h2><i className="fas fa-house"></i> Bienvenido a Titan V</h2>
        </div>
        <p style={{ color: '#666' }}>Cargando...</p>
      </div>
    );
  }

  // Onboarding: todavía no tiene ningún proyecto -> solo se ve la opción de crear uno.
  if (!tieneProyectos) {
    return (
      <div className="tab-content active">
        <div className="section-header">
          <h2><i className="fas fa-house"></i> Bienvenido a Titan V</h2>
        </div>
        <div
          className="card"
          style={{ cursor: 'pointer', maxWidth: '420px', textAlign: 'center', padding: '10px 0' }}
          onClick={() => onIrA('proyectos')}
        >
          <div className="card-header" style={{ justifyContent: 'center' }}>
            <h3><i className="fas fa-diagram-project"></i> Crea tu primer proyecto</h3>
          </div>
          <p style={{ padding: '20px 25px', color: '#666', fontSize: '14px' }}>
            Todavía no tienes ningún proyecto de obra registrado. Crea el primero para
            desbloquear el inventario, las tareas, los usuarios y el catálogo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-house"></i> Bienvenido a Titan V</h2>
      </div>
      <div className="grid">
        {ACCESOS.map((a) => (
          <div key={a.tab} className="card" style={{ cursor: 'pointer' }} onClick={() => onIrA(a.tab)}>
            <div className="card-header">
              <h3><i className={`fas ${a.icono}`}></i> {a.titulo}</h3>
            </div>
            <p style={{ padding: '20px 25px', color: '#666', fontSize: '14px' }}>{a.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
