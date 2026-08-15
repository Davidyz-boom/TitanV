import { useState } from 'react';

interface Proyecto {
  id: number;
  nombre: string;
  presupuesto: string;
  fechaInicio: string;
  fechaFin: string;
}

export const ProyectosTab = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [nombre, setNombre] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !presupuesto || !fechaInicio || !fechaFin) return;

    const nuevoProyecto: Proyecto = {
      id: Date.now(),
      nombre,
      presupuesto,
      fechaInicio,
      fechaFin,
    };

    setProyectos([...proyectos, nuevoProyecto]);
    // Limpiar formulario
    setNombre('');
    setPresupuesto('');
    setFechaInicio('');
    setFechaFin('');
  };

  const eliminarProyecto = (id: number) => {
    setProyectos(proyectos.filter((p) => p.id !== id));
  };

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-project-diagram"></i> Panel de Proyectos Activos</h2>
      </div>
      <div className="grid">
        <div className="card">
          <div className="card-header"><h3><i className="fas fa-plus-circle"></i> Crear Nuevo Proyecto</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nombre de la Obra</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Edificio Calle 100" required />
            </div>
            <div className="input-group">
              <label>Presupuesto Estimado (COP)</label>
              <input type="number" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} placeholder="Ej: 120000000" required />
            </div>
            <div className="date-row">
              <div className="input-group">
                <label>Fecha Inicio</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Fecha Fin</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn-save">Registrar e Iniciar Obra</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3><i className="fas fa-list"></i> Obras en Ejecución (PostgreSQL)</h3></div>
          <div className="project-container">
            {proyectos.length === 0 ? (
              <div className="empty-msg">No hay proyectos registrados actualmente.</div>
            ) : (
              proyectos.map((p) => (
                <div key={p.id} className="project-item">
                  <div>
                    <h4>{p.nombre}</h4>
                    <span style={{ fontSize: '12px', color: '#666' }}>Presupuesto: ${Number(p.presupuesto).toLocaleString()} COP</span>
                  </div>
                  <button onClick={() => eliminarProyecto(p.id)} className="btn-delete">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};