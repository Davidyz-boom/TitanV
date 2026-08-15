import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { InicioTab } from '../components/InicioTab';
import { ProyectosTab } from '../components/ProyectosTab';
import { MaterialesTab } from '../components/MaterialesTab';
import Usuarios from '../components/Usuarios';
import Productos from '../components/Productos';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage = ({ onLogout }: DashboardPageProps) => {
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState('inicio');

  const handleLogout = () => {
    onLogout();
    alert('Sesión cerrada correctamente.');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <Sidebar activeTab={tabActual} onSelectTab={setTabActual} onLogout={handleLogout} />

      <div className="main-content">
        {tabActual === 'inicio' && <InicioTab onIrA={setTabActual} />}
        {tabActual === 'proyectos' && <ProyectosTab />}
        {tabActual === 'materiales' && <MaterialesTab />}
        {tabActual === 'usuarios' && <Usuarios />}
        {tabActual === 'productos' && <Productos />}
      </div>
    </div>
  );
};

export default DashboardPage;
