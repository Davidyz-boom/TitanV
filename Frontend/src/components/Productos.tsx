import { CardAccion } from './CardAccion';
import { useState, useEffect } from 'react';
import { fetchConToken } from '../api';

interface Material {
  id: number;
  nombre_material: string;
  unidad_medida: string;
}

const Productos = () => {
  const [productos, setProductos] = useState<Material[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const respuesta = await fetchConToken('/materiales/');
      if (respuesta.ok) {
        const data = await respuesta.json();
        setProductos(data);
      }
    } catch (error) {
      console.error('Error al cargar catálogo de productos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleAccionProducto = async () => {
    if (!nuevoProducto.trim()) {
      alert('Escribe el nombre del producto antes de agregarlo.');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetchConToken('/materiales/', {
        method: 'POST',
        body: JSON.stringify({
          nombre_material: nuevoProducto.trim(),
          unidad_medida: 'Unidad',
        }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo registrar el producto.');
      }

      setNuevoProducto('');
      await cargarProductos();
      alert('Producto agregado con éxito.');
    } catch (err: any) {
      alert(err.message || 'Error al guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProducto = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${nombre}" del catálogo?`)) return;
    try {
      const respuesta = await fetchConToken(`/materiales/${id}`, { method: 'DELETE' });
      if (respuesta.ok || respuesta.status === 204) {
        await cargarProductos();
      } else {
        alert('No se pudo eliminar el producto.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el producto.');
    }
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
        disabled={guardando}
        style={{ backgroundColor: '#ffd60a', color: '#000', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}
      >
        {guardando ? 'Guardando...' : 'Agregar Producto'}
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Código</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Descripción del Material</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Unidad</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                Cargando productos...
              </td>
            </tr>
          ) : productos.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                No hay productos en el catálogo. Agrega el primero arriba.
              </td>
            </tr>
          ) : (
            productos.map((prod) => (
              <tr key={prod.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  MAT-{String(prod.id).padStart(3, '0')}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>
                  {prod.nombre_material}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  {prod.unidad_medida}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#2563eb', fontWeight: 'bold' }}>
                  Disponible
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <button
                    onClick={() => handleEliminarProducto(prod.id, prod.nombre_material)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px 8px' }}
                    title="Eliminar producto"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Productos;