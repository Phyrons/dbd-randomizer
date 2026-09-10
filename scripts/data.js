import { state } from "./state.js";

const RUTAS_DATOS = {
    survivors: "json/survivors.json",
    killers: "json/killers.json",
    grupos: "json/grupos.json"
};

async function cargarJSON(ruta) {
    const response = await fetch(ruta);

    if (!response.ok) {
        throw new Error(`No se pudo cargar ${ruta} (${response.status})`);
    }

    return response.json();
}

export async function cargarListas() {
    const [survivors, killers, grupos] = await Promise.all([
        cargarJSON(RUTAS_DATOS.survivors),
        cargarJSON(RUTAS_DATOS.killers),
        cargarJSON(RUTAS_DATOS.grupos)
    ]);

    state.listasGlobales = {
        perksurv: survivors,
        perkkiller: killers
    };

    state.grupos = grupos;

    console.log("Datos cargados:", {
        survivors: survivors.length,
        killers: killers.length,
        grupos
    });

    return state.listasGlobales;
}
