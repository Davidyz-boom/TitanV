import { useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '../components/Login';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

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

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();

    if (!correo || !contrasena) {
      alert('Por favor ingresa tu correo y contraseña.');
      return;
    }

    // TODO: conectar con el backend real (POST /auth/login) en la próxima clase.
    // Por ahora, cualquier correo/contraseña no vacíos permiten entrar.
    onLoginSuccess();
    navigate('/dashboard');
  };

  return (
    <Login
      correo={correo}
      contrasena={contrasena}
      onCorreoChange={handleCorreoChange}
      onContrasenaChange={handleContrasenaChange}
      onEnviar={handleEnviar}
    />
  );
};

export default LoginPage;