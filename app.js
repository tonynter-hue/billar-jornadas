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
const docJornada = db.collection("jornadas").doc("jornada_8");

// 2. Socios y estructura inicial de la jornada
const socios = [
  "ALFONSO SANTOS", "FCO. JAVIER SANTOS", "JAVIER Mª DOMINGUEZ",
  "JOAQUIN BARBERO", "JOSE ANTONIO ELENA", "JOSE GONZALEZ",
  "JOSE Mª CARCELAN", "JUAN COSTA", "JUAN RODRIGUEZ",
  "MIGUEL FRADE", "PACO MADRIGAL", "PACO VIDAL"
];

let partidos = [
  { id: 1, j1: "MIGUEL FRADE", j2: "PACO VIDAL", fecha: "", hora: "", juez: "", aux: "", resultado: null },
  { id: 2, j1: "JOSE Mª CARCELAN", j2: "JOSE ANTONIO ELENA", fecha: "", hora: "", juez: "", aux: "", resultado: null },
  { id: 3, j1: "FCO. JAVIER SANTOS", j2: "JOAQUIN BARBERO", fecha: "", hora: "", juez: "", aux: "", resultado: null },
  { id: 4, j1: "JUAN RODRIGUEZ", j2: "JOSE GONZALEZ", fecha: "", hora: "", juez: "", aux: "", resultado: null },
  { id: 5, j1: "PACO MADRIGAL", j2: "JUAN COSTA", fecha: "", hora: "", juez: "", aux: "", resultado: null },
  { id: 6, j1: "JAVIER Mª DOMINGUEZ", j2: "ALFONSO SANTOS", fecha: "", hora: "", juez: "", aux: "", resultado: null }
];

let partidoSeleccionadoId = null;
let rolSeleccionado = null;
const contenedor = document.getElementById("lista-partidos");

// 3. Escuchar cambios en la nube en tiempo real
docJornada.onSnapshot((doc) => {
  if (doc.exists && doc.data().partidos) {
    partidos = doc.data().partidos;
    pintarPartidos();
  } else {
    // Si la jornada no existe aún en Firestore, se sube la plantilla base
    docJornada.set({ partidos: partidos });
    pintarPartidos();
  }
});

// 4. Guardar datos en Firestore
function sincronizarConNube() {
  docJornada.set({ partidos: partidos });
}

// 5. Renderizado de tarjetas
function pintarPartidos() {
  contenedor.innerHTML = "";

  partidos.forEach((p, index) => {
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

// 6. Asignación de Juez / Auxiliar
function abrirModalJuez(idPartido, rol) {
  partidoSeleccionadoId = idPartido;
  rolSeleccionado = rol;

  const titulo = document.getElementById("modal-juez-titulo");
  titulo.textContent = rol === "juez" ? "Elegir Juez" : "Elegir Auxiliar";

  const listaSocios = document.getElementById("lista-socios");
  listaSocios.innerHTML = "";

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
  const partido = partidos.find(p => p.id === partidoSeleccionadoId);
  if (partido) {
    if (rolSeleccionado === "juez") partido.juez = nombre;
    if (rolSeleccionado === "aux") partido.aux = nombre;
    sincronizarConNube();
  }
  cerrarModales();
}

// 7. Fijar Día y Hora
function abrirModalFecha(idPartido) {
  partidoSeleccionadoId = idPartido;
  const partido = partidos.find(p => p.id === idPartido);

  document.getElementById("input-fecha").value = partido.fecha || "";
  document.getElementById("input-hora").value = partido.hora || "";

  document.getElementById("modal-fecha").classList.remove("oculto");
}

function guardarFecha() {
  const fecha = document.getElementById("input-fecha").value;
  const hora = document.getElementById("input-hora").value;

  const partido = partidos.find(p => p.id === partidoSeleccionadoId);
  if (partido) {
    partido.fecha = fecha;
    partido.hora = hora;
    sincronizarConNube();
  }
  cerrarModales();
}

// 8. Formulario de Acta
function abrirModalActa(idPartido) {
  partidoSeleccionadoId = idPartido;
  const partido = partidos.find(p => p.id === idPartido);

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

  const partido = partidos.find(p => p.id === partidoSeleccionadoId);
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

function cerrarModales() {
  document.getElementById("modal-juez").classList.add("oculto");
  document.getElementById("modal-fecha").classList.add("oculto");
  document.getElementById("modal-acta").classList.add("oculto");
  partidoSeleccionadoId = null;
  rolSeleccionado = null;
}

function formatearFecha(f) {
  if (!f) return "";
  const partes = f.split("-");
  return `${partes[2]}/${partes[1]}`;
}