import { useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { Login } from '../components/Login';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

const API_URL = 'http://localhost:8000';

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
      const respuesta = await axios.post(`${API_URL}/auth/login`, {
        correo_electronico: correo.trim(),
        contrasena: contrasena,
      });
      localStorage.setItem('token', respuesta.data.token);
      localStorage.setItem('usuario_id', String(respuesta.data.usuario_id));
      localStorage.setItem('usuario_nombre', respuesta.data.nombre || 'Usuario');
      onLoginSuccess();
      navigate('/dashboard');
    } catch (error: any) {
      const detalle = error.response?.data?.detail || 'Credenciales inválidas o el servidor no responde.';
      alert(`⚠️ ${detalle}`);
    }
  };

  // ── GOOGLE OAUTH REAL ────────────────────────────────────────────────────────
  // Abre la ventana emergente ORIGINAL de Google (selector de cuenta).
  // Después de elegir la cuenta, obtiene el perfil del usuario y lo registra
  // o inicia sesión en PostgreSQL automáticamente via /auth/google del backend.
  const iniciarConGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        // Obtener datos reales del perfil de la cuenta de Google seleccionada
        const infoRes = await axios.get<GoogleUserInfo>(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const userInfo = infoRes.data;

        // Registrar o autenticar en PostgreSQL via FastAPI
        const respuesta = await axios.post(`${API_URL}/auth/google`, {
          correo_electronico: userInfo.email,
          nombre_completo: userInfo.name,
          foto_url: userInfo.picture || null,
          credential: tokenResponse.access_token,
        });

        localStorage.setItem('token', respuesta.data.token);
        localStorage.setItem('usuario_id', String(respuesta.data.usuario_id));
        localStorage.setItem('usuario_nombre', respuesta.data.nombre);

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
      onVolver={() => navigate('/')}
    />
  );
};

export default LoginPage;