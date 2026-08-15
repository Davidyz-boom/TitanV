import { CardAccion } from './CardAccion';
import { useState } from 'react';

const Productos = () => {
  const [nuevoProducto, setNuevoProducto] = useState('');

  const handleAccionProducto = () => {
    if (!nuevoProducto.trim()) {
      alert('Escribe el nombre del producto antes de agregarlo.');
      return;
    }
    alert(`Módulo: Productos\nSe agregó: ${nuevoProducto}`);
    setNuevoProducto('');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#0f172a', marginBottom: '15px' }}>Catálogo de Materiales y Productos</h2>
      <p style={{ color: '#475569', marginBottom: '20px' }}>Inventario general disponible para la gestión de proyectos.</p>

      <CardAccion
        label="Nuevo Producto"
        placeholder="Nombre del material o producto"
        valor={nuevoProducto}
        onChange={(e) => setNuevoProducto(e.target.value)}
      />
      <button
        onClick={handleAccionProducto}
        style={{ backgroundColor: '#ffd60a', color: '#000', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}
      >
        Agregar Producto
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Código</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Descripción del Material</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Stock</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>MAT-001</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>Cemento Gris (Saco 50kg)</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>120</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#2563eb', fontWeight: 'bold' }}>Disponible</td>
          </tr>
          <tr>
            <td style={{ padding: '12px' }}>MAT-002</td>
            <td style={{ padding: '12px' }}>Varilla Corrugada 3/8"</td>
            <td style={{ padding: '12px' }}>450</td>
            <td style={{ padding: '12px', color: '#2563eb', fontWeight: 'bold' }}>Disponible</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Productos;