import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyOrder, repeatOrder } from "../../shared/api/endpoints";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { useCart } from "../../shared/cart/CartProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { dateTime } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { OrderItems, OrderStatusTag } from "../../shared/ui/OrderItems/OrderItems";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { MainAction } from "../../shared/ui/MainAction/MainAction";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "./my_orders.css";

export function MyOrderDetail() {
    const { orderId } = useParams();
    const { api, base } = useSession();
    const cart = useCart();
    const toast = useToast();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [skipped, setSkipped] = useState<string[]>([]);
    useBackButton(`${base}/orders`);
    const { data: order, error } = useLoad(() => getMyOrder(api, Number(orderId)), [api, orderId]);

    // «Повторить»: позиции снова в корзину; то, чего уже нет, показываем списком
    const repeat = async () => {
        setBusy(true);
        try {
            const res = await repeatOrder(api, Number(orderId));
            await cart.refresh();
            haptic("success");
            if (res.skipped.length) {
                setSkipped(res.skipped);
                toast.show(`Добавлено позиций: ${res.added}`);
            } else {
                navigate(`${base}/cart`);
            }
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back={`${base}/orders`} title={order ? `Заявка №${order.number}` : "Заявка"} />
                {!order && !error && <ScreenLoader />}
                {error && (
                    <div className="screen-pad">
                        <Banner tone="danger">{error}</Banner>
                    </div>
                )}
                {order && (
                    <div className="screen-pad">
                        <div className="detail-meta">
                            <span className="muted">от {dateTime(order.created_at)}</span>
                            <OrderStatusTag status={order.status} />
                        </div>
                        {skipped.length > 0 && (
                            <Banner tone="low">
                                Не добавлены — нет в наличии или сняты с продажи: {skipped.join(", ")}
                            </Banner>
                        )}
                        <OrderItems items={order.items} total={order.total} comment={order.comment} />
                        <p className="muted">Цены — на момент отправки. При повторе корзина пересчитается по текущему прайсу.</p>
                    </div>
                )}
            </div>
            {order && <MainAction text="Повторить заявку" onClick={repeat} loading={busy} />}
        </div>
    );
}
