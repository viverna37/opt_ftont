import { useCallback, useEffect, useState } from "react";
import { listClients, updateClient } from "../../shared/api/endpoints";
import type { Client, MemberStatus, Role } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { dateTime, displayName, plural, ROLE_LABEL, seenAgo } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconChat, IconMore, IconSearch, IconUsers } from "../../shared/ui/icons/Icon";
import { Segmented } from "../../shared/ui/Segmented/Segmented";
import { Avatar } from "../../shared/ui/Avatar/Avatar";
import { Tag } from "../../shared/ui/Tag/Tag";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { AdminTabs } from "../../shared/ui/Tabs/Tabs";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic, openLink } from "../../shared/platform/telegram";
import "./admin_clients.css";

type Tab = "pending" | "clients" | "blocked" | "staff";

export function AdminClients() {
    const { api, me } = useSession();
    const toast = useToast();
    const approval = me.tenant.access_mode === "approval";
    const [tab, setTab] = useState<Tab>(approval ? "pending" : "clients");
    const [q, setQ] = useState("");
    const [items, setItems] = useState<Client[] | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Client | null>(null);

    const load = useCallback(async () => {
        setError(null);
        const params: Record<string, string> = { limit: "200" };
        if (q.trim()) params.q = q.trim();
        if (tab === "pending") params.status = "pending";
        if (tab === "blocked") params.status = "blocked";
        if (tab === "clients") {
            params.status = "active";
            params.role = "client";
        }
        try {
            const [page, pending] = await Promise.all([listClients(api, params), listClients(api, { status: "pending", limit: 1 })]);
            setItems(tab === "staff" ? page.items.filter((c) => c.role !== "client") : page.items);
            setPendingCount(pending.total);
        } catch (e) {
            setError(errorText(e));
        }
    }, [api, q, tab]);

    useEffect(() => {
        const t = window.setTimeout(load, q ? 300 : 0);
        return () => window.clearTimeout(t);
    }, [load, q]);

    const patch = async (client: Client, body: { status?: MemberStatus; role?: Role; note?: string }, message?: string) => {
        try {
            const updated = await updateClient(api, client.tenant_user_id, body);
            haptic("success");
            if (message) toast.show(message, "success");
            setSelected((s) => (s && s.tenant_user_id === updated.tenant_user_id ? updated : s));
            await load();
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    const tabs: { value: Tab; label: string }[] = [
        ...(approval || pendingCount ? [{ value: "pending" as Tab, label: `Заявки · ${pendingCount}` }] : []),
        { value: "clients", label: "С доступом" },
        { value: "blocked", label: "Блок" },
        { value: "staff", label: "Команда" },
    ];

    return (
        <div className="screen">
            <div className="screen-scroll with-tabbar">
                <TopBar title="Клиенты" size="lg" />
                <div className="screen-pad clients-body">
                    <Segmented options={tabs} value={tab} onChange={setTab} />
                    <div className="ap-search clients-search">
                        <IconSearch size={18} strokeWidth={2} />
                        <label htmlFor="cq" className="sr-only">
                            Поиск клиента
                        </label>
                        <input id="cq" placeholder="Имя, @username или заметка" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    {error && <Banner tone="danger">{error}</Banner>}
                    {!items && !error && <ListSkeleton rows={5} />}
                    {items?.length === 0 && (
                        <Empty icon={<IconUsers size={32} />} title={tab === "pending" ? "Новых заявок на доступ нет" : "Никого не нашлось"}>
                            {tab === "clients" && !q ? "Клиенты появятся, когда откроют каталог в боте" : undefined}
                        </Empty>
                    )}

                    {tab === "pending" ? (
                        <div className="clients-cards">
                            {items?.map((c) => {
                                const name = displayName(c.user);
                                return (
                                    <div key={c.tenant_user_id} className="client-req">
                                        <div className="client-req-top">
                                            <Avatar name={name} photo={c.user.photo_url} />
                                            <div className="client-req-text">
                                                <span className="client-req-name">{name}</span>
                                                <span className="muted">
                                                    {c.user.username ? `@${c.user.username}` : `id ${c.user.telegram_id}`} · {dateTime(c.first_seen)}
                                                </span>
                                            </div>
                                            <button type="button" className="client-req-write" aria-label="Написать" onClick={() => openLink(c.contact_url)}>
                                                <IconChat size={18} />
                                            </button>
                                        </div>
                                        <div className="client-req-actions">
                                            <Button size="md" onClick={() => patch(c, { status: "active" }, "Доступ открыт")}>
                                                Открыть доступ
                                            </Button>
                                            <Button variant="surface" size="md" style={{ width: "auto" }} onClick={() => patch(c, { status: "blocked" }, "Отклонено")}>
                                                Отклонить
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="row-list">
                            {items?.map((c) => {
                                const name = displayName(c.user);
                                return (
                                    <button key={c.tenant_user_id} type="button" className="client-row" onClick={() => setSelected(c)}>
                                        <Avatar name={c.note || name} photo={c.user.photo_url} />
                                        <span className="client-row-text">
                                            <span className="client-row-name">{c.note || name}</span>
                                            <span className="muted">
                                                {c.note ? `${name} · ` : ""}
                                                {c.role !== "client" ? ROLE_LABEL[c.role] : `заходил ${seenAgo(c.last_seen)}`}
                                                {c.orders_count ? ` · ${c.orders_count} ${plural(c.orders_count, "заявка", "заявки", "заявок")}` : ""}
                                            </span>
                                        </span>
                                        <IconMore size={20} />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <AdminTabs pendingClients={pendingCount} />
            <ClientSheet client={selected} onClose={() => setSelected(null)} onPatch={patch} />
        </div>
    );
}

type SheetProps = {
    client: Client | null;
    onClose: () => void;
    onPatch: (client: Client, body: { status?: MemberStatus; role?: Role; note?: string }, message?: string) => Promise<void>;
};

// Карточка клиента: заметка (видит только менеджер), блокировка, роль (только владелец)
function ClientSheet({ client, onClose, onPatch }: SheetProps) {
    const { me } = useSession();
    const [note, setNote] = useState("");
    useEffect(() => setNote(client?.note ?? ""), [client]);
    if (!client) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

    const name = displayName(client.user);
    const isSelf = client.tenant_user_id === me.id;
    const canRole = me.role === "owner" && client.role !== "owner" && !isSelf;
    const canBlock = !isSelf && client.role !== "owner" && (client.role === "client" || me.role === "owner");

    return (
        <Sheet open={!!client} onClose={onClose} title={name}>
            <div className="client-sheet-head">
                <Avatar name={name} photo={client.user.photo_url} size={56} />
                <div className="client-req-text">
                    <span className="muted">{client.user.username ? `@${client.user.username}` : `id ${client.user.telegram_id}`}</span>
                    <span className="muted">
                        Первый вход {dateTime(client.first_seen)} · последний {seenAgo(client.last_seen)}
                    </span>
                    <span>
                        {client.status === "blocked" && <Tag tone="danger">Заблокирован</Tag>} {client.status === "pending" && <Tag tone="low">Ждёт доступа</Tag>}{" "}
                        {client.role !== "client" && <Tag tone="info">{ROLE_LABEL[client.role]}</Tag>}
                    </span>
                </div>
            </div>
            <Button variant="surface" size="md" icon={<IconChat size={18} />} onClick={() => openLink(client.contact_url)}>
                Написать в Telegram
            </Button>
            <div className="field">
                <label htmlFor="cnote">Заметка (клиент не видит)</label>
                <input
                    id="cnote"
                    value={note}
                    maxLength={2000}
                    placeholder="Например: магазин «Пар», Бузулук"
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => note.trim() !== (client.note ?? "") && onPatch(client, { note }, "Заметка сохранена")}
                />
            </div>
            {canRole && (
                <div className="field">
                    <label htmlFor="crole">Роль</label>
                    <select id="crole" value={client.role} onChange={(e) => onPatch(client, { role: e.target.value as Role }, "Роль изменена")}>
                        <option value="client">Клиент</option>
                        <option value="manager">Менеджер — заявки, товары, клиенты</option>
                        <option value="admin">Админ — плюс настройки каталога</option>
                    </select>
                </div>
            )}
            {canBlock &&
                (client.status === "blocked" ? (
                    <Button size="md" onClick={() => onPatch(client, { status: "active" }, "Доступ открыт")}>
                        Разблокировать
                    </Button>
                ) : (
                    <>
                        {client.status === "pending" && (
                            <Button size="md" onClick={() => onPatch(client, { status: "active" }, "Доступ открыт")}>
                                Открыть доступ
                            </Button>
                        )}
                        <Button variant="danger" size="md" onClick={() => onPatch(client, { status: "blocked" }, "Заблокирован")}>
                            Заблокировать
                        </Button>
                    </>
                ))}
        </Sheet>
    );
}
