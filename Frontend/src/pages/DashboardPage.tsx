import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConToken } from '../api';
import { Sidebar } from '../components/Sidebar';
import { InicioTab } from '../components/InicioTab';
import { ProyectosTab } from '../components/ProyectosTab';
import { MaterialesTab } from '../components/MaterialesTab';
import Usuarios from '../components/Usuarios';
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
  const [cargandoProyectos, setCargandoProyectos] = useState(true);

  const usuarioId = localStorage.getItem('usuario_id') || '1';

  const verificarProyectos = async () => {
    try {
      const respuesta = await fetchConToken(`/proyectos/?usuario_id=${usuarioId}`);
      const proyectos = respuesta.ok ? await respuesta.json() : [];
      setTieneProyectos(Array.isArray(proyectos) && proyectos.length > 0);
    } catch {
      // Si falla la verificación, no bloqueamos al usuario de más: lo dejamos pasar.
      setTieneProyectos(true);
    } finally {
      setCargandoProyectos(false);
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

  const rolStorage = localStorage.getItem('usuario_rol');
  const esAdmin = Number(rolStorage) === 1;

  const bloqueado = !esAdmin && !cargandoProyectos && !tieneProyectos;

  const irA = (tab: string) => {
    // Un usuario no administrador solo puede acceder a inicio, proyectos y evidencias
    if (!esAdmin && tab !== 'inicio' && tab !== 'proyectos' && tab !== 'evidencias') {
      return;
    }
    if (bloqueado && tab !== 'inicio' && tab !== 'proyectos') return;
    setTabActual(tab);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <Sidebar activeTab={tabActual} onSelectTab={irA} onLogout={handleLogout} bloqueado={bloqueado} />

      <div className="main-content">
        {tabActual === 'inicio' && (
          <InicioTab onIrA={irA} tieneProyectos={tieneProyectos} cargando={cargandoProyectos} />
        )}
        {/* Proyectos siempre queda accesible */}
        {tabActual === 'proyectos' && <ProyectosTab onProyectoCreado={verificarProyectos} />}

        {/* Solo el Administrador puede ver y modificar estos módulos */}
        {esAdmin && tabActual === 'materiales' && <MaterialesTab />}
        {esAdmin && tabActual === 'usuarios' && <Usuarios />}
        {esAdmin && tabActual === 'tareas' && <TareasTab />}
        {esAdmin && tabActual === 'turnos' && <TurnosTab />}

        {/* Evidencias es accesible para todos los usuarios autorizados (filtrado por su proyecto) */}
        {tabActual === 'evidencias' && <EvidenciasTab />}
      </div>
    </div>
  );
};

export default DashboardPage;
