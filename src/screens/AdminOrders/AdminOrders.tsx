import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getOrdersXlsx, getSummary, listLiveCarts, listOrders, remindCart } from "../../shared/api/endpoints";
import type { AdminOrder, AdminSummary, LiveCart, OrderStatus } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { dateTime, displayName, money, positions } from "../../shared/format/format";
import { downloadBlob } from "../../shared/format/download";
import { setStaffMode } from "../../shared/local/storage";
import { IconButton, Button } from "../../shared/ui/Button/Button";
import { IconBell, IconDownload, IconEye, IconReceipt, IconCart } from "../../shared/ui/icons/Icon";
import { Chip, ChipRow } from "../../shared/ui/Chips/Chips";
import { Avatar } from "../../shared/ui/Avatar/Avatar";
import { OrderStatusTag } from "../../shared/ui/OrderItems/OrderItems";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { AdminTabs } from "../../shared/ui/Tabs/Tabs";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic } from "../../shared/platform/telegram";
import "./admin_orders.css";

type Tab = OrderStatus | "carts";
const TABS: { value: Tab; label: string }[] = [
    { value: "new", label: "Новые" },
    { value: "in_progress", label: "В работе" },
    { value: "carts", label: "Живые корзины" },
    { value: "done", label: "Выполнены" },
    { value: "cancelled", label: "Отменены" },
];
const PAGE = 30;

export function AdminOrders() {
    const { api, base, me, slug } = useSession();
    const navigate = useNavigate();
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const tab = (params.get("tab") as Tab) || "new";

    const [summary, setSummary] = useState<AdminSummary | null>(null);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [total, setTotal] = useState(0);
    const [carts, setCarts] = useState<LiveCart[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (offset = 0) => {
            setLoading(true);
            setError(null);
            try {
                if (offset === 0) setSummary(await getSummary(api));
                if (tab === "carts") {
                    setCarts(await listLiveCarts(api));
                } else {
                    const page = await listOrders(api, { status: tab, limit: PAGE, offset });
                    setOrders((prev) => (offset ? [...prev, ...page.items] : page.items));
                    setTotal(page.total);
                }
            } catch (e) {
                setError(errorText(e));
            } finally {
                setLoading(false);
            }
        },
        [api, tab],
    );

    useEffect(() => {
        setOrders([]);
        void load(0);
    }, [load]);

    const counts: Partial<Record<Tab, number>> = summary
        ? { new: summary.new_orders, in_progress: summary.in_progress_orders, carts: summary.live_carts }
        : {};

    const exportXlsx = async () => {
        try {
            downloadBlob(await getOrdersXlsx(api, tab === "carts" ? {} : { status: tab }), `zayavki-${tab}.xlsx`);
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    const remind = async (cart: LiveCart) => {
        try {
            const updated = await remindCart(api, cart.cart_id);
            setCarts((list) => list?.map((c) => (c.cart_id === cart.cart_id ? updated : c)) ?? null);
            haptic("success");
            toast.show("Напоминание отправлено в бот", "success");
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-tabbar">
                <header className="admin-head">
                    <div className="admin-head-text">
                        <span className="admin-eyebrow">Режим администратора</span>
                        <h1 className="admin-title">{me.tenant.name}</h1>
                    </div>
                    <IconButton label="Выгрузить в Excel" onClick={exportXlsx}>
                        <IconDownload size={20} />
                    </IconButton>
                    <IconButton
                        label="Открыть витрину"
                        onClick={() => {
                            setStaffMode(slug, "catalog");
                            navigate(`${base}/catalog`);
                        }}
                    >
                        <IconEye size={20} />
                    </IconButton>
                </header>

                <div className="screen-pad admin-orders-body">
                    <div className="grid-3">
                        <button type="button" className={`stat ${summary?.new_orders ? "hot" : ""}`} onClick={() => setParams({ tab: "new" }, { replace: true })}>
                            <span className="stat-value mono">{summary?.new_orders ?? "—"}</span>
                            <span className="stat-label">новые заявки</span>
                        </button>
                        <button type="button" className="stat" onClick={() => setParams({ tab: "carts" }, { replace: true })}>
                            <span className="stat-value mono">{summary?.live_carts ?? "—"}</span>
                            <span className="stat-label">живые корзины</span>
                        </button>
                        <Link to={`${base}/admin/products?stock=out`} className="stat">
                            <span className="stat-value mono">{summary?.out_of_stock_products ?? "—"}</span>
                            <span className="stat-label">нет в наличии</span>
                        </Link>
                    </div>

                    <ChipRow>
                        {TABS.map((t) => (
                            <Chip key={t.value} on={tab === t.value} onClick={() => setParams({ tab: t.value }, { replace: true })}>
                                {t.label}
                                {counts[t.value] ? ` · ${counts[t.value]}` : ""}
                            </Chip>
                        ))}
                    </ChipRow>

                    {error && <Banner tone="danger">{error}</Banner>}
                    {loading && !orders.length && !carts && <ListSkeleton rows={4} />}

                    {tab === "carts" ? (
                        <div className="admin-cards">
                            {carts?.length === 0 && (
                                <Empty icon={<IconCart size={32} />} title="Живых корзин нет">
                                    Здесь появятся клиенты, которые набрали товары, но ещё не отправили заявку
                                </Empty>
                            )}
                            {carts?.map((c) => {
                                const name = displayName(c.client.user);
                                return (
                                    <div key={c.cart_id} className="admin-card">
                                        <Link to={`${base}/admin/carts/${c.cart_id}`} className="admin-card-link">
                                            <Avatar name={name} photo={c.client.user.photo_url} />
                                            <div className="admin-card-text">
                                                <span className="admin-card-title">{name}</span>
                                                <span className="muted">
                                                    {positions(c.positions)} · {c.total_qty} шт · изменена {dateTime(c.updated_at)}
                                                </span>
                                                {c.client.note && <span className="admin-card-note">{c.client.note}</span>}
                                            </div>
                                            <span className="mono">{money(c.total)}</span>
                                        </Link>
                                        <Button variant="surface" size="md" icon={<IconBell size={18} />} disabled={!c.can_remind} onClick={() => remind(c)}>
                                            {c.can_remind ? "Напомнить" : `Напомнили ${c.reminded_at ? dateTime(c.reminded_at) : ""}`}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="admin-cards">
                            {!loading && orders.length === 0 && (
                                <Empty icon={<IconReceipt size={32} />} title="Заявок нет">
                                    {tab === "new" ? "Новые заявки придут сюда и в бот" : "В этом статусе пока пусто"}
                                </Empty>
                            )}
                            {orders.map((o) => (
                                <OrderCard key={o.id} order={o} />
                            ))}
                            {orders.length < total && (
                                <Button variant="surface" size="md" loading={loading} onClick={() => load(orders.length)}>
                                    Показать ещё
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <AdminTabs newOrders={summary?.new_orders} pendingClients={summary?.pending_clients} />
        </div>
    );
}

function OrderCard({ order }: { order: AdminOrder }) {
    const { base } = useSession();
    const name = displayName(order.client.user);
    return (
        <Link to={`${base}/admin/orders/${order.id}`} className="admin-card admin-card-link column">
            <div className="admin-card-row">
                <span className="admin-card-title">№{order.number}</span>
                <OrderStatusTag status={order.status} />
            </div>
            <div className="admin-card-row">
                <span className="admin-card-client">
                    {name}
                    {order.client.user.username && <span className="muted"> @{order.client.user.username}</span>}
                </span>
            </div>
            {order.client.note && <span className="admin-card-note">{order.client.note}</span>}
            <div className="admin-card-row">
                <span className="muted">
                    {dateTime(order.created_at)} · {positions(order.items.length)}
                    {order.comment ? " · есть комментарий" : ""}
                </span>
                <span className="mono">{money(order.total)}</span>
            </div>
        </Link>
    );
}
