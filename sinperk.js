// ============================================================
// SIN PERK - OPCIÓN DEL 25% POR CATEGORÍA
// ============================================================

const SIN_PERK = {
    sinPerk: true,
    nombre: "Sin Perk",
    nombre_es: "Sin Perk",
    personaje: "",
    archivo: null
};

const sinPerkHabilitadoPorCategoria = {
    perksurv: true,
    perkkiller: true
};

// Panel de filtros: mantiene los filtros de personajes y añade
// un interruptor independiente para permitir/prohibir "Sin Perk".
function abrirPanelFiltros() {
    const modal = document.getElementById('modal-filtros');
    const contenedor = document.getElementById('contenedor-checkboxes');
    contenedor.innerHTML = "";

    // Opción Sin Perk
    const sinPerkBox = document.createElement('button');
    sinPerkBox.type = 'button';
    sinPerkBox.className = 'btn-personaje filtro-sin-perk';
    sinPerkBox.innerText = `SIN PERK: ${sinPerkHabilitadoPorCategoria[categoriaActual] ? 'ON' : 'OFF'}`;
    sinPerkBox.classList.toggle('sin-perk-activo', sinPerkHabilitadoPorCategoria[categoriaActual]);
    sinPerkBox.onclick = () => {
        sinPerkHabilitadoPorCategoria[categoriaActual] = !sinPerkHabilitadoPorCategoria[categoriaActual];
        const activo = sinPerkHabilitadoPorCategoria[categoriaActual];
        sinPerkBox.innerText = `SIN PERK: ${activo ? 'ON' : 'OFF'}`;
        sinPerkBox.classList.toggle('sin-perk-activo', activo);
    };
    contenedor.appendChild(sinPerkBox);

    const separador = document.createElement('div');
    separador.className = 'filtro-separador';
    separador.innerText = 'CHARACTERS';
    contenedor.appendChild(separador);

    const personajesCategoria = listasGlobales[categoriaActual] || [];
    const personajesUnicos = [...new Set(personajesCategoria.map(p => p.personaje))];

    personajesUnicos.forEach(nombre => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerText = nombre;
        btn.className = 'btn-personaje';

        if (excluidosPorCategoria[categoriaActual].includes(nombre)) {
            btn.classList.add('baneado');
        }

        btn.onclick = () => togglerBaneo(nombre, btn);
        contenedor.appendChild(btn);
    });

    modal.style.display = "flex";
}

// Guardamos la decisión de "Sin Perk" por categoría.
function guardarFiltros() {
    console.log(
        "Filtros guardados para", categoriaActual,
        ":", excluidosPorCategoria[categoriaActual],
        "| Sin Perk:", sinPerkHabilitadoPorCategoria[categoriaActual]
    );
    document.getElementById('modal-filtros').style.display = "none";
}

// CONSTRUIR RULETA
// Cuando Sin Perk está habilitado, se añade un resultado especial
// a cada vuelta de la pista. La probabilidad se controla en girar(),
// no por cantidad de casillas, para que sea exactamente 25%.
function construirPista(listaBase) {
    pista.style.transition = "none";
    pista.style.transform = "translateX(0px)";
    pista.innerHTML = "";

    const base = sinPerkHabilitadoPorCategoria[categoriaActual]
        ? [...listaBase, SIN_PERK]
        : [...listaBase];

    let listaExtendida = [];

    for (let i = 0; i < 10; i++) {
        listaExtendida = listaExtendida.concat(base);
    }

    listaFinal = listaExtendida;

    listaFinal.forEach(p => {
        const div = document.createElement("div");
        div.className = "item-personaje";

        if (p.sinPerk) {
            div.classList.add('item-sin-perk');
            div.innerHTML = `<span>Sin Perk</span>`;
        } else {
            div.innerHTML = `<img src="img/${p.archivo}" alt="${p.nombre}">`;
        }

        pista.appendChild(div);
    });
}

// GIRO
function girar(forcedIndex = null) {
    const totalItems = listaFinal.length;
    const wrapperWidth = document.querySelector('.selector-wrapper').offsetWidth;
    const tiempoGiroMs = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;

    // Decidimos el resultado antes de iniciar la animación.
    // Si está habilitado: 25% Sin Perk, 75% una perk normal.
    const sinPerkHabilitado = sinPerkHabilitadoPorCategoria[categoriaActual];
    const saleSinPerk = sinPerkHabilitado && Math.random() < 0.25;

    const cantidadNormales = listaDisponible.length;
    const cantidadBase = cantidadNormales + (sinPerkHabilitado ? 1 : 0);

    if (cantidadBase <= 0) return;

    // Elegimos una posición en la octava repetición de la pista.
    const inicioObjetivo = totalItems - (cantidadBase * 2);
    const indiceBase = saleSinPerk
        ? cantidadNormales
        : Math.floor(Math.random() * cantidadNormales);

    const indiceGanadorReal = inicioObjetivo + indiceBase;

    const desplazamientoFinal =
        (indiceGanadorReal * itemWidth) +
        (itemWidth / 2) -
        (wrapperWidth / 2);

    pista.style.transition = "none";
    pista.style.transform = "translateX(0px)";
    pista.offsetHeight;

    pista.style.transition = `transform ${tiempoGiroMs}ms cubic-bezier(0.1, 0, 0.1, 1)`;
    pista.style.transform = `translateX(-${desplazamientoFinal}px)`;

    let ultimoItemMarcado = -1;

    const intervalClick = setInterval(() => {
        const style = window.getComputedStyle(pista);
        const matrix = new WebKitCSSMatrix(style.transform);
        const currentX = Math.abs(matrix.m41);

        const itemActual = Math.floor((currentX + (wrapperWidth / 2)) / itemWidth);

        if (itemActual !== ultimoItemMarcado && itemActual < totalItems) {
            const clonClick = soundClick.cloneNode();
            clonClick.volume = 0.4;
            clonClick.play().catch(() => {});
            ultimoItemMarcado = itemActual;
        }
    }, 45);

    setTimeout(() => {
        clearInterval(intervalClick);

        const probabilidadRetroceso = Math.random();
        const maxRetroceso = Math.min(2, indiceBase);

        // El retroceso solo puede permanecer dentro de los resultados
        // normales de la misma repetición; nunca puede caer accidentalmente
        // sobre la casilla "Sin Perk".
        if (probabilidadRetroceso <= 0.5 && !saleSinPerk && maxRetroceso > 0) {
            setTimeout(() => {
                const espaciosRetroceso = Math.floor(Math.random() * maxRetroceso) + 1;
                const nuevoIndice = indiceGanadorReal - espaciosRetroceso;

                const nuevoDesplazamiento =
                    (nuevoIndice * itemWidth) +
                    (itemWidth / 2) -
                    (wrapperWidth / 2);

                pista.style.transition = `transform 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95)`;
                pista.style.transform = `translateX(-${nuevoDesplazamiento}px)`;

                setTimeout(() => {
                    const clonClick = soundClick.cloneNode();
                    clonClick.volume = 0.6;
                    clonClick.play().catch(() => {});
                }, 400);

                setTimeout(() => {
                    mostrarGanador(listaFinal[nuevoIndice], forcedIndex);
                }, 1300);
            }, 500);
        } else {
            mostrarGanador(listaFinal[indiceGanadorReal], forcedIndex);
        }
    }, tiempoGiroMs + 200);
}

// MOSTRAR GANADOR
function mostrarGanador(personaje, forcedIndex = null) {
    const audioVictoria = new Audio("sounds/skillcheck.mp3");
    audioVictoria.volume = 0.3;
    audioVictoria.play().catch(() => {});

    const indexParaUsar = (forcedIndex !== null) ? forcedIndex : indiceSlotActual;
    const slot = document.getElementById(`slot-${indexParaUsar}`);
    const img = slot.querySelector("img");
    const nombre = slot.querySelector(".nombre-ganador");
    const personajeTxt = slot.querySelector(".personaje-ganador");

    // Si es reroll, devolver la perk anterior a la lista disponible.
    // "Sin Perk" no es una perk real y por tanto nunca se añade a la lista.
    if (forcedIndex !== null) {
        const anterior = ganadores[forcedIndex];
        if (anterior && !anterior.sinPerk) {
            listaDisponible.push(anterior);
        }
        ganadores[forcedIndex] = personaje;
    } else {
        ganadores.push(personaje);
    }

    if (personaje.sinPerk) {
        img.src = "img/logodbd.webp";
        nombre.textContent = "Sin Perk";
        personajeTxt.textContent = "";
    } else {
        img.src = `img/${personaje.archivo}`;
        nombre.textContent = (idiomaActual === "esp" && personaje.nombre_es)
            ? personaje.nombre_es
            : personaje.nombre;
        personajeTxt.textContent = personaje.personaje;

        // Eliminar la perk seleccionada de las disponibles.
        listaDisponible = listaDisponible.filter(p => p.nombre !== personaje.nombre);
    }

    slot.classList.add("activo");

    if (forcedIndex === null) {
        indiceSlotActual++;

        setTimeout(() => {
            iniciarSiguienteGiro();
        }, 1500);
    }
}
