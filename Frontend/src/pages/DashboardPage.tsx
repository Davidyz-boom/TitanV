import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConToken } from '../api';
import { Sidebar } from '../components/Sidebar';
import { InicioTab } from '../components/InicioTab';
import { ProyectosTab } from '../components/ProyectosTab';
import { ColaboradoresTab } from '../components/ColaboradoresTab';
import { MaterialesTab } from '../components/MaterialesTab';
import { InventarioTab } from '../components/InventarioTab';
import TareasTab from '../components/TareasTab';
import { TurnosTab } from '../components/TurnosTab';
import { EvidenciasTab } from '../components/EvidenciasTab';
import videoFondo from '../assets/video_landing.mp4';

export interface ProyectoResumen {
  id: number;
  nombre_proyecto: string;
  ubicacion_direccion?: string;
  estado?: string;
}

interface DashboardPageProps {
  onLogout: () => void;
}

const MODULOS_PROYECTO = ['colaboradores', 'materiales', 'inventario', 'tareas', 'turnos', 'evidencias'];

const DashboardPage = ({ onLogout }: DashboardPageProps) => {
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState('inicio');
  const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoResumen | null>(null);
  const [rolProyecto, setRolProyecto] = useState<string>('');
  const [cargandoProyectos, setCargandoProyectos] = useState(true);

  const verificarProyectos = async () => {
    try {
      const respuesta = await fetchConToken('/proyectos/');
      const data = respuesta.ok ? await respuesta.json() : [];
      setProyectos(Array.isArray(data) ? data : []);
    } catch {
      setProyectos([]);
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

  const entrarProyecto = (proyecto: ProyectoResumen) => {
    setProyectoSeleccionado(proyecto);
    setTabActual('inicio');
  };

  const salirProyecto = () => {
    setProyectoSeleccionado(null);
    setRolProyecto('');
    setTabActual('inicio');
  };

  const puedeAccederTab = (_tab: string) => {
    return true;
  };

  useEffect(() => {
    if (!proyectoSeleccionado) return;
    const usuarioId = Number(localStorage.getItem('usuario_id') || 0);
    const cargarRolProyecto = async () => {
      try {
        const respuesta = await fetchConToken(`/proyectos/${proyectoSeleccionado.id}/colaboradores/`);
        const colaboradores = respuesta.ok ? await respuesta.json() : [];
        const colaboradorActual = colaboradores.find((c: { usuario_id: number }) => c.usuario_id === usuarioId);
        setRolProyecto(colaboradorActual?.rol || '');
      } catch {
        setRolProyecto('');
      }
    };
    cargarRolProyecto();
  }, [proyectoSeleccionado]);

  const irA = (tab: string) => {
    if (!puedeAccederTab(tab)) {
      alert('Tu rol no tiene permiso para acceder a esta sección.');
      return;
    }
    if (MODULOS_PROYECTO.includes(tab) && !proyectoSeleccionado) {
      alert('Primero entra a un proyecto desde "Inicio" para desbloquear estas secciones.');
      return;
    }
    setTabActual(tab);
  };

  const crearProyecto = () => {
    if (!puedeAccederTab('proyectos')) {
      alert('Tu rol no tiene permiso para crear proyectos.');
      return;
    }
    setTabActual('proyectos');
  };

  const cambiarEstadoProyecto = async (estado: string) => {
    if (!proyectoSeleccionado || estado === proyectoSeleccionado.estado) return;

    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoSeleccionado.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(data?.detail || 'No se pudo actualizar el estado del proyecto.');

      const proyectoActualizado = { ...proyectoSeleccionado, estado: data.estado };
      setProyectoSeleccionado(proyectoActualizado);
      setProyectos((proyectosActuales) =>
        proyectosActuales.map((proyecto) => (proyecto.id === proyectoActualizado.id ? proyectoActualizado : proyecto)),
      );
    } catch (error: any) {
      alert(error.message || 'No se pudo actualizar el estado del proyecto.');
    }
  };

  const eliminarProyectoSeleccionado = async () => {
    if (!proyectoSeleccionado) return;
    if (!window.confirm(`¿Eliminar el proyecto "${proyectoSeleccionado.nombre_proyecto}"?`)) return;

    try {
      const respuesta = await fetchConToken(`/proyectos/${proyectoSeleccionado.id}`, { method: 'DELETE' });
      if (!respuesta.ok && respuesta.status !== 204) {
        const data = await respuesta.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo eliminar el proyecto.');
      }

      setProyectos((proyectosActuales) =>
        proyectosActuales.filter((proyecto) => proyecto.id !== proyectoSeleccionado.id),
      );
      salirProyecto();
    } catch (error: any) {
      alert(error.message || 'No se pudo eliminar el proyecto.');
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-bg-video-wrapper" aria-hidden="true">
        <video autoPlay loop muted playsInline className="dashboard-bg-video">
          <source src={videoFondo} type="video/mp4" />
        </video>
        <div className="dashboard-bg-overlay" />
      </div>
      <Sidebar
        activeTab={tabActual}
        onSelectTab={irA}
        onLogout={handleLogout}
        proyecto={proyectoSeleccionado}
        onSalirProyecto={salirProyecto}
      />

      <div className="main-content">
        {tabActual === 'inicio' && (
          <InicioTab
            proyectos={proyectos}
            cargando={cargandoProyectos}
            proyectoSeleccionado={proyectoSeleccionado}
            onEntrarProyecto={entrarProyecto}
            onSalirProyecto={salirProyecto}
            onIrA={irA}
            onCrearProyecto={crearProyecto}
            puedeCrearProyecto={true}
            puedeVerModulo={puedeAccederTab}
            onCambiarEstadoProyecto={cambiarEstadoProyecto}
            onEliminarProyecto={eliminarProyectoSeleccionado}
          />
        )}
        {/* Proyectos siempre queda accesible: es la única forma de crear proyectos */}
        {tabActual === 'proyectos' && <ProyectosTab onProyectoCreado={verificarProyectos} />}

        {/* Módulos: solo visibles dentro de un proyecto */}
        {proyectoSeleccionado && tabActual === 'colaboradores' && (
          <ColaboradoresTab proyectoId={proyectoSeleccionado.id} />
        )}
        {proyectoSeleccionado && tabActual === 'materiales' && (
          <MaterialesTab proyectoId={proyectoSeleccionado.id} proyectoNombre={proyectoSeleccionado.nombre_proyecto} rolProyecto={rolProyecto} />
        )}
        {proyectoSeleccionado && tabActual === 'inventario' && (
          <InventarioTab proyectoId={proyectoSeleccionado.id} proyectoNombre={proyectoSeleccionado.nombre_proyecto} rolProyecto={rolProyecto} />
        )}
        {proyectoSeleccionado && tabActual === 'tareas' && (
          <TareasTab proyectoId={proyectoSeleccionado.id} />
        )}
        {proyectoSeleccionado && tabActual === 'turnos' && (
          <TurnosTab proyectoId={proyectoSeleccionado.id} />
        )}
        {proyectoSeleccionado && tabActual === 'evidencias' && (
          <EvidenciasTab proyectoId={proyectoSeleccionado.id} />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
