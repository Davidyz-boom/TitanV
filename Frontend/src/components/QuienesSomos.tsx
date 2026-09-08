import React from 'react';

interface ElementoLista {
  destacado: string;
  texto: string;
}

interface TarjetaSeccion {
  icono: string;
  titulo: string;
  elementos: ElementoLista[];
}

const contenido: TarjetaSeccion[] = [
  {
    icono: '🎯',
    titulo: 'Objetivos Estratégicos',
    elementos: [
      {
        destacado: 'Liderar la transformación digital',
        texto: 'en la construcción Latinoamericana.',
      },
      {
        destacado: 'Optimizar la eficiencia operativa',
        texto: 'con soluciones en tiempo real.',
      },
      {
        destacado: 'Fomentar la transparencia total',
        texto: 'en la gestión de obras y logística.',
      },
    ],
  },
  {
    icono: '⚙️',
    titulo: 'Forma de Trabajo',
    elementos: [
      {
        destacado: 'Innovación Ágil:',
        texto: 'Soluciones dinámicas para desafíos de campo.',
      },
      {
        destacado: 'Centralización y Datos:',
        texto: 'Registro inteligente y centralizado de información técnica y logística.',
      },
      {
        destacado: 'Colaboración en Tiempo Real:',
        texto: 'Conectando equipos de manera fluida.',
      },
    ],
  },
  {
    icono: '⭐',
    titulo: 'Diferencia de la Competencia',
    elementos: [
      {
        destacado: 'Nuestra Plataforma Integral:',
        texto: 'Integración única de funciones de gestión operativa, logística y de personal en un solo lugar.',
      },
      {
        destacado: 'Enfoque Pyme:',
        texto: 'Diseño optimizado para las necesidades específicas de pequeñas y medianas constructoras.',
      },
      {
        destacado: 'Flexibilidad y Adaptabilidad:',
        texto: 'Una plataforma que evoluciona con el proyecto.',
      },
    ],
  },
];

const QuienesSomos: React.FC = () => {
  return (
    <section
      id="quienes-somos"
      style={{
        backgroundColor: '#0d0d0d',
        color: '#ffffff',
        padding: '80px 8%',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: '28px',
          fontWeight: 700,
          borderLeft: '4px solid #ffd60a',
          paddingLeft: '16px',
          marginBottom: '48px',
          letterSpacing: '-0.5px',
        }}
      >
        Objetivos y Estrategia
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '28px',
        }}
      >
        {contenido.map((card) => (
          <div
            key={card.titulo}
            style={{
              backgroundColor: '#161616',
              border: '1px solid rgba(255, 214, 10, 0.15)',
              borderRadius: '16px',
              padding: '36px 30px',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 214, 10, 0.03)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{card.icono}</span>
              <h3
                style={{
                  color: '#ffd60a',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {card.titulo}
              </h3>
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#cccccc',
                fontSize: '14.5px',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {card.elementos.map((item, index) => (
                <li key={index} style={{ paddingLeft: '4px' }}>
                  <strong style={{ color: '#ffffff', fontWeight: 600 }}>
                    {item.destacado}{' '}
                  </strong>
                  <span>{item.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default QuienesSomos;