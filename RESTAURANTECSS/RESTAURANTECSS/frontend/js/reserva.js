/* =========================================================
   ESPERAR A QUE TODA LA PÁGINA CARGUE
   =========================================================
   Este evento se ejecuta cuando el HTML ya está listo.
   Así evitamos errores al buscar elementos que aún no existen.
*/
document.addEventListener("DOMContentLoaded", () => {


/* =========================================================
   OBTENER ELEMENTOS DEL HTML
   =========================================================
   Guardamos en variables los elementos que usaremos
   para poder manipularlos desde JavaScript.
*/

const form = document.getElementById("formReserva");          // Formulario
const mensaje = document.getElementById("mensaje");          // Mensajes
const respuesta = document.getElementById("respuestaBackend"); // Card respuesta
const detalle = document.getElementById("detalleReserva");   // Texto detalle

// Inputs del formulario
const nombre = document.getElementById("nombre");
const telefono = document.getElementById("telefono");
const fecha = document.getElementById("fecha");
const inicio = document.getElementById("inicio");
const final = document.getElementById("final");
const personas = document.getElementById("personas");


/* =========================================================
   DIRECCIÓN DEL BACKEND (API)
   =========================================================
   Aquí se encuentra tu servidor que procesa las reservas.
*/

const API = "http://127.0.0.1:3000/reservas";


/* =========================================================
   CONFIGURAR FECHA: SOLO HASTA 30 DÍAS
   =========================================================
   Limitamos el calendario para que no permitan
   fechas pasadas ni mayores a 30 días.
*/

const hoy = new Date();          // Fecha actual
hoy.setHours(0, 0, 0, 0);        // Quitamos horas para precisión

// Convertimos a formato: yyyy-mm-dd
const minFecha = hoy.toISOString().split("T")[0];

// Creamos fecha máxima (hoy + 30 días)
const maxFecha = new Date(hoy);
maxFecha.setDate(maxFecha.getDate() + 30);

const maxISO = maxFecha.toISOString().split("T")[0];

// Aplicamos límites al input
fecha.min = minFecha;
fecha.max = maxISO;


/* =========================================================
   FUNCIÓN DE VALIDACIÓN GENERAL
   =========================================================
   Revisa que todos los campos estén completos
   y que la fecha no pase los 30 días.
*/

function validar() {

    // Validar campos vacíos
    if (
        !nombre.value ||
        !telefono.value ||
        !fecha.value ||
        !inicio.value ||
        !final.value ||
        !personas.value
    ) {
        mostrarMensaje("Completa todos los campos", "danger");
        return false;
    }


    // Validar fecha máxima
    const fechaElegida = new Date(fecha.value);

    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 30);

    if (fechaElegida > limite) {

        mostrarMensaje("❌ Solo puedes reservar hasta 30 días", "danger");
        return false;
    }

    return true;
}


/* =========================================================
   MOSTRAR MENSAJES EN PANTALLA
   =========================================================
   Muestra alertas Bootstrap según el tipo.
*/

function mostrarMensaje(texto, tipo) {

    mensaje.className = `alert alert-${tipo}`; // danger, info, success...
    mensaje.textContent = texto;              // Texto del mensaje
    mensaje.classList.remove("d-none");       // Mostrar
}


/* =========================================================
   CONSULTAR MESAS DISPONIBLES
   =========================================================
   Envía datos al backend para saber qué mesas
   están libres.
*/

async function obtenerMesas(datos) {

    try {

        const res = await fetch(API + "/disponibles", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)

        });

        return await res.json();

    } catch (error) {

        mostrarMensaje("❌ No conecta con backend", "danger");
        return null;
    }
}


/* =========================================================
   FUNCIÓN PARA CREAR UNA RESERVA
   =========================================================
   Envía los datos al backend para guardarlos.
*/

async function reservar(datos) {

    try {

        const res = await fetch(API + "/crear", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)

        });

        return await res.json();

    } catch (error) {

        mostrarMensaje("❌ Error al reservar", "danger");
        return null;
    }
}


/* =========================================================
   MOSTRAR BOTONES DE MESAS
   =========================================================
   Crea botones dinámicos para que el usuario
   pueda elegir su mesa.
*/

function mostrarMesas(lista, datosBase) {

    const cont = document.createElement("div");
    cont.className = "mt-3";

    cont.innerHTML = "<h5>Elige una mesa:</h5>";

    // Recorremos todas las mesas
    lista.forEach(mesa => {

        const btn = document.createElement("button");

        btn.className = "btn btn-outline-success m-1";
        btn.textContent = "Mesa " + mesa;

        // Evento al hacer clic
        btn.onclick = async () => {

            datosBase.mesa = mesa;

            const r = await reservar(datosBase);

            if (r.ok) {
                mostrarConfirmacion(r);
            }
        };

        cont.appendChild(btn);
    });

    form.appendChild(cont);
}


/* =========================================================
   MOSTRAR CONFIRMACIÓN
   =========================================================
   Muestra los datos cuando la reserva fue exitosa.
*/

function mostrarConfirmacion(data) {

    respuesta.classList.remove("d-none");

    detalle.textContent = `
        Mesa: ${data.mesa}
        | Fecha: ${data.fecha}
        | Hora: ${data.inicio}
    `;

    confetti(); // Animación
}


/* =========================================================
   EVENTO SUBMIT DEL FORMULARIO
   =========================================================
   Controla qué pasa cuando se envía el formulario.
*/

form.addEventListener("submit", async (e) => {

    e.preventDefault(); // Evita recarga

    // Validar datos
    if (!validar()) return;


    // Detectar botón presionado
    const accion = e.submitter.value;


    // Datos a enviar
    const datos = {

        nombre: nombre.value,
        telefono: telefono.value,
        fecha: fecha.value,
        inicio: inicio.value,
        final: final.value,
        personas: personas.value
    };


    mostrarMensaje("Consultando disponibilidad...", "info");


    /* =============================================
       PASO 1: CONSULTAR MESAS
    ============================================= */

    const res = await obtenerMesas(datos);

    if (!res || !res.disponibles.length) {

        mostrarMensaje("❌ No hay mesas libres", "warning");
        return;
    }


    /* =============================================
       PASO 2: RESERVA AL AZAR
    ============================================= */

    if (accion === "azar") {

        const random =
            res.disponibles[
                Math.floor(Math.random() * res.disponibles.length)
            ];

        datos.mesa = random;

        const r = await reservar(datos);

        if (r.ok) {
            mostrarConfirmacion(r);
        }
    }


    /* =============================================
       PASO 3: ELEGIR MESA
    ============================================= */

    if (accion === "elegir") {

        mostrarMensaje("Elige tu mesa 👇", "success");

        mostrarMesas(res.disponibles, datos);
    }

});

});