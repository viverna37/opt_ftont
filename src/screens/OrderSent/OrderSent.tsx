import { useNavigate, useParams } from "react-router-dom";
import { getMyOrder } from "../../shared/api/endpoints";
import { useSession } from "../../shared/session/SessionProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { money } from "../../shared/format/format";
import { Button } from "../../shared/ui/Button/Button";
import { IconCheck } from "../../shared/ui/icons/Icon";
import { openLink } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "./order_sent.css";

export function OrderSent() {
    const { orderId } = useParams();
    const { api, base, me } = useSession();
    const navigate = useNavigate();
    useBackButton(`${base}/catalog`);
    const { data: order } = useLoad(() => getMyOrder(api, Number(orderId)), [api, orderId]);
    const manager = me.tenant.manager_username;

    return (
        <div className="screen order-sent">
            <div className="order-sent-body">
                <span className="order-sent-icon">
                    <IconCheck size={30} strokeWidth={2.4} />
                </span>
                <h1 className="order-sent-title">Заявка{order ? ` №${order.number}` : ""} отправлена менеджеру</h1>
                <p className="order-sent-text">
                    Менеджер {me.tenant.name} свяжется с вами в Telegram, подтвердит наличие и договорится о доставке. Копию заявки
                    прислали в чат с ботом.
                </p>
                {order && (
                    <div className="order-sent-sum">
                        <span className="muted">{order.items.length} поз. на сумму</span>
                        <span className="mono">{money(order.total)}</span>
                    </div>
                )}
            </div>
            <div className="order-sent-actions">
                {manager && (
                    <Button variant="surface" onClick={() => openLink(`https://t.me/${manager}`)}>
                        Написать менеджеру
                    </Button>
                )}
                <Button variant="surface" onClick={() => navigate(`${base}/orders`, { replace: true })}>
                    Мои заявки
                </Button>
                <Button onClick={() => navigate(`${base}/catalog`, { replace: true })}>Вернуться в каталог</Button>
            </div>
        </div>
    );
}
