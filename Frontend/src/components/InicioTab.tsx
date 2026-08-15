interface InicioTabProps {
  onIrA: (tab: string) => void;
}

export const InicioTab = ({ onIrA }: InicioTabProps) => {
  const accesos = [
    { tab: 'proyectos', icono: 'fa-diagram-project', titulo: 'Proyectos de Obra', texto: 'Crea y revisa los proyectos activos.' },
    { tab: 'materiales', icono: 'fa-boxes-stacked', titulo: 'Inventario de Insumos', texto: 'Controla entradas y stock de material.' },
    { tab: 'usuarios', icono: 'fa-users', titulo: 'Gestión de Usuarios', texto: 'Administra el equipo de trabajo.' },
    { tab: 'productos', icono: 'fa-list', titulo: 'Catálogo / Productos', texto: 'Consulta el catálogo general.' },
  ];

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-house"></i> Bienvenido a Titan V</h2>
      </div>
      <div className="grid">
        {accesos.map((a) => (
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
