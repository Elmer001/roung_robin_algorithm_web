class Proceso {
    constructor(nombre, tiempoLlegada, tiempoRafaga) {
        this.nombre = nombre;
        this.tiempoLlegada = tiempoLlegada;
        this.tiempoRafaga = tiempoRafaga;
        this.tiempoRestante = tiempoRafaga;
        this.quantumUsado = 0;
    }
}


let procesos = [];
let colaListos = [];
let quantum = 2;
let tiempoActual = 0;
let simulacionActiva = false;
let modoPasoAPaso = false;
let historial = [];
let procesoActual = null;
let quantumRestante = 0;


function inicializarProcesos() {
    procesos = [
        new Proceso("P1", 0, 5),
        new Proceso("P2", 0, 3),
        new Proceso("P3", 0, 2)
    ];
    ordenarProcesos();
    colaListos = [...procesos];
    historial = [];
    procesoActual = null;
    quantumRestante = 0;
    tiempoActual = 0;

}


function guardarEstadoInicial() {
    const estadoInicial = {
        tiempoActual: tiempoActual,
        procesos: procesos.map(p => ({
            nombre: p.nombre,
            tiempoLlegada: p.tiempoLlegada,
            tiempoRafaga: p.tiempoRafaga,
            tiempoRestante: p.tiempoRestante,
            quantumUsado: p.quantumUsado
        })),
        colaListos: colaListos.map(p => p.nombre),
        procesoActual: procesoActual ? procesoActual.nombre : null,
        quantumRestante: quantumRestante
    };
    historial = [estadoInicial];
}

function restaurarEstadoAnterior() {

    if (historial.length === 0) {
        return;
    }

    if (historial.length > 1) {

        const estadoAnterior = historial[historial.length - 1];

        historial.pop();

        tiempoActual = estadoAnterior.tiempoActual;


        procesos.forEach((p, index) => {
            p.tiempoRestante = estadoAnterior.procesos[index].tiempoRestante;
            p.quantumUsado = estadoAnterior.procesos[index].quantumUsado;
        });


        procesoActual = estadoAnterior.procesoActual ?
            procesos.find(p => p.nombre === estadoAnterior.procesoActual) : null;
        quantumRestante = estadoAnterior.quantumRestante;


        colaListos = estadoAnterior.colaListos.map(nombre =>
            procesos.find(p => p.nombre === nombre)
        ).filter(p => p !== undefined);
    } else {

        const estadoInicial = historial[0];
        tiempoActual = estadoInicial.tiempoActual;

        procesos.forEach((p, index) => {
            p.tiempoRestante = estadoInicial.procesos[index].tiempoRestante;
            p.quantumUsado = estadoInicial.procesos[index].quantumUsado;
        });

        procesoActual = null;
        quantumRestante = 0;
        colaListos = [...procesos];
    }

    actualizarInterfazCompleta();
}


function actualizarInterfazCompleta() {
    document.getElementById('tiempo-actual').textContent = tiempoActual;
    document.getElementById('proceso-actual').textContent = procesoActual ? procesoActual.nombre : "-";

    actualizarEstadosProcesos(procesoActual);
    actualizarCola();
}


function ordenarProcesos() {
    procesos.sort((a, b) => {
        if (a.tiempoLlegada !== b.tiempoLlegada) {
            return a.tiempoLlegada - b.tiempoLlegada;
        }
        return a.nombre.localeCompare(b.nombre);
    });
}


function mostrarConfiguracion() {
    document.getElementById('config-panel').style.display = 'block';
    document.getElementById('simulation-panel').style.display = 'none';

    document.getElementById('quantum').value = quantum;

    const procesosList = document.getElementById('procesos-list');
    procesosList.innerHTML = '';

    procesos.forEach((proceso, index) => {
        const procesoDiv = document.createElement('div');
        procesoDiv.className = 'proceso-item';
        procesoDiv.innerHTML = `
            <input type="text" value="${proceso.nombre}" placeholder="Nombre" 
                   onchange="actualizarProceso(${index}, 'nombre', this.value)">
            <input type="number" value="${proceso.tiempoLlegada}" placeholder="Llegada" 
                   onchange="actualizarProceso(${index}, 'llegada', this.value)">
            <input type="number" value="${proceso.tiempoRafaga}" placeholder="Ráfaga" 
                   onchange="actualizarProceso(${index}, 'rafaga', this.value)">
            <button class="btn-remove" onclick="eliminarProceso(${index})">❌</button>
        `;
        procesosList.appendChild(procesoDiv);
    });
}


async function ejecutarRoundRobin() {
    simulacionActiva = true;
    modoPasoAPaso = false;

    while ((colaListos.length > 0 || procesoActual) && simulacionActiva) {
        guardarEstadoActual();
        
        if (!procesoActual && colaListos.length > 0) {
            procesoActual = colaListos.shift();
            quantumRestante = quantum;
            procesoActual.quantumUsado = 0;
        }

        if (procesoActual) {
            tiempoActual += 1;
            procesoActual.tiempoRestante -= 1;
            procesoActual.quantumUsado += 1;
            quantumRestante -= 1;

            if (procesoActual.tiempoRestante <= 0) {
                procesoActual = null;
                quantumRestante = 0;
            } else if (quantumRestante <= 0) {
                colaListos.push(procesoActual);
                procesoActual = null;
                quantumRestante = 0;
            }
        } else {
            tiempoActual += 1;
        }

        actualizarInterfaz(procesoActual);

        if (!modoPasoAPaso) {
            await dormir(1000);
        } else {
            return;
        }
    }

    if (colaListos.length === 0 && !procesoActual && simulacionActiva) {

    }
}


async function ejecutarPaso() {

    guardarEstadoActual();


    if (!procesoActual && colaListos.length > 0) {
        procesoActual = colaListos.shift();
        quantumRestante = quantum;
        procesoActual.quantumUsado = 0;
    }


    if (procesoActual) {

        tiempoActual += 1;
        procesoActual.tiempoRestante -= 1;
        procesoActual.quantumUsado += 1;
        quantumRestante -= 1;


        if (procesoActual.tiempoRestante <= 0) {

            procesoActual = null;
            quantumRestante = 0;
        } else if (quantumRestante <= 0) {

            colaListos.push(procesoActual);
            procesoActual = null;
            quantumRestante = 0;
        }
    } else {

        tiempoActual += 1;
    }

    actualizarInterfaz(procesoActual);
}


function guardarEstadoActual() {
    const estado = {
        tiempoActual: tiempoActual,
        procesos: procesos.map(p => ({
            nombre: p.nombre,
            tiempoLlegada: p.tiempoLlegada,
            tiempoRafaga: p.tiempoRafaga,
            tiempoRestante: p.tiempoRestante,
            quantumUsado: p.quantumUsado
        })),
        colaListos: colaListos.map(p => p.nombre),
        procesoActual: procesoActual ? procesoActual.nombre : null,
        quantumRestante: quantumRestante
    };

    historial.push(estado);
}


function actualizarInterfaz(procesoActual) {
    document.getElementById('tiempo-actual').textContent = tiempoActual;
    document.getElementById('proceso-actual').textContent = procesoActual ? procesoActual.nombre : "-";

    actualizarEstadosProcesos(procesoActual);
    actualizarCola();
}


function actualizarEstadosProcesos(procesoActual) {
    const processStates = document.getElementById('process-states');
    processStates.innerHTML = '<h3> Estado de los Procesos:</h3>';

    procesos.forEach(proceso => {
        const stateDiv = document.createElement('div');

        let textoEstado, icono;
        if (proceso.tiempoRestante <= 0) {
            textoEstado = "TERMINADO";
            stateDiv.className = 'process-state process-finished';

        } else if (proceso === procesoActual) {
            textoEstado = `EJECUTANDO (${proceso.tiempoRestante}u restantes)`;
            stateDiv.className = 'process-state process-executing';

        } else {
            textoEstado = `ESPERANDO (${proceso.tiempoRestante}u restantes)`;
            stateDiv.className = 'process-state process-waiting';

        }

        stateDiv.innerHTML = `${proceso.nombre}:</strong> ${textoEstado}`;
        processStates.appendChild(stateDiv);
    });
}


function actualizarCola() {
    const colaElement = document.getElementById('cola-display');

    if (colaListos.length > 0) {
        colaElement.innerHTML = `<strong>COLA DE PROCESOS:</strong> [${colaListos.map(p => p.nombre).join(' , ')}]`;
    } else {
        colaElement.innerHTML = `<strong>COLA DE PROCESOS:</strong> [VACÍA]`;
    }
}


function dormir(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function iniciarSimulacion() {
    quantum = parseInt(document.getElementById('quantum').value) || 2;


    tiempoActual = 0;
    procesos.forEach(p => {
        p.tiempoRestante = p.tiempoRafaga;
        p.quantumUsado = 0;
    });

    ordenarProcesos();
    colaListos = [...procesos];
    historial = [];
    procesoActual = null;
    quantumRestante = 0;


    guardarEstadoActual();

    document.getElementById('config-panel').style.display = 'none';
    document.getElementById('simulation-panel').style.display = 'block';


    actualizarInterfazCompleta();


}

function pausarSimulacion() {
    simulacionActiva = false;
}

function reanudarSimulacion() {
    if (!simulacionActiva && (colaListos.length > 0 || procesoActual)) {
        simulacionActiva = true;
        modoPasoAPaso = false;
        ejecutarRoundRobin();
    }
}

function siguientePaso() {
    if (colaListos.length > 0 || procesoActual) {
        ejecutarPaso();

        if (!modoPasoAPaso) {
            pausarSimulacion();
        }
    }
}


function retrocederPaso() {
    if (simulacionActiva) {
        pausarSimulacion();
    }
    restaurarEstadoAnterior();
}

function reiniciarSimulacion() {
    simulacionActiva = false;
    inicializarProcesos();
    mostrarConfiguracion();
}


function agregarProceso() {
    const nuevoNombre = `P${procesos.length + 1}`;
    procesos.push(new Proceso(nuevoNombre, 0, 3));
    mostrarConfiguracion();
}

function eliminarProceso(index) {
    if (procesos.length > 1) {
        procesos.splice(index, 1);
        mostrarConfiguracion();
    }
}

function actualizarProceso(index, campo, valor) {
    if (campo === 'nombre') {
        procesos[index].nombre = valor;
    } else if (campo === 'llegada') {
        procesos[index].tiempoLlegada = parseInt(valor) || 0;
    } else if (campo === 'rafaga') {
        const nuevaRafaga = parseInt(valor) || 1;
        procesos[index].tiempoRafaga = nuevaRafaga;
        procesos[index].tiempoRestante = nuevaRafaga;
    }
}


document.addEventListener('DOMContentLoaded', function () {
    inicializarProcesos();
    mostrarConfiguracion();
});