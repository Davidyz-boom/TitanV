import { useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { Login } from '../components/Login';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleCorreoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorreo(e.target.value);
  };

  const handleContrasenaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContrasena(e.target.value);
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !contrasena) {
      alert('Por favor ingresa tu correo y contraseña.');
      return;
    }
    try {
      const respuesta = await axios.post(`${API_URL}/api/auth/login`, {
        correo_electronico: correo.trim(),
        contrasena: contrasena,
      });
      localStorage.setItem('token', respuesta.data.token);
      localStorage.setItem('usuario_id', String(respuesta.data.usuario_id));
      localStorage.setItem('usuario_nombre', respuesta.data.nombre || 'Usuario');
      localStorage.setItem('rol', String(respuesta.data.rol));
      onLoginSuccess();
      navigate('/dashboard');
    } catch (error: any) {
      const detalle = error.response?.data?.detail || 'Credenciales inválidas o el servidor no responde.';
      alert(`⚠️ ${detalle}`);
    }
  };

  // ── GOOGLE OAUTH REAL ────────────────────────────────────────────────────────
  // Abre la ventana emergente ORIGINAL de Google (selector de cuenta).
  // El access_token obtenido se envía al backend, que lo vuelve a verificar
  // contra Google server-side y toma de ahí el correo/nombre verificados.
  // No se llama a googleapis userinfo desde el navegador: ese request
  // cross-origin falla por CORS y produciría "Network Error".
  const iniciarConGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        const respuesta = await axios.post(`${API_URL}/api/auth/google`, {
          credential: tokenResponse.access_token,
        });

        localStorage.setItem('token', respuesta.data.token);
        localStorage.setItem('usuario_id', String(respuesta.data.usuario_id));
        localStorage.setItem('usuario_nombre', respuesta.data.nombre);
        localStorage.setItem('rol', String(respuesta.data.rol));

        onLoginSuccess();
        navigate('/dashboard');
      } catch (error: any) {
        const detalle = error.response?.data?.detail || error.message || 'Error al autenticar con Google.';
        alert(`⚠️ No se pudo iniciar con Google: ${detalle}`);
      }
    },
    onError: () => {
      alert('⚠️ No se pudo abrir la ventana de Google. Revisa tu conexión a internet.');
    },
  });
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <Login
      correo={correo}
      contrasena={contrasena}
      onCorreoChange={handleCorreoChange}
      onContrasenaChange={handleContrasenaChange}
      onEnviar={handleEnviar}
      onGoogleLogin={() => iniciarConGoogle()}
      onVolverPrincipal={() => navigate('/')}
    />
  );
};

export default LoginPage;
