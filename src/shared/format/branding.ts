// Акцентный цвет настраивается на тенанта: перекрашиваем CSS-переменные и
// подбираем цвет текста на акценте по яркости (тёмный текст на светлом
// акценте и наоборот), приглушённый фон — смесь акцента с фоном.

function hexToRgb(hex: string): [number, number, number] | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]) {
    const ch = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function mix(a: [number, number, number], b: [number, number, number], t: number) {
    const c = a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function applyAccent(hex: string) {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const root = document.documentElement.style;
    const bg: [number, number, number] = [17, 19, 22];
    root.setProperty("--accent", hex);
    root.setProperty("--accent-hover", mix(rgb, [255, 255, 255], 0.3));
    root.setProperty("--accent-soft", mix(rgb, bg, 0.78));
    root.setProperty("--on-accent", luminance(rgb) > 0.35 ? "#0E1A14" : "#FFFFFF");
}
