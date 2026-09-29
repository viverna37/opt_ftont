import { useState } from "react";
import { useSession } from "../../shared/session/SessionProvider";
import { Logo } from "../../shared/ui/Logo/Logo";
import { Button } from "../../shared/ui/Button/Button";
import { IconClock, IconLock } from "../../shared/ui/icons/Icon";
import { openLink } from "../../shared/platform/telegram";
import "./access.css";

// Режим approval: новый клиент ждёт, пока менеджер откроет доступ (анкет нет —
// менеджер видит имя и @username из Telegram). blocked — доступ закрыт.
export function AccessWait({ kind }: { kind: "pending" | "blocked" }) {
    const { me, reloadMe } = useSession();
    const [checking, setChecking] = useState(false);
    const { tenant } = me;
    const manager = tenant.manager_username;

    const check = async () => {
        setChecking(true);
        await reloadMe();
        setChecking(false);
    };

    return (
        <div className="screen access">
            <div className="access-head">
                <Logo name={tenant.name} url={tenant.logo_url} size={56} />
                <h1 className="access-title">{tenant.name}</h1>
                <p className="access-text">
                    {kind === "pending"
                        ? "Каталог открыт только оптовым клиентам. Менеджер проверит вас по Telegram и откроет доступ — обычно в течение дня."
                        : "Доступ к каталогу закрыт. Если это ошибка — напишите менеджеру."}
                </p>
            </div>
            <div className="access-state">
                <span className={`access-state-icon ${kind === "pending" ? "low" : "out"}`}>
                    {kind === "pending" ? <IconClock size={22} /> : <IconLock size={22} />}
                </span>
                <span className="access-state-text">
                    <b>{kind === "pending" ? "Ожидайте подтверждения" : "Доступ закрыт"}</b>
                    {kind === "pending" ? "Каталог откроется сам при следующем входе" : "Цены и товары недоступны"}
                </span>
            </div>
            <div className="spacer" />
            {manager && (
                <Button variant="surface" onClick={() => openLink(`https://t.me/${manager}`)}>
                    Написать менеджеру
                </Button>
            )}
            {kind === "pending" && (
                <Button onClick={check} loading={checking}>
                    Проверить доступ
                </Button>
            )}
        </div>
    );
}
