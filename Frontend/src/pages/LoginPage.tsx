import { useState, useEffect } from 'react';
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

    onLoginSuccess();
    navigate('/dashboard');
  };

  useEffect(() => {
    const win = window as any;

    const renderGoogleButton = () => {
      const buttonElement = document.getElementById('google-login-button');
      if (win.google && buttonElement) {
        win.google.accounts.id.initialize({
          client_id: '629091888330-vdcvhs2acmritgdg0hgnmbi78pjhok5m.apps.googleusercontent.com',
          callback: (response: any) => {
            console.log("Token JWT de Google exitoso:", response.credential);
            
            // Cambia el estado de autenticación a true
            onLoginSuccess();
            
            // Te redirige al panel de control
            navigate('/dashboard');
          },
        });

        win.google.accounts.id.renderButton(
          buttonElement,
          { theme: 'outline', size: 'large', width: '100%' }
        );
      }
    };

    renderGoogleButton();

    const timer = setInterval(() => {
      if (win.google && document.getElementById('google-login-button')?.childElementCount === 0) {
        renderGoogleButton();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [onLoginSuccess, navigate]);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Login
        correo={correo}
        contrasena={contrasena}
        onCorreoChange={handleCorreoChange}
        onContrasenaChange={handleContrasenaChange}
        onEnviar={handleEnviar}
      />
    </div>
  );
};

export default LoginPage;