"""
TITAN V - Sistema de Gestión de Obra
Módulo de Vistas Renderizadas en Python (FastAPI HTMLResponse)

Este archivo contiene la lógica en Python que genera la interfaz visual de autenticación
(Login, Registro y Google OAuth) del sistema Titan V directamente desde el servidor backend.
"""

from fastapi.responses import HTMLResponse

GOOGLE_CLIENT_ID = "629091888330-vdcvhs2acmritgdg0hgnmbi78pjhok5m.apps.googleusercontent.com"


def obtener_pagina_login_html() -> HTMLResponse:
    """
    Genera el HTML, CSS y JavaScript dinámico en código Python para servir la interfaz
    de autenticación directamente desde FastAPI en la ruta /login y /registro.
    """
    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Titan V — Autenticación en Python</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }}

        body {{
            min-height: 100vh;
            background: radial-gradient(circle at 50% 20%, #1e1e1e 0%, #0d0e12 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            padding: 20px;
        }}

        .auth-container {{
            width: 100%;
            max-width: 440px;
            background: rgba(26, 29, 36, 0.94);
            border: 1px solid rgba(255, 214, 10, 0.25);
            border-radius: 20px;
            padding: 38px 32px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 214, 10, 0.12);
            backdrop-filter: blur(14px);
            position: relative;
        }}

        .brand-header {{
            text-align: center;
            margin-bottom: 26px;
        }}

        .brand-badge {{
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 214, 10, 0.08);
            border: 1px solid rgba(255, 214, 10, 0.4);
            padding: 6px 16px;
            border-radius: 30px;
            margin-bottom: 12px;
        }}

        .brand-badge span {{
            font-size: 13px;
            font-weight: 700;
            color: #ffd60a;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }}

        .brand-title {{
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #ffffff;
        }}

        .brand-title span {{
            color: #ffd60a;
        }}

        .brand-subtitle {{
            font-size: 13px;
            color: #94a3b8;
            margin-top: 6px;
        }}

        .tabs-container {{
            display: flex;
            background: rgba(15, 23, 42, 0.75);
            border-radius: 12px;
            padding: 4px;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }}

        .tab-btn {{
            flex: 1;
            padding: 10px 14px;
            border: none;
            background: transparent;
            color: #94a3b8;
            font-size: 13px;
            font-weight: 600;
            border-radius: 9px;
            cursor: pointer;
            transition: all 0.25s ease;
        }}

        .tab-btn.active {{
            background: #ffd60a;
            color: #0f172a;
            font-weight: 700;
            box-shadow: 0 2px 10px rgba(255, 214, 10, 0.35);
        }}

        .form-group {{
            margin-bottom: 16px;
            text-align: left;
        }}

        .form-label {{
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #cbd5e1;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .form-input {{
            width: 100%;
            padding: 12px 16px;
            background: rgba(15, 23, 42, 0.65);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            color: #ffffff;
            font-size: 14px;
            outline: none;
            transition: all 0.2s ease;
        }}

        .form-input:focus {{
            border-color: #ffd60a;
            background: rgba(15, 23, 42, 0.95);
            box-shadow: 0 0 0 3px rgba(255, 214, 10, 0.2);
        }}

        .form-row {{
            display: flex;
            gap: 12px;
        }}

        .btn-submit {{
            width: 100%;
            padding: 13px;
            background: linear-gradient(135deg, #ffd60a 0%, #eab308 100%);
            border: none;
            border-radius: 10px;
            color: #0f172a;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.25s ease;
            margin-top: 8px;
            box-shadow: 0 4px 15px rgba(255, 214, 10, 0.3);
        }}

        .btn-submit:hover {{
            background: linear-gradient(135deg, #ffe033 0%, #ca8a04 100%);
            transform: translateY(-1px);
        }}

        .divider {{
            display: flex;
            align-items: center;
            margin: 22px 0 18px 0;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}

        .divider::before, .divider::after {{
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
        }}

        .divider span {{
            padding: 0 12px;
        }}

        .google-btn-wrapper {{
            display: flex;
            justify-content: center;
            width: 100%;
        }}

        .alert-box {{
            padding: 12px 16px;
            border-radius: 9px;
            font-size: 13px;
            margin-bottom: 18px;
            display: none;
        }}

        .alert-error {{
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.5);
            color: #fca5a5;
        }}

        .alert-success {{
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.5);
            color: #86efac;
        }}

        .footer-note {{
            text-align: center;
            font-size: 11px;
            color: #64748b;
            margin-top: 24px;
        }}
    </style>
</head>
<body>

<div class="auth-container">
    <div class="brand-header">
        <div class="brand-badge">
            <span>Servidor Python / FastAPI</span>
        </div>
        <h1 class="brand-title">TITAN <span>V</span></h1>
        <p class="brand-subtitle">Gestión Integral de Proyectos y Control de Obra</p>
    </div>

    <div class="tabs-container">
        <button class="tab-btn active" id="tab-login-btn" onclick="cambiarTab('login')">Iniciar Sesión</button>
        <button class="tab-btn" id="tab-registro-btn" onclick="cambiarTab('registro')">Crear Cuenta</button>
    </div>

    <div id="alert-box" class="alert-box"></div>

    <!-- FORMULARIO LOGIN -->
    <form id="form-login" onsubmit="ejecutarLogin(event)">
        <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" id="login-correo" class="form-input" placeholder="ejemplo@titanv.com" required>
        </div>
        <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" id="login-contrasena" class="form-input" placeholder="••••••••" required>
        </div>
        <button type="submit" class="btn-submit" id="btn-login-submit">Ingresar al Sistema</button>
    </form>

    <!-- FORMULARIO REGISTRO -->
    <form id="form-registro" style="display: none;" onsubmit="ejecutarRegistro(event)">
        <div class="form-row">
            <div class="form-group" style="flex: 1;">
                <label class="form-label">Nombre <span style="color: #ffd60a; font-size: 10px;">* (Obligatorio)</span></label>
                <input type="text" id="reg-nombre" class="form-input" placeholder="Carlos" required>
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="form-label">Apellido <span style="color: #ffd60a; font-size: 10px;">* (Obligatorio)</span></label>
                <input type="text" id="reg-apellido" class="form-input" placeholder="Mendoza" required>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Correo Electrónico <span style="color: #ffd60a; font-size: 10px;">* (Obligatorio)</span></label>
            <input type="email" id="reg-correo" class="form-input" placeholder="operario@obra.com" required>
        </div>
        <div class="form-group">
            <label class="form-label">Contraseña <span style="color: #ffd60a; font-size: 10px;">* (Obligatorio - Letras y Números/Símbolos)</span></label>
            <input type="password" id="reg-contrasena" class="form-input" placeholder="Min. 8 caracteres (letras y núm/símbolo)" minlength="8" required>
            <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 4px;">Debe tener al menos 8 caracteres, letras y un número o símbolo (@$!%*#?&)</span>
        </div>
        <button type="submit" class="btn-submit" id="btn-reg-submit">Registrar Usuario</button>
    </form>

    <div class="divider">
        <span>O también con</span>
    </div>

    <!-- BOTON GOOGLE REAL -->
    <div class="google-btn-wrapper">
        <div id="g_id_onload"
             data-client_id="{GOOGLE_CLIENT_ID}"
             data-context="signin"
             data-ux_mode="popup"
             data-callback="manejarRespuestaGoogle"
             data-auto_prompt="false">
        </div>
        <div class="g_id_signin"
             data-type="standard"
             data-shape="rectangular"
             data-theme="outline"
             data-text="signin_with"
             data-size="large"
             data-logo_alignment="left">
        </div>
    </div>

    <p class="footer-note">
        Titan V &bull; Desarrollado con FastAPI y PostgreSQL &bull; ADSO SENA
    </p>
</div>

<script>
function cambiarTab(tab) {{
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-registro');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegBtn = document.getElementById('tab-registro-btn');
    const alertBox = document.getElementById('alert-box');
    alertBox.style.display = 'none';

    if (tab === 'login') {{
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        tabLoginBtn.classList.add('active');
        tabRegBtn.classList.remove('active');
    }} else {{
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        tabLoginBtn.classList.remove('active');
        tabRegBtn.classList.add('active');
    }}
}}

function mostrarAlerta(mensaje, esExito) {{
    const alertBox = document.getElementById('alert-box');
    alertBox.innerText = mensaje;
    alertBox.className = 'alert-box ' + (esExito ? 'alert-success' : 'alert-error');
    alertBox.style.display = 'block';
}}

async function ejecutarLogin(e) {{
    e.preventDefault();
    const correo = document.getElementById('login-correo').value.trim();
    const contrasena = document.getElementById('login-contrasena').value;
    const btn = document.getElementById('btn-login-submit');

    try {{
        btn.disabled = true;
        btn.innerText = 'Verificando en PostgreSQL...';

        const res = await fetch('/auth/login', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ correo_electronico: correo, contrasena: contrasena }})
        }});

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Credenciales inválidas');

        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario_id', data.usuario_id);
        localStorage.setItem('usuario_nombre', data.nombre);
        localStorage.setItem('usuario_rol', data.rol);

        mostrarAlerta(`¡Bienvenido, ${{data.nombre}}! Redirigiendo al panel...`, true);
        setTimeout(() => {{
            window.location.href = 'http://localhost:5173/dashboard';
        }}, 1200);
    }} catch (err) {{
        mostrarAlerta(err.message, false);
    }} finally {{
        btn.disabled = false;
        btn.innerText = 'Ingresar al Sistema';
    }}
}}

async function ejecutarRegistro(e) {{
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre').value.trim();
    const apellido = document.getElementById('reg-apellido').value.trim();
    const correo = document.getElementById('reg-correo').value.trim();
    const contrasena = document.getElementById('reg-contrasena').value;
    const btn = document.getElementById('btn-reg-submit');

    const tieneLetras = /[a-zA-Z]/.test(contrasena);
    const tieneNumOSimbolo = /\d|[^a-zA-Z\s]/.test(contrasena);

    if (contrasena.length < 8 || !tieneLetras || !tieneNumOSimbolo) {{
        mostrarAlerta('La contraseña debe tener al menos 8 caracteres, e incluir letras y al menos un número o símbolo (@$!%*#?&).', false);
        return;
    }}

    try {{
        btn.disabled = true;
        btn.innerText = 'Guardando usuario en Python...';

        const res = await fetch('/auth/registro', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{
                nombre_completo: `${{nombre}} ${{apellido}}`.trim(),
                correo_electronico: correo,
                contrasena: contrasena,
                rol: 3
            }})
        }});

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al registrar');

        mostrarAlerta(`✅ Registro completado exitosamente para ${{data.nombre_completo}}. Ya puedes iniciar sesión.`, true);
        setTimeout(() => {{
            cambiarTab('login');
            document.getElementById('login-correo').value = correo;
        }}, 1800);
    }} catch (err) {{
        mostrarAlerta(err.message, false);
    }} finally {{
        btn.disabled = false;
        btn.innerText = 'Registrar Usuario';
    }}
}}

async function manejarRespuestaGoogle(response) {{
    try {{
        mostrarAlerta('Autenticando con Google en el backend Python...', true);
        const res = await fetch('/auth/google', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ credential: response.credential }})
        }});

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al validar con Google');

        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario_id', data.usuario_id);
        localStorage.setItem('usuario_nombre', data.nombre);
        localStorage.setItem('usuario_rol', data.rol);

        mostrarAlerta(`¡Bienvenido via Google, ${{data.nombre}}!`, true);
        setTimeout(() => {{
            window.location.href = 'http://localhost:5173/dashboard';
        }}, 1200);
    }} catch (err) {{
        mostrarAlerta(err.message, false);
    }}
}}
</script>

</body>
</html>
"""
    return HTMLResponse(content=html_content, status_code=200)
