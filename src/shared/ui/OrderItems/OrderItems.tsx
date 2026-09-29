import type { OrderItem, OrderStatus } from "../../api/types";
import { money, ORDER_STATUS } from "../../format/format";
import { Tag } from "../Tag/Tag";
import "./order_items.css";

export function OrderStatusTag({ status }: { status: OrderStatus }) {
    return <Tag tone={ORDER_STATUS[status].tone}>{ORDER_STATUS[status].label}</Tag>;
}

// Позиции заявки — снимок на момент отправки (названия и цены не меняются задним числом)
export function OrderItems({ items, total, comment }: { items: OrderItem[]; total: number; comment?: string | null }) {
    return (
        <div className="order-items">
            {items.map((i) => (
                <div key={i.id} className="order-item">
                    <div className="order-item-main">
                        <span className="order-item-name">{i.product_name}</span>
                        {(i.variant_name || i.sku) && (
                            <span className="muted">
                                {i.variant_name}
                                {i.variant_name && i.sku ? " · " : ""}
                                {i.sku && <span className="mono">{i.sku}</span>}
                            </span>
                        )}
                        <span className="order-item-price">
                            <span className="mono">{i.qty}</span> × <span className="mono">{money(i.price)}</span>
                            {i.tier_label && <span className="muted"> · {i.tier_label}</span>}
                        </span>
                    </div>
                    <span className="mono order-item-sum">{money(i.amount)}</span>
                </div>
            ))}
            <div className="order-items-total">
                <span>Итого</span>
                <span className="mono">{money(total)}</span>
            </div>
            {comment && (
                <div className="order-items-comment">
                    <span className="field-label">Комментарий</span>
                    <p>{comment}</p>
                </div>
            )}
        </div>
    );
}
