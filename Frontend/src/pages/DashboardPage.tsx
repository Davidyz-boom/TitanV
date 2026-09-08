import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConToken } from '../api';
import { Sidebar } from '../components/Sidebar';
import { InicioTab } from '../components/InicioTab';
import { ProyectosTab } from '../components/ProyectosTab';
import { MaterialesTab } from '../components/MaterialesTab';
import Usuarios from '../components/Usuarios';
import Productos from '../components/Productos';
import TareasTab from '../components/TareasTab';
import { TurnosTab } from '../components/TurnosTab';
import { EvidenciasTab } from '../components/EvidenciasTab';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage = ({ onLogout }: DashboardPageProps) => {
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState('inicio');
  const [tieneProyectos, setTieneProyectos] = useState(false);
  const cargandoProyectos = false;

  const verificarProyectos = async () => {
    try {
      const respuesta = await fetchConToken('/proyectos/');
      const proyectos = respuesta.ok ? await respuesta.json() : [];
      setTieneProyectos(Array.isArray(proyectos) && proyectos.length > 0);
    } catch {
      setTieneProyectos(true);
    }
  };

  useEffect(() => {
    verificarProyectos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    onLogout();
    alert('Sesión cerrada correctamente.');
    navigate('/');
  };

  const [refreshKey, setRefreshKey] = useState(0);

  const refrescar = () => {
    setRefreshKey((prev) => prev + 1);
    verificarProyectos();
  };

  const bloqueado = !cargandoProyectos && !tieneProyectos;

  const irA = (tab: string) => {
    setTabActual(tab);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <Sidebar activeTab={tabActual} onSelectTab={irA} onLogout={handleLogout} bloqueado={bloqueado} />

      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={refrescar}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            title="Sincronizar cambios recientes de la base de datos"
          >
            <i className="fas fa-sync-alt" style={{ color: '#eab308' }}></i> Actualizar datos
          </button>
        </div>

        <div key={`${tabActual}-${refreshKey}`}>
          {tabActual === 'inicio' && (
            <InicioTab onIrA={irA} tieneProyectos={tieneProyectos} cargando={cargandoProyectos} />
          )}
          {tabActual === 'proyectos' && <ProyectosTab onProyectoCreado={verificarProyectos} />}
          {tabActual === 'materiales' && <MaterialesTab />}
          {tabActual === 'usuarios' && <Usuarios />}
          {tabActual === 'productos' && <Productos />}
          {tabActual === 'tareas' && <TareasTab />}
          {tabActual === 'turnos' && <TurnosTab />}
          {tabActual === 'evidencias' && <EvidenciasTab />}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
