import { useState } from "react";
import { initials } from "../../format/format";
import "./avatar.css";

// Аватар клиента: фото из Telegram, а если его нет или не загрузилось — инициалы
export function Avatar({ name, photo, size = 40 }: { name: string; photo?: string | null; size?: number }) {
    const [failed, setFailed] = useState(false);
    return (
        <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
            {photo && !failed ? <img src={photo} alt="" onError={() => setFailed(true)} /> : initials(name)}
        </span>
    );
}
