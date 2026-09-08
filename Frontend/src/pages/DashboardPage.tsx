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
import { CuentaFlotante } from '../components/CuentaFlotante';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage = ({ onLogout }: DashboardPageProps) => {
  const navigate = useNavigate();
  const rol = Number(localStorage.getItem('usuario_rol') || '3');
  const usuarioId = localStorage.getItem('usuario_id') || '1';

  // Si es operario (rol 3), entra directamente a su obra asignada
  const [tabActual, setTabActual] = useState(rol === 3 ? 'proyectos' : 'inicio');
  const [tieneProyectos, setTieneProyectos] = useState(false);
  const cargandoProyectos = false;

  const verificarProyectos = async () => {
    try {
      const url = rol === 1 ? '/proyectos/' : `/proyectos/?usuario_id=${usuarioId}`;
      const respuesta = await fetchConToken(url);
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
    // Si es operario y trata de ir a un panel no permitido, mantener en proyectos
    if (rol === 3 && !['proyectos', 'materiales', 'turnos', 'evidencias'].includes(tab)) {
      setTabActual('proyectos');
      return;
    }
    setTabActual(tab);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9', position: 'relative' }}>
      <Sidebar activeTab={tabActual} onSelectTab={irA} onLogout={handleLogout} bloqueado={bloqueado} rol={rol} />

      <div className="main-content" style={{ flex: 1, padding: '24px', paddingBottom: '90px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {rol === 1 ? 'Panel Principal de Administración' : 'Panel de Gestión de Obra'}
            </h1>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {rol === 1
                ? 'Control integral de obras, inventario general y usuarios'
                : 'Visualización de avances, materiales asignados, turnos y evidencias'}
            </span>
          </div>

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
          {tabActual === 'inicio' && rol !== 3 && (
            <InicioTab onIrA={irA} tieneProyectos={tieneProyectos} cargando={cargandoProyectos} />
          )}
          {tabActual === 'proyectos' && <ProyectosTab onProyectoCreado={verificarProyectos} rol={rol} />}
          {tabActual === 'materiales' && <MaterialesTab rol={rol} />}
          {tabActual === 'usuarios' && rol === 1 && <Usuarios />}
          {tabActual === 'productos' && rol !== 3 && <Productos />}
          {tabActual === 'tareas' && rol !== 3 && <TareasTab />}
          {tabActual === 'turnos' && <TurnosTab rol={rol} />}
          {tabActual === 'evidencias' && <EvidenciasTab rol={rol} />}
        </div>
      </div>

      {/* TARJETA DE CUENTA EN LA ESQUINA INFERIOR DERECHA (REQUERIMIENTO 5) */}
      <CuentaFlotante onLogout={handleLogout} />
    </div>
  );
};

export default DashboardPage;
