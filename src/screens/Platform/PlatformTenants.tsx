import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { platformTenants } from "../../shared/api/endpoints";
import type { PlatformTenant } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { dateTime, displayName, plural } from "../../shared/format/format";
import { IconPlus, IconSearch, IconStore } from "../../shared/ui/icons/Icon";
import { Tag } from "../../shared/ui/Tag/Tag";
import { Logo } from "../../shared/ui/Logo/Logo";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { usePlatformSession, PLATFORM_FROM_KEY } from "./PlatformRoot";
import { useBackButton } from "../../shared/platform/useBackButton";
import "../AdminOrders/admin_orders.css";
import "../AdminProducts/admin_products.css";
import "./platform.css";

export function PlatformTenants() {
    const { api, me, from } = usePlatformSession();
    const [items, setItems] = useState<PlatformTenant[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState("");
    // Открыли из каталога оптовика — «Назад» возвращает в его настройки
    useBackButton(from ? `/t/${from}/admin/settings` : undefined);

    useEffect(() => {
        platformTenants(api)
            .then(setItems)
            .catch((e) => setError(errorText(e)));
    }, [api]);

    const needle = q.trim().toLowerCase();
    const shown = (items ?? []).filter((t) => !needle || t.name.toLowerCase().includes(needle) || t.slug.includes(needle) || (t.bot_username ?? "").toLowerCase().includes(needle));
    const active = items?.filter((t) => t.is_active).length ?? 0;
    const orders = items?.reduce((s, t) => s + t.orders_count, 0) ?? 0;

    return (
        <div className="screen">
            <div className="screen-scroll">
                <header className="admin-head">
                    <div className="admin-head-text">
                        <span className="admin-eyebrow">Владелец платформы</span>
                        <h1 className="admin-title">Оптовики</h1>
                    </div>
                    {from && (
                        <Link
                            to={`/t/${from}/admin/settings`}
                            className="link-btn"
                            onClick={() => window.sessionStorage.removeItem(PLATFORM_FROM_KEY)}
                        >
                            В каталог
                        </Link>
                    )}
                </header>
                <div className="screen-pad pl-body">
                    {!me.webapp_configured && <Banner tone="low">На сервере не задан WEBAPP_BASE_URL — боты не получат кнопку каталога и ссылки в уведомлениях.</Banner>}
                    <div className="grid-3">
                        <div className="stat">
                            <span className="stat-value mono">{items?.length ?? "—"}</span>
                            <span className="stat-label">всего</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value mono">{items ? active : "—"}</span>
                            <span className="stat-label">активны</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value mono">{items ? orders : "—"}</span>
                            <span className="stat-label">заявок</span>
                        </div>
                    </div>
                    {(items?.length ?? 0) > 3 && (
                        <div className="ap-search">
                            <IconSearch size={18} strokeWidth={2} />
                            <label htmlFor="pq" className="sr-only">
                                Поиск оптовика
                            </label>
                            <input id="pq" placeholder="Название, адрес или бот" value={q} onChange={(e) => setQ(e.target.value)} />
                        </div>
                    )}
                    {error && <Banner tone="danger">{error}</Banner>}
                    {!items && !error && <ListSkeleton rows={4} />}
                    {items?.length === 0 && (
                        <Empty icon={<IconStore size={32} />} title="Оптовиков пока нет">
                            Заведите первого: нужен токен его бота из @BotFather и Telegram id владельца
                        </Empty>
                    )}
                    <div className="admin-cards">
                        {shown.map((t) => (
                            <Link key={t.id} to={`/platform/t/${t.slug}`} className="admin-card admin-card-link column">
                                <div className="pl-card-top">
                                    <Logo name={t.name} url={null} size={40} />
                                    <div className="admin-card-text">
                                        <span className="admin-card-title">{t.name}</span>
                                        <span className="muted">
                                            /t/{t.slug}
                                            {t.bot_username ? ` · @${t.bot_username}` : ""}
                                        </span>
                                    </div>
                                    {!t.is_active ? <Tag tone="out">отключён</Tag> : !t.bot_configured ? <Tag tone="low">нет бота</Tag> : !t.owner ? <Tag tone="low">нет владельца</Tag> : <Tag tone="ok">работает</Tag>}
                                </div>
                                <span className="muted">
                                    {t.products_count} {plural(t.products_count, "товар", "товара", "товаров")} · {t.clients_count}{" "}
                                    {plural(t.clients_count, "клиент", "клиента", "клиентов")} · {t.orders_count} {plural(t.orders_count, "заявка", "заявки", "заявок")}
                                </span>
                                <span className="muted">
                                    {t.owner ? `Владелец: ${displayName(t.owner)}` : "Владелец не назначен"}
                                    {t.last_order_at ? ` · последняя заявка ${dateTime(t.last_order_at)}` : ""}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <Link to="/platform/new" className="ap-fab pl-fab">
                <IconPlus size={20} strokeWidth={2.2} />
                Оптовик
            </Link>
        </div>
    );
}
