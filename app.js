// 1. Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC8TnUjhlyhz5VWlkdfiw57-xGX_1_BzcA",
  authDomain: "memorial-quini-elcano.firebaseapp.com",
  projectId: "memorial-quini-elcano",
  storageBucket: "memorial-quini-elcano.firebasestorage.app",
  messagingSenderId: "166426350048",
  appId: "1:166426350048:web:9d9af0e329454a60f3db85"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Documento en Firestore que guarda la jornada ACTIVA que ven todos
const docJornadaActiva = db.collection("jornadas").doc("activa");

// 2. Socios oficiales
const socios = [
  "ALFONSO SANTOS", "FCO. JAVIER SANTOS", "JAVIER Mª DOMINGUEZ",
  "JOAQUIN BARBERO", "JOSE ANTONIO ELENA", "JOSE GONZALEZ",
  "JOSE Mª CARCELAN", "JUAN COSTA", "JUAN RODRIGUEZ",
  "MIGUEL FRADE", "PACO MADRIGAL", "PACO VIDAL"
];

// Estructura por defecto si la base de datos estuviera vacía
let datosJornada = {
  titulo: "JORNADA 8",
  fechas: "(04/11 al 13/11 de 2026)",
  partidos: [
    { id: 1, j1: "MIGUEL FRADE", j2: "PACO VIDAL", fecha: "", hora: "", juez: "", aux: "", resultado: null },
    { id: 2, j1: "JOSE Mª CARCELAN", j2: "JOSE ANTONIO ELENA", fecha: "", hora: "", juez: "", aux: "", resultado: null },
    { id: 3, j1: "FCO. JAVIER SANTOS", j2: "JOAQUIN BARBERO", fecha: "", hora: "", juez: "", aux: "", resultado: null },
    { id: 4, j1: "JUAN RODRIGUEZ", j2: "JOSE GONZALEZ", fecha: "", hora: "", juez: "", aux: "", resultado: null },
    { id: 5, j1: "PACO MADRIGAL", j2: "JUAN COSTA", fecha: "", hora: "", juez: "", aux: "", resultado: null },
    { id: 6, j1: "JAVIER Mª DOMINGUEZ", j2: "ALFONSO SANTOS", fecha: "", hora: "", juez: "", aux: "", resultado: null }
  ]
};

let partidoSeleccionadoId = null;
let rolSeleccionado = null;
const PIN_ADMIN = "1234"; // Puedes cambiar este PIN por el que quieras

const contenedor = document.getElementById("lista-partidos");
const tituloJornada = document.getElementById("titulo-jornada");
const fechasJornada = document.getElementById("fechas-jornada");

// 3. Escuchar Firestore en tiempo real
docJornadaActiva.onSnapshot((doc) => {
  if (doc.exists && doc.data().partidos) {
    datosJornada = doc.data();
    actualizarVista();
  } else {
    docJornadaActiva.set(datosJornada);
    actualizarVista();
  }
});

function sincronizarConNube() {
  docJornadaActiva.set(datosJornada);
}

// 4. Pintar en pantalla
function actualizarVista() {
  tituloJornada.textContent = datosJornada.titulo || "JORNADA";
  fechasJornada.textContent = datosJornada.fechas || "";
  contenedor.innerHTML = "";

  datosJornada.partidos.forEach((p, index) => {
    const textoHorario = (p.fecha && p.hora) 
      ? `📅 ${formatearFecha(p.fecha)} - ${p.hora}` 
      : `📅 + PONER DÍA Y HORA`;
    const claseHorario = (p.fecha && p.hora) ? "btn-horario fijado" : "btn-horario";

    const textoJuez = p.juez ? `👤 Juez: ${p.juez}` : `👤 + JUEZ`;
    const claseJuez = p.juez ? "btn-juez asignado" : "btn-juez";

    const textoAux = p.aux ? `🚩 Aux: ${p.aux}` : `🚩 + AUXILIAR`;
    const claseAux = p.aux ? "btn-juez asignado" : "btn-juez";

    let bloqueActa = "";
    if (p.resultado) {
      bloqueActa = `
        <div class="caja-resultado" onclick="abrirModalActa(${p.id})">
          <div><strong>FINALIZADO</strong> (${p.resultado.minutos} min)</div>
          <div>${p.j1}: <strong>${p.resultado.carJ1}</strong> (${p.resultado.tresBJ1} a 3B)</div>
          <div>${p.j2}: <strong>${p.resultado.carJ2}</strong> (${p.resultado.tresBJ2} a 3B)</div>
        </div>
      `;
    } else {
      bloqueActa = `
        <button class="btn btn-acta" onclick="abrirModalActa(${p.id})">📝 METER ACTA / RESULTADO</button>
      `;
    }

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-partido";
    tarjeta.innerHTML = `
      <div class="partido-titulo">PARTIDO ${index + 1}</div>
      <div class="jugadores">
        <span>${p.j1}</span>
        <span class="vs">VS</span>
        <span>${p.j2}</span>
      </div>
      <button class="btn ${claseHorario}" onclick="abrirModalFecha(${p.id})">${textoHorario}</button>
      <div class="fila-jueces">
        <button class="btn ${claseJuez}" onclick="abrirModalJuez(${p.id}, 'juez')">${textoJuez}</button>
        <button class="btn ${claseAux}" onclick="abrirModalJuez(${p.id}, 'aux')">${textoAux}</button>
      </div>
      ${bloqueActa}
    `;

    contenedor.appendChild(tarjeta);
  });
}

// 5. Asignación de Juez / Auxiliar (con opción de desasignar)
function abrirModalJuez(idPartido, rol) {
  partidoSeleccionadoId = idPartido;
  rolSeleccionado = rol;

  const titulo = document.getElementById("modal-juez-titulo");
  titulo.textContent = rol === "juez" ? "Elegir Juez" : "Elegir Auxiliar";

  const listaSocios = document.getElementById("lista-socios");
  listaSocios.innerHTML = "";

  // Botón para vaciar
  const btnQuitar = document.createElement("button");
  btnQuitar.className = "btn-socio btn-peligro";
  btnQuitar.textContent = "❌ Dejar sin asignar";
  btnQuitar.onclick = () => asignarSocio("");
  listaSocios.appendChild(btnQuitar);

  socios.forEach(nombre => {
    const btn = document.createElement("button");
    btn.className = "btn-socio";
    btn.textContent = nombre;
    btn.onclick = () => asignarSocio(nombre);
    listaSocios.appendChild(btn);
  });

  document.getElementById("modal-juez").classList.remove("oculto");
}

function asignarSocio(nombre) {
  const partido = datosJornada.partidos.find(p => p.id === partidoSeleccionadoId);
  if (partido) {
    if (rolSeleccionado === "juez") partido.juez = nombre;
    if (rolSeleccionado === "aux") partido.aux = nombre;
    sincronizarConNube();
  }
  cerrarModales();
}

// 6. Fecha y Hora (con opción de borrar)
function abrirModalFecha(idPartido) {
  partidoSeleccionadoId = idPartido;
  const partido = datosJornada.partidos.find(p => p.id === idPartido);

  document.getElementById("input-fecha").value = partido.fecha || "";
  document.getElementById("input-hora").value = partido.hora || "";

  document.getElementById("modal-fecha").classList.remove("oculto");
}

function guardarFecha() {
  const fecha = document.getElementById("input-fecha").value;
  const hora = document.getElementById("input-hora").value;

  const partido = datosJornada.partidos.find(p => p.id === partidoSeleccionadoId);
  if (partido) {
    partido.fecha = fecha;
    partido.hora = hora;
    sincronizarConNube();
  }
  cerrarModales();
}

function borrarFecha() {
  const partido = datosJornada.partidos.find(p => p.id === partidoSeleccionadoId);
  if (partido) {
    partido.fecha = "";
    partido.hora = "";
    sincronizarConNube();
  }
  cerrarModales();
}

// 7. Acta (con opción de borrar)
function abrirModalActa(idPartido) {
  partidoSeleccionadoId = idPartido;
  const partido = datosJornada.partidos.find(p => p.id === idPartido);

  document.getElementById("acta-nom-j1").textContent = partido.j1;
  document.getElementById("acta-nom-j2").textContent = partido.j2;

  if (partido.resultado) {
    document.getElementById("acta-car-j1").value = partido.resultado.carJ1;
    document.getElementById("acta-3b-j1").value = partido.resultado.tresBJ1;
    document.getElementById("acta-car-j2").value = partido.resultado.carJ2;
    document.getElementById("acta-3b-j2").value = partido.resultado.tresBJ2;
    document.getElementById("acta-minutos").value = partido.resultado.minutos;
  } else {
    document.getElementById("acta-car-j1").value = "";
    document.getElementById("acta-3b-j1").value = "";
    document.getElementById("acta-car-j2").value = "";
    document.getElementById("acta-3b-j2").value = "";
    document.getElementById("acta-minutos").value = "";
  }

  document.getElementById("modal-acta").classList.remove("oculto");
}

function guardarActa() {
  const carJ1 = document.getElementById("acta-car-j1").value;
  const tresBJ1 = document.getElementById("acta-3b-j1").value || "0";
  const carJ2 = document.getElementById("acta-car-j2").value;
  const tresBJ2 = document.getElementById("acta-3b-j2").value || "0";
  const minutos = document.getElementById("acta-minutos").value || "0";

  if (carJ1 === "" || carJ2 === "") {
    alert("Por favor introduce las carambolas de ambos jugadores.");
    return;
  }

  const partido = datosJornada.partidos.find(p => p.id === partidoSeleccionadoId);
  if (partido) {
    partido.resultado = {
      carJ1: parseInt(carJ1, 10),
      tresBJ1: parseInt(tresBJ1, 10),
      carJ2: parseInt(carJ2, 10),
      tresBJ2: parseInt(tresBJ2, 10),
      minutos: parseInt(minutos, 10)
    };
    sincronizarConNube();
  }
  cerrarModales();
}

function borrarActa() {
  const partido = datosJornada.partidos.find(p => p.id === partidoSeleccionadoId);
  if (partido) {
    partido.resultado = null;
    sincronizarConNube();
  }
  cerrarModales();
}

// 8. Panel de Administrador (Solo tú)
function solicitarPinAdmin() {
  const pin = prompt("Introduce el PIN de Administrador:");
  if (pin === PIN_ADMIN) {
    abrirModalAdmin();
  } else if (pin !== null) {
    alert("PIN incorrecto.");
  }
}

function abrirModalAdmin() {
  document.getElementById("admin-num-jornada").value = datosJornada.titulo;
  document.getElementById("admin-fechas").value = datosJornada.fechas;

  const contenedorEmp = document.getElementById("admin-contenedor-partidos");
  contenedorEmp.innerHTML = "";

  datosJornada.partidos.forEach((p, idx) => {
    const bloque = document.createElement("div");
    bloque.className = "fila-partido-admin";
    bloque.innerHTML = `
      <strong>Partido ${idx + 1}</strong>
      <select id="admin-j1-${idx}">${generarOpcionesSocios(p.j1)}</select>
      <div style="text-align:center; font-size:0.75rem; color:#38bdf8;">VS</div>
      <select id="admin-j2-${idx}">${generarOpcionesSocios(p.j2)}</select>
    `;
    contenedorEmp.appendChild(bloque);
  });

  document.getElementById("modal-admin").classList.remove("oculto");
}

function generarOpcionesSocios(seleccionado) {
  return socios.map(s => `<option value="${s}" ${s === seleccionado ? "selected" : ""}>${s}</option>`).join("");
}

function guardarNuevaJornadaAdmin() {
  const nuevoTitulo = document.getElementById("admin-num-jornada").value.trim();
  const nuevasFechas = document.getElementById("admin-fechas").value.trim();

  // Guardar en histórico antes de sobreescribir (para no perder la que termina)
  const idHistorico = datosJornada.titulo.toLowerCase().replace(/\s+/g, "_");
  db.collection("jornadas_historico").doc(idHistorico).set(datosJornada);

  // Crear la nueva estructura de partidos limpia
  const nuevosPartidos = [];
  for (let i = 0; i < 6; i++) {
    const j1 = document.getElementById(`admin-j1-${i}`).value;
    const j2 = document.getElementById(`admin-j2-${i}`).value;
    nuevosPartidos.push({
      id: i + 1,
      j1: j1,
      j2: j2,
      fecha: "",
      hora: "",
      juez: "",
      aux: "",
      resultado: null
    });
  }

  datosJornada = {
    titulo: nuevoTitulo || "JORNADA",
    fechas: nuevasFechas || "",
    partidos: nuevosPartidos
  };

  sincronizarConNube();
  cerrarModales();
  alert("¡Nueva jornada activada con éxito!");
}

// 9. Descargar en PDF
function descargarPDF() {
  window.print();
}

// 10. Auxiliares
function cerrarModales() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("oculto"));
  partidoSeleccionadoId = null;
  rolSeleccionado = null;
}

function formatearFecha(f) {
  if (!f) return "";
  const partes = f.split("-");
  return `${partes[2]}/${partes[1]}`;
}

// Registro PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}