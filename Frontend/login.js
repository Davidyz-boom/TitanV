import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuración exacta de Firebase para Titan V
const firebaseConfig = {
  apiKey: "AIzaSyAYKRJCgzTzokS6d8dyHEB_E_AQN7dpMv4",
  authDomain: "titanv-d34b9.firebaseapp.com",
  projectId: "titanv-d34b9",
  storageBucket: "titanv-d34b9.firebasestorage.app",
  messagingSenderId: "629091888330",
  appId: "1:629091888330:web:6709ee39004706a5429833",
  measurementId: "G-YR4ZKY41JT"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Función para alternar entre formularios (Login, Registro, Recuperación)
function showForm(id) {
    document.querySelectorAll('.form-box').forEach(box => {
        box.classList.remove('active');
    });
    const elemento = document.getElementById(id);
    if(elemento) elemento.classList.add('active');
}

// Hacer globales las funciones que se llaman desde el HTML mediante onclick
window.showForm = showForm;
window.handleAuth = handleAuth;
window.handleRecover = handleRecover;

// Manejo del formulario de Login tradicional conectado a FastAPI
async function handleAuth(event, target) {
    event.preventDefault();

    if (target === 'main') {
        const form = event.target;
        const btn = form.querySelector('button');
        const textoOriginal = btn.innerHTML;
        
        const correo = form.querySelector('input[type="email"]').value;
        const contrasena = form.querySelector('input[type="password"]').value;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        try {
            const response = await fetch("http://127.0.0.1:8000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    correo_electronico: correo,
                    contrasena: contrasena
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("sesionTitanV", "true");
                localStorage.setItem("token", data.token);
                localStorage.setItem("rol", data.rol);
                localStorage.setItem("usuario_id", data.usuario_id);

                alert(data.mensaje || "¡Inicio de sesión exitoso!");
                window.location.href = 'Dashboard.html';
            } else {
                alert("Error: " + (data.detail || "Credenciales incorrectas"));
                btn.innerHTML = textoOriginal;
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor backend. Asegúrate de que FastAPI esté encendido en http://127.0.0.1:8000");
            btn.innerHTML = textoOriginal;
            btn.style.opacity = '1';
            btn.disabled = false;
        }
        
    } else {
        alert("¡Cuenta creada con éxito! Ya puedes iniciar sesión y empezar a crear proyectos.");
        showForm('loginBox');
    }
}

// Manejo de recuperación de contraseña
function handleRecover(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    alert("Se ha enviado un enlace de recuperación a: " + email);
    showForm('loginBox');
}

// Configurar el evento para el botón de Google
const btnGoogle = document.getElementById("btnGoogle");
if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            localStorage.setItem("sesionTitanV", "true");
            localStorage.setItem("usuario_id", user.uid);
            localStorage.setItem("rol", "usuario");

            alert(`¡Bienvenido de nuevo, ${user.displayName || 'Usuario'}!`);
            window.location.href = 'Dashboard.html';
        } catch (error) {
            console.error("Error detallado en Google Auth:", error.code, error.message);
            alert(`Error de autenticación con Google: ${error.message}`);
        }
    });
}