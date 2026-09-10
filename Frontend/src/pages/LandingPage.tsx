import { useNavigate } from 'react-router-dom';
import QuienesSomos from '../components/QuienesSomos';
// IMPORTACIÓN CON EL NOMBRE DE TU VIDEO
import videoFondo from '../assets/video_landing.mp4'; 

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
        <div style={{ fontSize: '22px', fontWeight: 800 }}>
          TITAN <span style={{ color: '#ffd60a' }}>V</span>
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

      <footer style={{ padding: '30px 8%', textAlign: 'center', color: '#777', fontSize: '13px' }}>
        © 2026 Titan V — Todos los derechos reservados
      </footer>
    </div>
  );
};

export default LandingPage;
