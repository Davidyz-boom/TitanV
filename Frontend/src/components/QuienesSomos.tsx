const QuienesSomos = () => {
  return (
    <section
      id="quienes-somos"
      style={{ backgroundColor: '#0a0a0a', color: '#fff', padding: '70px 8%' }}
    >
      <h2
        style={{
          fontSize: '26px',
          borderLeft: '5px solid #ffd60a',
          paddingLeft: '16px',
          marginBottom: '40px',
        }}
        >
          ¿Qué ofrecemos?
        </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '14px',
            padding: '40px 32px',
            maxWidth: 900,
          }}
        >
          <h3
            style={{
              color: '#ffd60a',
              fontSize: '18px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Plataforma web para la gestión de proyectos de construcción
          </h3>
          <p
            style={{
              color: '#b0b0b0',
              lineHeight: 1.7,
              fontSize: '14px',
              fontWeight: 300,
              margin: 0,
            }}
          >
            Titan V es una aplicación web que centraliza la información de cada obra: crea proyectos,
            asigna colaboradores con sus roles, controla los materiales y el inventario, registra tareas y turnos,
            guarda evidencias multimedia y lleva el kardex de insumos. Todo esto en un solo lugar, pensado
            para que contratistas y constructoras tengan visibilidad en tiempo real del avance de sus proyectos
            y eviten la dispersión de información entre hojas de cálculo, correos y mensajes.
          </p>
        </div>
      </div>
    </section>
  );
};


export default QuienesSomos;