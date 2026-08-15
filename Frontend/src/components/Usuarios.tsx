const Usuarios = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#0f172a', marginBottom: '15px' }}>Gestión de Usuarios</h2>
      <p style={{ color: '#475569', marginBottom: '20px' }}>Listado de usuarios registrados en el sistema corporativo Titan V.</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>ID</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Nombre</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Rol</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>1</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>José David Castro</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>Administrador</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#16a34a', fontWeight: 'bold' }}>Activo</td>
          </tr>
          <tr>
            <td style={{ padding: '12px' }}>2</td>
            <td style={{ padding: '12px' }}>Carlos Gómez</td>
            <td style={{ padding: '12px' }}>Operario de Obra</td>
            <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>Activo</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Usuarios;