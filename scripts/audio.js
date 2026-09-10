export const soundInicio = new Audio("sounds/inicio.mp3");
export const soundClick = new Audio("sounds/click.mp3");

soundInicio.volume = 0.2;

export function reproducirInicio() {
    soundInicio.currentTime = 0;
    soundInicio.play().catch(() => {});
}

export function reproducirClick(volume = 0.4) {
    const click = soundClick.cloneNode();
    click.volume = volume;
    click.play().catch(() => {});
}

export function reproducirVictoria() {
    const audio = new Audio("sounds/skillcheck.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
}
