import { useEffect, useRef, useState } from "react";
import "./update_checker.css";

const CHECK_MS = 45_000;

// Telegram держит мини-апп в живом WebView между открытиями без
// перезагрузки страницы, так что заголовки Cache-Control одни не спасают —
// если вкладка ни разу не запросила index.html заново, старый JS так и
// останется в памяти. Поэтому здесь отдельно, независимо от HTTP-кэша
// (fetch с cache: "no-store" всегда идёт в сеть), сверяем версию сборки с
// той, что реально отдаёт сервер, и предлагаем обновиться, если они разошлись.
export function UpdateChecker() {
    const [stale, setStale] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        async function check() {
            try {
                const res = await fetch("/version.txt", { cache: "no-store" });
                if (!res.ok) return;
                const serverVersion = (await res.text()).trim();
                if (serverVersion && serverVersion !== __APP_VERSION__) setStale(true);
            } catch {
                // сеть недоступна или временная ошибка — просто попробуем на следующем тике
            }
        }

        timerRef.current = window.setInterval(check, CHECK_MS);
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, []);

    if (!stale) return null;

    return (
        <div className="update-checker-banner">
            <span>Доступна новая версия приложения</span>
            <button onClick={() => window.location.reload()}>Обновить</button>
        </div>
    );
}
