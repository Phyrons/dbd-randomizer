import { state } from "./state.js";

export async function cargarListas() {
    const response = await fetch("listas.json");

    if (!response.ok) {
        throw new Error(`No se pudo cargar listas.json (${response.status})`);
    }

    state.listasGlobales = await response.json();
    console.log("Listas cargadas:", Object.keys(state.listasGlobales));
    return state.listasGlobales;
}
