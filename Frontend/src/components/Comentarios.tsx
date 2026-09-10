import React, { useState, useEffect } from 'react';
import axios from 'axios';

export interface Comentario {
  id: number;
  tarea_id?: number;
  usuario_id: number;
  contenido: string;
  fecha_comentario: string;
}

interface ComentariosProps {
  tareaId: number;
  tareaNombre?: string;
  onCerrar?: () => void;
}

const API_URL = 'http://localhost:8000';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
});

const Comentarios: React.FC<ComentariosProps> = ({ tareaId, tareaNombre, onCerrar }) => {
  const [listaComentarios, setListaComentarios] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [contenido, setContenido] = useState<string>('');
  const [usuarioId, setUsuarioId] = useState<number>(1);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    if (tareaId) {
      obtenerComentarios();
    }
  }, [tareaId]);

  const obtenerComentarios = async () => {
    try {
      setCargando(true);
      setMensajeError(null);
      const respuesta = await axios.get<Comentario[]>(`${API_URL}/tareas/${tareaId}/comentarios`);
      setListaComentarios(respuesta.data);
    } catch (error) {
      console.error('Error al obtener los comentarios:', error);
      setMensajeError('No se pudieron cargar los comentarios de esta tarea.');
    } finally {
      setCargando(false);
    }
  };

  const manejarEnvioComentario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contenido.trim()) return;

    if (contenido.length > 300) {
      alert('El comentario no puede superar los 300 caracteres (regla TV-CMT-06).');
      return;
    }

    try {
      setEnviando(true);
      setMensajeError(null);
      // El backend recibe usuario_id como query param y el contenido en el cuerpo del request
      const respuesta = await axios.post<Comentario>(
        `${API_URL}/tareas/${tareaId}/comentarios?usuario_id=${usuarioId}`,
        {
          contenido: contenido.trim(),
          tarea_id: tareaId,
        },
        authHeaders()
      );

      setListaComentarios((prev) => [...prev, respuesta.data]);
      setContenido('');
    } catch (error: any) {
      console.error('Error al guardar el comentario:', error);
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        setMensajeError('⚠️ Error de Red: No se pudo conectar con el backend (http://localhost:8000). Revisa que uvicorn esté corriendo.');
      } else {
        const detalle = error.response?.data?.detail || error.message || 'Ocurrió un error al registrar el comentario en la base de datos.';
        setMensajeError(detalle);
      }
    } finally {
      setEnviando(false);
    }
  };

  const manejarEliminarComentario = async (idComentario: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) return;

    try {
      // Endpoint según tarea_router.py: DELETE /tareas/comentarios/{comentario_id}
      await axios.delete(`${API_URL}/tareas/comentarios/${idComentario}`, authHeaders());
      setListaComentarios((prev) => prev.filter((c) => c.id !== idComentario));
    } catch (error) {
      console.error('Error al eliminar el comentario:', error);
      alert('No se pudo eliminar el comentario.');
    }
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(16, 21, 31, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255, 214, 10, 0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: '#ffd60a',
                color: '#000',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              TAREA #{tareaId}
            </span>
            <h2 style={{ color: '#ffffff', margin: 0, fontSize: '18px' }}>Comentarios</h2>
          </div>
          {tareaNombre && (
            <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0, fontWeight: 500 }}>
              {tareaNombre}
            </p>
          )}
        </div>
        {onCerrar && (
          <button
            onClick={onCerrar}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '13px',
              color: '#cbd5e1',
              fontWeight: 'bold',
            }}
            title="Cerrar panel de comentarios"
          >
            ✕ Cerrar
          </button>
        )}
      </div>

      {mensajeError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '14px',
          }}
        >
          {mensajeError}
        </div>
      )}

      {/* Formulario de creación de comentario */}
      <form
        onSubmit={manejarEnvioComentario}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'rgba(10, 13, 20, 0.75)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ color: '#ffd60a', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
            Publicar como Usuario ID:
          </label>
          <input
            type="number"
            min="1"
            value={usuarioId}
            onChange={(e) => setUsuarioId(Number(e.target.value) || 1)}
            style={{
              width: '80px',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(5, 8, 14, 0.9)',
              color: '#ffffff',
              fontSize: '13px',
              textAlign: 'center',
            }}
            required
          />
        </div>

        <div>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            required
            maxLength={300}
            placeholder="Escribe tu comentario o nota técnica aquí (máx. 300 caracteres)..."
            rows={3}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(5, 8, 14, 0.9)',
              color: '#ffffff',
              resize: 'vertical',
              fontSize: '13px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
              fontSize: '11px',
              color: contenido.length > 280 ? '#f87171' : '#94a3b8',
            }}
          >
            <span>TV-CMT-06: Máximo 300 caracteres</span>
            <span>{contenido.length} / 300</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando || !contenido.trim()}
          style={{
            backgroundColor: enviando || !contenido.trim() ? '#64748b' : '#ffd60a',
            color: '#000000',
            border: 'none',
            borderRadius: '6px',
            padding: '10px',
            cursor: enviando || !contenido.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(255, 214, 10, 0.2)',
            transition: 'background-color 0.2s',
          }}
        >
          {enviando ? 'Guardando...' : '➕ Publicar Comentario'}
        </button>
      </form>

      {/* Historial de Comentarios */}
      <h3 style={{ color: '#ffd60a', fontSize: '15px', margin: '0 0 12px 0', fontWeight: 800 }}>
        Historial de Comentarios ({listaComentarios.length})
      </h3>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
          Cargando comentarios desde la base de datos...
        </div>
      ) : listaComentarios.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            fontSize: '13px',
          }}
        >
          No hay comentarios aún para esta tarea. Sé el primero en comentar.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '380px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {listaComentarios.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '12px',
                backgroundColor: 'rgba(20, 26, 38, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#ffd60a',
                      backgroundColor: 'rgba(255, 214, 10, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 214, 10, 0.3)',
                    }}
                  >
                    Usuario #{c.usuario_id}
                  </span>
                  {c.fecha_comentario && (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {formatearFecha(c.fecha_comentario)}
                    </span>
                  )}
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {c.contenido}
                </p>
              </div>

              <button
                onClick={() => manejarEliminarComentario(c.id)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
                title="Eliminar comentario"
              >
                🗑 Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comentarios;