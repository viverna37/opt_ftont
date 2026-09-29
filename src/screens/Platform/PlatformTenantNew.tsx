import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { platformCreateTenant } from "../../shared/api/endpoints";
import { errorText } from "../../shared/api/client";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { MainAction } from "../../shared/ui/MainAction/MainAction";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import { usePlatformSession } from "./PlatformRoot";
import "./platform.css";

const TRANSLIT: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya" };

function toSlug(name: string) {
    return name
        .toLowerCase()
        .split("")
        .map((c) => TRANSLIT[c] ?? c)
        .join("")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
}

// Новый оптовик: бэкенд сам проверит токен (getMe) и повесит на бота кнопку «Каталог»
export function PlatformTenantNew() {
    const { api } = usePlatformSession();
    const navigate = useNavigate();
    const toast = useToast();
    useBackButton("/platform");
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugTouched, setSlugTouched] = useState(false);
    const [token, setToken] = useState("");
    const [owner, setOwner] = useState("");
    const [busy, setBusy] = useState(false);

    const save = async () => {
        if (!name.trim() || !slug) {
            toast.show("Укажите название и адрес", "danger");
            return;
        }
        setBusy(true);
        try {
            const created = await platformCreateTenant(api, {
                slug,
                name: name.trim(),
                bot_token: token.trim() || null,
                owner_telegram_id: owner ? Number(owner) : null,
            });
            haptic("success");
            navigate(`/platform/t/${created.slug}`, { replace: true, state: { warnings: created.warnings ?? [], created: true } });
        } catch (e) {
            haptic("error");
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back="/platform" title="Новый оптовик" />
                <div className="screen-pad">
                    <ol className="pl-steps">
                        <li>
                            <span>
                                Оптовик создаёт бота в <b>@BotFather</b> (/newbot) и присылает вам <b>токен</b>.
                            </span>
                        </li>
                        <li>
                            <span>
                                Его Telegram id — через <b>@userinfobot</b> (пусть перешлёт туда любое сообщение).
                            </span>
                        </li>
                        <li>
                            <span>После создания бот сразу получит кнопку «Каталог», владелец — доступ в админку.</span>
                        </li>
                    </ol>
                    <div className="field">
                        <label htmlFor="tn">Название</label>
                        <input
                            id="tn"
                            value={name}
                            maxLength={150}
                            placeholder="Amigo Opt"
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!slugTouched) setSlug(toSlug(e.target.value));
                            }}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="ts">Адрес каталога</label>
                        <input
                            id="ts"
                            className="mono"
                            value={slug}
                            maxLength={40}
                            placeholder="amigo"
                            onChange={(e) => {
                                setSlugTouched(true);
                                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                            }}
                        />
                        <span className="field-hint">Латиница, цифры, дефис. Будет /t/{slug || "…"} — потом не меняется.</span>
                    </div>
                    <div className="field">
                        <label htmlFor="tt">Токен бота</label>
                        <input id="tt" className="mono" value={token} autoComplete="off" placeholder="123456789:AA…" onChange={(e) => setToken(e.target.value.trim())} />
                        <span className="field-hint">Можно добавить позже — без бота клиенты не войдут</span>
                    </div>
                    <div className="field">
                        <label htmlFor="to">Telegram id владельца</label>
                        <input id="to" className="mono" inputMode="numeric" value={owner} placeholder="123456789" onChange={(e) => setOwner(e.target.value.replace(/\D/g, ""))} />
                    </div>
                </div>
            </div>
            <MainAction text="Создать оптовика" onClick={save} loading={busy} disabled={!name.trim() || !slug} />
        </div>
    );
}
