const API_URL = "http://127.0.0.1:8000/materiales/";

// --- CONTROL DE ACCESO Y VISTAS ---
document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
});

// Asegúrate de que estas funciones existan y se vean así en tu proyecto.js:

function verificarSesion() {
    const sesionActiva = localStorage.getItem("sesionTitanV") === "true";
    
    const appContent = document.getElementById("app-content");
    const navPrivado = document.getElementById("nav-privado");
    const btnLogin = document.getElementById("btn-menu-login");
    const btnLogout = document.getElementById("btnLogout");
    const btnComenzar = document.getElementById("btn-comenzar");

    if (sesionActiva) {
        // SI ESTÁ LOGUEADO: Desbloquea el panel
        if(appContent) appContent.style.display = "block";
        if(navPrivado) navPrivado.style.display = "inline";
        if(btnLogout) btnLogout.style.display = "inline-block";
        if(btnLogin) btnLogin.style.display = "none";
        
        // Si ya inició sesión, el botón cambia a "Ir al Panel" y lo baja a los proyectos
        if(btnComenzar) {
            btnComenzar.innerHTML = 'Ir al Panel <i class="fas fa-arrow-right"></i>';
            btnComenzar.setAttribute("onclick", "scrollToSection('proyectos')");
        }

        if (typeof cargarMateriales === "function") cargarMateriales();
    } else {
        // SI NO ESTÁ LOGUEADO: Modo visitante oculto
        if(appContent) appContent.style.display = "none";
        if(navPrivado) navPrivado.style.display = "none";
        if(btnLogout) btnLogout.style.display = "none";
        if(btnLogin) btnLogin.style.display = "inline-block";
        
        // Si no está logueado, el botón dice "Empezar ahora" y ejecuta la redirección al login
        if(btnComenzar) {
            btnComenzar.innerHTML = 'Empezar ahora <i class="fas fa-arrow-right"></i>';
            btnComenzar.setAttribute("onclick", "redirigirFlujo()");
        }
    }
}

// Esta es la función clave que activa el botón "Empezar ahora"
function redirigirFlujo() {
    window.location.href = "login.html";
}

function redirigirFlujo() {
    // Si no está logueado, lo manda directo al login
    window.location.href = "login.html";
}

function cerrarSesion(event) {
    event.preventDefault();
    localStorage.removeItem("sesionTitanV");
    alert("Has cerrado sesión correctamente.");
    window.location.href = "proyecto.html";
}

function scrollToSection(id) {
    const elemento = document.getElementById(id);
    if(elemento) {
        elemento.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- TU CÓDIGO ANTERIOR DE MATERIALES (CORS FIX) ---
async function cargarMateriales() {
    try {
        const res = await fetch(API_URL);
        const materiales = await res.json();
        const tbody = document.getElementById("listaMateriales");
        if(!tbody) return;
        
        tbody.innerHTML = "";
        materiales.forEach(mat => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${mat.nombre}</strong></td>
                    <td>${mat.cantidad}</td>
                    <td><span class="unidad-tag">${mat.unidad}</span></td>
                    <td>
                        <button class="btn-delete" onclick="eliminarMaterial(${mat.id})">
                            <i class="fas fa-trash"></i>
                        </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error cargando materiales del backend:", error);
    }
}

// Agregar el evento al formulario si existe en pantalla
const formMaterial = document.getElementById("formMaterial");
if(formMaterial) {
    formMaterial.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nuevoMaterial = {
            nombre: document.getElementById("matNombre").value,
            cantidad: parseInt(document.getElementById("matCantidad").value),
            unidad: document.getElementById("matUnidad").value
        };

        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoMaterial)
        });

        formMaterial.reset();
        cargarMateriales();
    });
}

async function eliminarMaterial(id) {
    if(confirm("¿Deseas eliminar este material del stock?")) {
        await fetch(`${API_URL}${id}`, { method: "DELETE" });
        cargarMateriales();
    }
}