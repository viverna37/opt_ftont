import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { platformTenant, platformUpdateTenant } from "../../shared/api/endpoints";
import type { PlatformTenant as Tenant } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { dateTime, displayName } from "../../shared/format/format";
import { copyText } from "../../shared/format/download";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconCopy, IconAlert } from "../../shared/ui/icons/Icon";
import { Banner } from "../../shared/ui/Banner/Banner";
import { SwitchRow } from "../../shared/ui/Switch/Switch";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog, haptic, openLink } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import { usePlatformSession } from "./PlatformRoot";
import "../AdminOrders/admin_orders.css";
import "./platform.css";

function ownerLabel(owner: NonNullable<Tenant["owner"]>) {
    const name = displayName(owner);
    const id = `id ${owner.telegram_id}`;
    return [name !== id ? name : null, owner.username ? `@${owner.username}` : null, id].filter(Boolean).join(" · ");
}

export function PlatformTenant() {
    const { slug = "" } = useParams();
    const { api } = usePlatformSession();
    const toast = useToast();
    const location = useLocation();
    const initial = (location.state as { warnings?: string[]; created?: boolean } | null) ?? {};
    useBackButton("/platform");
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [warnings, setWarnings] = useState<string[]>(initial.warnings ?? []);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [token, setToken] = useState("");
    const [owner, setOwner] = useState("");
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        platformTenant(api, slug)
            .then((t) => {
                setTenant(t);
                setName(t.name);
            })
            .catch((e) => setError(errorText(e)));
    }, [api, slug]);

    const update = async (key: string, body: Parameters<typeof platformUpdateTenant>[2], message: string) => {
        setBusy(key);
        try {
            const next = await platformUpdateTenant(api, slug, body);
            setTenant(next);
            setWarnings(next.warnings ?? []);
            haptic("success");
            toast.show(message, "success");
            return true;
        } catch (e) {
            toast.show(errorText(e), "danger");
            return false;
        } finally {
            setBusy(null);
        }
    };

    const copy = async (text: string) => toast.show((await copyText(text)) ? "Скопировано" : "Не удалось скопировать");

    if (!tenant) {
        return (
            <div className="screen">
                <TopBar back="/platform" title="Оптовик" />
                {error ? <Banner tone="danger">{error}</Banner> : <ScreenLoader />}
            </div>
        );
    }

    return (
        <div className="screen">
            <div className="screen-scroll">
                <TopBar back="/platform" title={tenant.name} subtitle={`/t/${tenant.slug} · создан ${dateTime(tenant.created_at)}`} />
                <div className="screen-pad">
                    {initial.created && <Banner tone="ok">Оптовик создан. Отправьте владельцу ссылку на его бота — он откроет каталог и попадёт в админку.</Banner>}
                    {warnings.map((w) => (
                        <Banner key={w} tone="low" icon={<IconAlert size={18} />}>
                            {w}
                        </Banner>
                    ))}
                    {!tenant.is_active && <Banner tone="danger">Каталог отключён — клиенты и сотрудники видят «Каталог не найден».</Banner>}

                    <div className="grid-3">
                        <div className="stat">
                            <span className="stat-value mono">{tenant.products_count}</span>
                            <span className="stat-label">товаров</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value mono">{tenant.clients_count}</span>
                            <span className="stat-label">клиентов</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value mono">{tenant.orders_count}</span>
                            <span className="stat-label">заявок</span>
                        </div>
                    </div>
                    {tenant.last_order_at && <span className="muted">Последняя заявка {dateTime(tenant.last_order_at)}</span>}

                    {tenant.bot_url && (
                        <div className="pl-link-row">
                            <span className="mono">{tenant.bot_url}</span>
                            <button type="button" aria-label="Скопировать ссылку на бота" onClick={() => copy(tenant.bot_url!)}>
                                <IconCopy size={18} />
                            </button>
                            <button type="button" className="link-btn" onClick={() => openLink(tenant.bot_url!)}>
                                Открыть
                            </button>
                        </div>
                    )}
                    {tenant.catalog_url && (
                        <div className="pl-link-row">
                            <span className="mono">{tenant.catalog_url}</span>
                            <button type="button" aria-label="Скопировать ссылку на каталог" onClick={() => copy(tenant.catalog_url!)}>
                                <IconCopy size={18} />
                            </button>
                        </div>
                    )}

                    <h2 className="section-title">Название</h2>
                    <div className="field">
                        <label htmlFor="pn" className="sr-only">
                            Название
                        </label>
                        <input id="pn" value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
                    </div>
                    {name.trim() && name.trim() !== tenant.name && (
                        <Button size="md" loading={busy === "name"} onClick={() => update("name", { name: name.trim() }, "Название сохранено")}>
                            Сохранить название
                        </Button>
                    )}

                    <h2 className="section-title">Бот</h2>
                    <span className="muted">{tenant.bot_username ? `Подключён @${tenant.bot_username}` : "Бот не подключён"}</span>
                    <div className="field">
                        <label htmlFor="pt">{tenant.bot_configured ? "Заменить токен" : "Токен бота"}</label>
                        <input id="pt" className="mono" autoComplete="off" value={token} placeholder="123456789:AA…" onChange={(e) => setToken(e.target.value.trim())} />
                    </div>
                    {token && (
                        <Button
                            size="md"
                            loading={busy === "bot"}
                            onClick={async () => (await update("bot", { bot_token: token }, "Бот подключён")) && setToken("")}
                        >
                            Подключить бота
                        </Button>
                    )}

                    <h2 className="section-title">Владелец</h2>
                    <span className="muted">
                        {tenant.owner ? ownerLabel(tenant.owner) : "Не назначен"}
                    </span>
                    <div className="field">
                        <label htmlFor="po">{tenant.owner ? "Передать владение — Telegram id" : "Telegram id владельца"}</label>
                        <input id="po" className="mono" inputMode="numeric" value={owner} onChange={(e) => setOwner(e.target.value.replace(/\D/g, ""))} />
                        {tenant.owner && <span className="field-hint">Прежний владелец останется админом</span>}
                    </div>
                    {owner && (
                        <Button
                            size="md"
                            loading={busy === "owner"}
                            onClick={async () => (await update("owner", { owner_telegram_id: Number(owner) }, "Владелец назначен")) && setOwner("")}
                        >
                            Назначить владельцем
                        </Button>
                    )}

                    <h2 className="section-title">Доступ</h2>
                    <SwitchRow
                        title="Каталог работает"
                        subtitle="Выключите, чтобы временно закрыть каталог (данные сохраняются)"
                        checked={tenant.is_active}
                        onChange={async (on) => {
                            if (!on && !(await confirmDialog(`Отключить «${tenant.name}»? Клиенты и сотрудники потеряют доступ.`))) return;
                            await update("active", { is_active: on }, on ? "Каталог включён" : "Каталог отключён");
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
