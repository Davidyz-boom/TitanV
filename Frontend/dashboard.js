const URL_PROYECTOS = "http://127.0.0.1:8000/proyectos/";
const URL_MATERIALES = "http://127.0.0.1:8000/materiales/";

// Intercambiar entre pestañas del menú lateral sin recargar
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu a').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('active');
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProyectos();
    cargarMateriales();
});

// =====================================================================
// LÓGICA DEL CRUD DE PROYECTOS
// =====================================================================
async function cargarProyectos() {
    try {
        const res = await fetch(URL_PROYECTOS);
        const proyectos = await res.json();
        const contenedor = document.getElementById("listaProyectos");
        if (!contenedor) return;

        contenedor.innerHTML = "";
        if (proyectos.length === 0) {
            contenedor.innerHTML = '<p class="empty-msg">No hay obras registradas en PostgreSQL.</p>';
            return;
        }

        proyectos.forEach(proy => {
            contenedor.innerHTML += `
                <div class="card" style="margin-bottom: 15px; border-left: 5px solid #ffd60a; background: #fff;" id="proy-card-${proy.id}">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px;">
                        <div>
                            <h4 style="margin: 0; font-size: 16px; color: #000;">${proy.nombre}</h4>
                            <p style="margin: 5px 0 0 0; font-size: 13px; color: #2ed573; font-weight: 600;">Presupuesto: $${proy.presupuesto.toLocaleString()} COP</p>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #777;">Duración: ${proy.fecha_inicio} a ${proy.fecha_fin}</p>
                        </div>
                        <button onclick="eliminarProyecto(${proy.id})" class="btn-delete" style="background: #ff4757; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) { console.error("Error cargando proyectos:", err); }
}

document.getElementById("formProyecto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevoProy = {
        nombre: document.getElementById("proyNombre").value,
        presupuesto: parseFloat(document.getElementById("proyPresupuesto").value),
        fecha_inicio: document.getElementById("proyFechaInicio").value,
        fecha_fin: document.getElementById("proyFechaFin").value
    };

    const res = await fetch(URL_PROYECTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProy)
    });

    if (res.ok) {
        document.getElementById("formProyecto").reset();
        cargarProyectos();
    }
});

async function eliminarProyecto(id) {
    if (confirm("¿Seguro que deseas eliminar esta obra y cerrar su registro?")) {
        await fetch(`${URL_PROYECTOS}${id}`, { method: "DELETE" });
        cargarProyectos();
    }
}

// =====================================================================
// LÓGICA DEL CRUD DE MATERIALES
// =====================================================================
async function cargarMateriales() {
    try {
        const res = await fetch(URL_MATERIALES);
        const materiales = await res.json();
        const tbody = document.getElementById("listaMateriales");
        if (!tbody) return;

        tbody.innerHTML = "";
        materiales.forEach(mat => {
            tbody.innerHTML += `
                <tr>
                    <td>#${mat.id}</td>
                    <td><strong>${mat.nombre}</strong></td>
                    <td style="color: #ffc300; font-weight: 700;">${mat.cantidad_disponible}</td>
                    <td>${mat.unidad_medida}</td>
                    <td style="color: #2ed573;">$${mat.precio_unitario.toLocaleString()}</td>
                    <td><button onclick="eliminarMaterial(${mat.id})" class="btn-delete" style="background:#ff4757; border:none; color:white; padding:5px 10px; border-radius:4px;"><i class="fas fa-trash"></i></button></td>
                </tr>
            `;
        });
    } catch (err) { console.error("Error cargando materiales:", err); }
}

document.getElementById("formMaterial").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevoMat = {
        nombre: document.getElementById("matNombre").value,
        categoria: "Insumos Globales",
        cantidad_disponible: parseFloat(document.getElementById("matCantidad").value),
        unidad_medida: document.getElementById("matUnidad").value,
        precio_unitario: parseFloat(document.getElementById("matPrecio").value),
        obra_id: 1
    };

    await fetch(URL_MATERIALES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoMat)
    });
    document.getElementById("formMaterial").reset();
    cargarMateriales();
});

async function eliminarMaterial(id) {
    if (confirm("¿Eliminar este material?")) {
        await fetch(`${URL_MATERIALES}${id}`, { method: "DELETE" });
        cargarMateriales();
    }
}

function logout() {
    localStorage.removeItem("sesionTitanV");
    window.location.href = "proyecto.html";
}