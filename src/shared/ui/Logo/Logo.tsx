import { fileUrl } from "../../api/client";
import { initials } from "../../format/format";

// Логотип оптовика из настроек, а без него — инициалы на акцентном квадрате (как «ОО» в макетах)
export function Logo({ name, url, size = 44 }: { name: string; url: string | null; size?: number }) {
    const style = {
        width: size,
        height: size,
        borderRadius: size * 0.32,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "var(--accent)",
        color: "var(--on-accent)",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size * 0.34,
    } as const;
    const src = fileUrl(url);
    return <span style={style}>{src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}</span>;
}
