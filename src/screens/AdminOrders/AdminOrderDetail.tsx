import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrder, getOrderText, getOrderXlsx, setOrderNote, setOrderStatus } from "../../shared/api/endpoints";
import type { OrderStatus } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { dateTime, ORDER_STATUS } from "../../shared/format/format";
import { copyText, downloadBlob } from "../../shared/format/download";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconCopy, IconDownload } from "../../shared/ui/icons/Icon";
import { ClientCard } from "../../shared/ui/ClientCard/ClientCard";
import { OrderItems } from "../../shared/ui/OrderItems/OrderItems";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "./admin_orders.css";

const STATUSES: OrderStatus[] = ["new", "in_progress", "done", "cancelled"];

export function AdminOrderDetail() {
    const { orderId } = useParams();
    const { api, base } = useSession();
    const toast = useToast();
    useBackButton(`${base}/admin/orders`);
    const { data: order, error, set } = useLoad(() => getOrder(api, Number(orderId)), [api, orderId]);
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState<OrderStatus | null>(null);

    useEffect(() => {
        if (order) setNote(order.manager_note ?? "");
    }, [order]);

    if (!order) {
        return (
            <div className="screen">
                <TopBar back={`${base}/admin/orders`} title="Заявка" />
                {error ? (
                    <div className="screen-pad">
                        <Banner tone="danger">{error}</Banner>
                    </div>
                ) : (
                    <ScreenLoader />
                )}
            </div>
        );
    }

    const changeStatus = async (status: OrderStatus) => {
        setBusy(status);
        try {
            set(await setOrderStatus(api, order.id, status));
            haptic("success");
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(null);
        }
    };

    const saveNote = async () => {
        if ((order.manager_note ?? "") === note.trim()) return;
        try {
            set(await setOrderNote(api, order.id, note));
            toast.show("Заметка сохранена");
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    const copy = async () => {
        try {
            const ok = await copyText(await getOrderText(api, order.id));
            toast.show(ok ? "Текст заявки скопирован" : "Не удалось скопировать", ok ? "default" : "danger");
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    const exportXlsx = async () => {
        try {
            downloadBlob(await getOrderXlsx(api, order.id), `zayavka-${order.number}.xlsx`);
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll">
                <TopBar back={`${base}/admin/orders`} title={`Заявка №${order.number}`} subtitle={dateTime(order.created_at)} />
                <div className="screen-pad">
                    <ClientCard client={order.client} />

                    <div className="admin-status-grid" role="group" aria-label="Статус заявки">
                        {STATUSES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`admin-status-btn ${order.status === s ? "on" : ""}`}
                                aria-pressed={order.status === s}
                                disabled={busy !== null}
                                onClick={() => changeStatus(s)}
                            >
                                {busy === s ? "…" : ORDER_STATUS[s].label}
                            </button>
                        ))}
                    </div>

                    <OrderItems items={order.items} total={order.total} comment={order.comment} />

                    <div className="admin-actions">
                        <Button variant="surface" size="md" icon={<IconCopy size={18} />} onClick={copy}>
                            Скопировать текстом
                        </Button>
                        <Button variant="surface" size="md" icon={<IconDownload size={18} />} onClick={exportXlsx}>
                            Excel
                        </Button>
                    </div>

                    <div className="field">
                        <label htmlFor="note">Заметка менеджера (клиент не видит)</label>
                        <textarea id="note" value={note} maxLength={4000} placeholder="Например: отгрузить в пятницу, счёт выставлен" onChange={(e) => setNote(e.target.value)} onBlur={saveNote} />
                    </div>

                    {order.history.length > 0 && (
                        <>
                            <h2 className="section-title">История</h2>
                            <div className="history">
                                {order.history
                                    .slice()
                                    .reverse()
                                    .map((h, i) => (
                                        <div key={i} className="history-row">
                                            <span className="mono">{dateTime(h.created_at)}</span>
                                            <span>{h.from_status ? `${ORDER_STATUS[h.from_status].label} → ${ORDER_STATUS[h.to_status].label}` : "Заявка отправлена"}</span>
                                        </div>
                                    ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
