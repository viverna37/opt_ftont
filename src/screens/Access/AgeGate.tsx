import { useState } from "react";
import { confirmAge } from "../../shared/api/endpoints";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { Logo } from "../../shared/ui/Logo/Logo";
import { Button } from "../../shared/ui/Button/Button";
import { Banner } from "../../shared/ui/Banner/Banner";
import { haptic } from "../../shared/platform/telegram";
import "./access.css";

// Однократное подтверждение при первом входе — одна кнопка, без полей
// (включается настройкой тенанта age_gate).
export function AgeGate() {
    const { api, me, setMe } = useSession();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { tenant } = me;

    const confirm = async () => {
        setBusy(true);
        setError(null);
        try {
            setMe(await confirmAge(api));
            haptic("success");
        } catch (e) {
            setError(errorText(e));
            setBusy(false);
        }
    };

    return (
        <div className="screen access">
            <div className="access-head">
                <Logo name={tenant.name} url={tenant.logo_url} size={56} />
                <h1 className="access-title">{tenant.name} — прайс для магазинов</h1>
                <p className="access-text">
                    {tenant.welcome_text || "Оптовый каталог с актуальными ценами и наличием. Соберите заявку — менеджер свяжется с вами."}
                </p>
            </div>
            <div className="access-state">
                <span className="access-state-icon low">18+</span>
                <span className="access-state-text">
                    <b>Только для оптовых покупателей</b>
                    Каталог содержит товары, продажа которых разрешена лицам старше 18 лет.
                </span>
            </div>
            {error && <Banner tone="danger">{error}</Banner>}
            <div className="spacer" />
            <Button onClick={confirm} loading={busy}>
                Мне есть 18 лет, закупаю для перепродажи
            </Button>
            <p className="access-note">Спросим один раз</p>
        </div>
    );
}
