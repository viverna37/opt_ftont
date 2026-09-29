import { adminAudit } from "../../shared/api/endpoints";
import type { AuditEntry } from "../../shared/api/types";
import { useSession } from "../../shared/session/SessionProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { dateTime, ORDER_STATUS } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { useBackButton } from "../../shared/platform/useBackButton";
import type { OrderStatus } from "../../shared/api/types";
import "./settings.css";

const ENTITY: Record<string, string> = {
    product: "Товар",
    variant: "Вариант",
    order: "Заявка",
    category: "Категория",
    attribute: "Характеристика",
    price_tier: "Уровень цены",
    client: "Клиент",
    cart: "Корзина",
    settings: "Настройки",
};

const ACTION: Record<string, string> = {
    create: "добавлен(а)",
    update: "изменён(а)",
    delete: "удалён(а)",
    prices: "— цены обновлены",
    stock: "— наличие изменено",
    remind: "— отправлено напоминание",
};

// «Последние изменения» из макета сводки — человекочитаемый аудит-лог
function describe(e: AuditEntry): string {
    const data = e.data ?? {};
    const name = typeof data.name === "string" ? ` «${data.name}»` : typeof data.label === "string" ? ` «${data.label}»` : typeof data.key === "string" ? ` ${data.key}` : "";
    const entity = ENTITY[e.entity] ?? e.entity;
    if (e.entity === "order" && e.action === "status") {
        const to = ORDER_STATUS[data.to as OrderStatus]?.label ?? String(data.to);
        return `Заявка #${e.entity_id} → ${to}`;
    }
    if (e.entity === "client" && typeof data.status === "string") {
        return data.status === "active" ? "Открыт доступ клиенту" : data.status === "blocked" ? "Клиент заблокирован" : "Статус клиента изменён";
    }
    if (e.entity === "product" && e.action === "stock") {
        return `Товар #${e.entity_id}: ${data.stock_status === "out" ? "нет в наличии" : "в наличии"}`;
    }
    return `${entity}${name || (e.entity_id ? ` #${e.entity_id}` : "")} ${ACTION[e.action] ?? e.action}`;
}

export function AuditLog() {
    const { api, base } = useSession();
    useBackButton(`${base}/admin/settings`);
    const { data, error, loading } = useLoad(() => adminAudit(api, { limit: 200 }), [api]);

    return (
        <div className="screen">
            <div className="screen-scroll">
                <TopBar back={`${base}/admin/settings`} title="Журнал изменений" />
                <div className="screen-pad">
                    {error && <Banner tone="danger">{error}</Banner>}
                    {loading && !data && <ListSkeleton />}
                    {data?.length === 0 && <Empty title="Изменений пока нет" />}
                    <div className="row-list">
                        {data?.map((e) => (
                            <div key={e.id} className="audit-row">
                                <span className="mono">{dateTime(e.created_at)}</span>
                                <span>{describe(e)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
