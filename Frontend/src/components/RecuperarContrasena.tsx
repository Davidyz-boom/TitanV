import React, { useState, useRef } from 'react';

interface RecuperarContrasenaProps {
  onClose: () => void;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

const validarFormatoContrasena = (pwd: string): string | null => {
  if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(pwd)) return 'La contraseña debe tener al menos una letra mayúscula.';
  if (!/[0-9]/.test(pwd)) return 'La contraseña debe tener al menos un número.';
  return null;
};

const RecuperarContrasena: React.FC<RecuperarContrasenaProps> = ({ onClose }) => {
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(() => {
    const saved = sessionStorage.getItem('titanv_reset_step');
    return saved === '2' || saved === '3' ? (Number(saved) as 2 | 3) : 1;
  });
  const [resetEmail, setResetEmail] = useState(() => sessionStorage.getItem('titanv_reset_email') || '');
  const [pinArray, setPinArray] = useState<string[]>(['', '', '', '']);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinBoxChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newPin = [...pinArray];
      newPin[index] = value;
      setPinArray(newPin);

      if (value && index < 3) {
        pinInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleClose = () => {
    setResetStep(1);
    setResetEmail('');
    setPinArray(['', '', '', '']);
    setNewPassword('');
    setResetMessage('');
    setIsSubmitting(false);
    sessionStorage.removeItem('titanv_reset_step');
    sessionStorage.removeItem('titanv_reset_email');
    onClose();
  };

  const handleCambiarCorreo = () => {
    setResetStep(1);
    setPinArray(['', '', '', '']);
    setResetMessage('');
    sessionStorage.removeItem('titanv_reset_step');
  };

  // PASO 1: Solicitar código PIN al correo
  const handleRequestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResetMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        setResetStep(2);
        sessionStorage.setItem('titanv_reset_step', '2');
        sessionStorage.setItem('titanv_reset_email', resetEmail.trim());
        setResetMessage(data.message || 'Código PIN enviado. Revisa tu correo.');
      } else {
        setResetMessage(data.detail || data.message || 'Ocurrió un error al enviar el código.');
      }
    } catch (error) {
      setResetMessage('Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PASO 2: Verificar PIN de recuperación
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinArray.join('');

    if (pin.length < 4) {
      setResetMessage('Por favor ingresa los 4 dígitos completos.');
      return;
    }

    setIsSubmitting(true);
    setResetMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), pin }),
      });

      const data = await response.json();
      if (response.ok) {
        setResetStep(3);
        sessionStorage.setItem('titanv_reset_step', '3');
        setResetMessage(data.message || 'PIN verificado correctamente. Ingresa tu nueva contraseña.');
      } else {
        setResetMessage(data.detail || data.message || 'Código PIN incorrecto o expirado.');
      }
    } catch (error) {
      setResetMessage('Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PASO 3: Restablecer contraseña con el PIN
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorContrasena = validarFormatoContrasena(newPassword);
    if (errorContrasena) {
      setResetMessage(errorContrasena);
      return;
    }

    setIsSubmitting(true);
    setResetMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          pin: pinArray.join(''),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        sessionStorage.removeItem('titanv_reset_step');
        sessionStorage.removeItem('titanv_reset_email');
        alert('✅ ¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.');
        handleClose();
      } else {
        setResetMessage(data.detail || data.message || 'Error al actualizar la contraseña.');
      }
    } catch (error) {
      setResetMessage('Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    }}>
      <div style={{
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #333',
        borderRadius: '14px',
        padding: '24px',
        width: '320px',
        textAlign: 'left',
        color: '#fff',
        boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(255, 204, 0, 0.15)'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>
          Restablecer Contraseña
        </h3>

        {/* PASO 1: SOLICITAR PIN */}
        {resetStep === 1 && (
          <form onSubmit={handleRequestPin}>
            <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
              Ingresa tu correo para recibir un código PIN de verificación.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: '#1e1e1e',
                  color: '#fff',
                  boxSizing: 'border-box',
                  fontSize: '13px'
                }}
              />
            </div>

            {resetMessage && (
              <p style={{ fontSize: '12px', color: '#ffcc00', marginBottom: '12px' }}>
                {resetMessage}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#333',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ffcc00',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '12px',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar PIN'}
              </button>
            </div>
          </form>
        )}

        {/* PASO 2: VERIFICAR PIN */}
        {resetStep === 2 && (
          <form onSubmit={handleVerifyPin}>
            <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
              Hemos enviado un PIN de 4 dígitos a <strong>{resetEmail}</strong>.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '14px'
            }}>
              {pinArray.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { pinInputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinBoxChange(e.target.value, index)}
                  onKeyDown={(e) => handlePinKeyDown(e, index)}
                  style={{
                    width: '42px',
                    height: '42px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 600,
                    backgroundColor: '#181a20',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ffcc00';
                    e.target.style.boxShadow = '0 0 0 1px #ffcc00';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#555';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>

            {resetMessage && (
              <p style={{ fontSize: '12px', color: '#ffcc00', marginBottom: '12px' }}>
                {resetMessage}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleCambiarCorreo}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Cambiar correo
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#ffcc00',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  {isSubmitting ? 'Verificando...' : 'Verificar PIN'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* PASO 3: INGRESAR NUEVA CONTRASEÑA */}
        {resetStep === 3 && (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
              Ingresa tu nueva contraseña para completar la recuperación.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <input
                type="password"
                required
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: '#1e1e1e',
                  color: '#fff',
                  boxSizing: 'border-box',
                  fontSize: '13px'
                }}
              />
            </div>

            {resetMessage && (
              <p style={{ fontSize: '12px', color: '#ffcc00', marginBottom: '12px' }}>
                {resetMessage}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#333',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ffcc00',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '12px',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default RecuperarContrasena;