import { useState } from 'react';

interface Material {
  id: number;
  nombre: string;
  cantidad: string;
  unidad: string;
  precio: string;
}

export const MaterialesTab = () => {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('');
  const [precio, setPrecio] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !cantidad || !unidad || !precio) return;

    const nuevoMaterial: Material = {
      id: Date.now(),
      nombre,
      cantidad,
      unidad,
      precio,
    };

    setMateriales([...materiales, nuevoMaterial]);
    setNombre('');
    setCantidad('');
    setUnidad('');
    setPrecio('');
  };

  const eliminarMaterial = (id: number) => {
    setMateriales(materiales.filter((m) => m.id !== id));
  };

  return (
    <div className="tab-content active">
      <div className="section-header">
        <h2><i className="fas fa-boxes-stacked"></i> Control de Stock e Insumos</h2>
      </div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3><i className="fas fa-plus"></i> Registrar Entrada de Material</h3></div>
        <form onSubmit={handleSubmit} className="form-horizontal" style={{ padding: '20px' }}>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre Material" required />
          <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Cantidad" required />
          <input type="text" value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="Unidad (Bultos, kg)" required />
          <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio Unitario ($)" required />
          <button type="submit" className="btn-save" style={{ marginTop: 0 }}>Agregar al Stock</button>
        </form>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Material</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio U.</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {materiales.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '30px' }}>No hay insumos registrados en el stock.</td>
              </tr>
            ) : (
              materiales.map((m, index) => (
                <tr key={m.id}>
                  <td>{index + 1}</td>
                  <td>{m.nombre}</td>
                  <td>{m.cantidad}</td>
                  <td>{m.unidad}</td>
                  <td>${Number(m.precio).toLocaleString()}</td>
                  <td>
                    <button onClick={() => eliminarMaterial(m.id)} className="btn-delete" style={{ padding: '5px 10px' }}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};