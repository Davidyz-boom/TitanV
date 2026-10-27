import { useNavigate } from 'react-router-dom';
import QuienesSomos from '../components/QuienesSomos';
import CookieBanner from '../components/CookieBanner';
// IMPORTACIÓN CON EL NOMBRE DE TU VIDEO
import videoFondo from '../assets/video_landing.mp4';
import logoImg from '../assets/logo.png';

const caracteristicas = [
  {
    icono: 'fa-diagram-project',
    titulo: 'Proyectos de obra',
    texto: 'Crea y da seguimiento a cada obra: ubicación, estado y fechas clave, todo en un solo lugar.',
  },
  {
    icono: 'fa-boxes-stacked',
    titulo: 'Materiales e inventario',
    texto: 'Controla las entradas y salidas de material por proyecto, con el stock siempre actualizado.',
  },
  {
    icono: 'fa-users',
    titulo: 'Usuarios y roles',
    texto: 'Administradores, supervisores y operarios, cada uno con su propio acceso al sistema.',
  },
  {
    icono: 'fa-comments',
    titulo: 'Comentarios',
    texto: 'Deja comentarios y seguimiento directo sobre el avance de cada proyecto.',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 8%',
          borderBottom: '2px solid #ffd60a',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px', fontWeight: 800 }}>
          <div style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid #ffd60a',
            borderRadius: '50%',
            backgroundColor: '#141414',
            boxShadow: '0 0 12px rgba(255, 214, 10, 0.35)',
          }}>
            <img src={logoImg} alt="Logo de Titan V" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
          </div>
          <span>TITAN <span style={{ color: '#ffd60a' }}>V</span></span>
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            backgroundColor: '#ffd60a',
            color: '#000',
            border: 'none',
            borderRadius: '999px',
            padding: '10px 22px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Iniciar Sesión
        </button>
      </header>

      {/* Contenedor principal con el video de fondo */}
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
        
        {/* ========================================================= */}
        {/* VIDEO DE FONDO VINCULADO CORRECTAMENTE                    */}
        {/* ========================================================= */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
            objectFit: 'cover',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <source src={videoFondo} type="video/mp4" />
          Tu navegador no soporta videos de fondo.
        </video>

        {/* Capa de protección oscura para aumentar el contraste de las letras */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
            zIndex: 2,
          }}
        />
        {/* ========================================================= */}

        {/* Bloque de textos flotando por encima del fondo */}
        <section
          style={{
            position: 'relative',
            zIndex: 3,
            padding: '120px 8% 100px',
            textAlign: 'center',
            maxWidth: '780px',
            margin: '0 auto',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: '12px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#ffd60a',
              marginBottom: '18px',
              fontWeight: 600,
            }}
          >
            Sistema de gestión de obra
          </span>
          <h1 style={{ fontSize: '42px', lineHeight: 1.2, margin: '0 0 20px', fontWeight: 800 }}>
            Controla tu obra de principio a fin, <span style={{ color: '#ffd60a' }}>sin perder el hilo</span>
          </h1>
          <p style={{ color: '#ccc', fontSize: '17px', lineHeight: 1.6, marginBottom: '34px' }}>
            Titan V centraliza los proyectos, el inventario de materiales y el equipo de tu constructora
            en un solo sistema, pensado para obras pequeñas y medianas.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#ffd60a',
              color: '#000',
              border: 'none',
              borderRadius: '999px',
              padding: '15px 34px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Entrar al panel <i className="fas fa-arrow-right"></i>
          </button>
        </section>
      </div>

      <section style={{ backgroundColor: '#f8f9fa', color: '#111', padding: '70px 8%' }}>
        <h2
          style={{
            fontSize: '26px',
            borderLeft: '5px solid #ffd60a',
            paddingLeft: '16px',
            marginBottom: '40px',
          }}
        >
          Qué incluye Titan V
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {caracteristicas.map((c) => (
            <div
              key={c.titulo}
              style={{
                backgroundColor: '#fff',
                borderRadius: '14px',
                padding: '26px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#000',
                  color: '#ffd60a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <i className={`fas ${c.icono}`}></i>
              </div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{c.titulo}</h3>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.5 }}>{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <QuienesSomos />

      {/* SECCIÓN DE DIFERENCIA DE ROLES */}
      <section style={{ backgroundColor: '#0f1115', color: '#fff', padding: '70px 8%', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '45px' }}>
            <span style={{
              color: '#ffd60a',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              Control de Accesos
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 14px' }}>
              Roles y permisos de usuarios
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
              Cada persona que ingresa a Titan V cuenta con herramientas y vistas adaptadas a su nivel de responsabilidad en la obra.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '24px',
          }}>
            {/* Card 1: Administrador / Arquitecto */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 214, 10, 0.35)',
              borderRadius: '16px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 214, 10, 0.15)',
                  color: '#ffd60a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  <i className="fas fa-crown"></i>
                </div>
                <span style={{
                  backgroundColor: 'rgba(255, 214, 10, 0.15)',
                  color: '#ffd60a',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Control Total • Rol 1
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
                Administrador / Arquitecto
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px', lineHeight: 1.5 }}>
                Directores de obra, ingenieros residentes y personal de control constructivo.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', fontSize: '13px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#ffd60a' }}></i> Creación y control total de proyectos
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#ffd60a' }}></i> Invitación por correo con enlaces SMTP
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#ffd60a' }}></i> Asignación y cambio de roles de colaboradores
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#ffd60a' }}></i> Control de inventario, insumos y kardex
                </li>
              </ul>
            </div>

            {/* Card 2: Supervisor / Trabajador */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '16px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  <i className="fas fa-helmet-safety"></i>
                </div>
                <span style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Operativo • Rol 2
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
                Supervisor / Trabajador
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px', lineHeight: 1.5 }}>
                Maestros de obra, encargados de cuadrilla y supervisores técnicos.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', fontSize: '13px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#38bdf8' }}></i> Crear y actualizar tareas y estados
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#38bdf8' }}></i> Registrar turnos y control de asistencia
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#38bdf8' }}></i> Subir evidencias fotográficas de campo
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#38bdf8' }}></i> Registrar entradas y salidas de material
                </li>
              </ul>
            </div>

            {/* Card 3: Operario / Visualizador */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(74, 222, 128, 0.35)',
              borderRadius: '16px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(74, 222, 128, 0.15)',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  <i className="fas fa-eye"></i>
                </div>
                <span style={{
                  backgroundColor: 'rgba(74, 222, 128, 0.15)',
                  color: '#4ade80',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Consulta • Rol 3
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
                Operario / Visualizador
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px', lineHeight: 1.5 }}>
                Clientes contratantes, auditores de obra y personal de consulta.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', fontSize: '13px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#4ade80' }}></i> Ver avance de la obra en tiempo real
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#4ade80' }}></i> Consultar evidencias fotográficas
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#4ade80' }}></i> Consultar disponibilidad de inventario
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-lock" style={{ color: '#94a3b8' }}></i> Solo lectura: datos protegidos contra edición
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '30px 8%', textAlign: 'center', color: '#777', fontSize: '13px' }}>
        © 2026 Titan V — Todos los derechos reservados
      </footer>
      <CookieBanner />
    </div>
  );
};

export default LandingPage;
