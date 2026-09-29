import { useState } from "react";
import { useParams } from "react-router-dom";
import { getLiveCart, remindCart } from "../../shared/api/endpoints";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { dateTime, money, positions } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { ClientCard } from "../../shared/ui/ClientCard/ClientCard";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Tag } from "../../shared/ui/Tag/Tag";
import { MainAction } from "../../shared/ui/MainAction/MainAction";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "../../shared/ui/OrderItems/order_items.css";
import "./admin_orders.css";

// Живая корзина клиента: что набрал, но не отправил. «Напомнить» — бот
// пишет клиенту (не чаще раза в сутки).
export function AdminCartDetail() {
    const { cartId } = useParams();
    const { api, base } = useSession();
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    useBackButton(`${base}/admin/orders?tab=carts`);
    const { data, error, reload } = useLoad(() => getLiveCart(api, Number(cartId)), [api, cartId]);

    const remind = async () => {
        setBusy(true);
        try {
            await remindCart(api, Number(cartId));
            haptic("success");
            toast.show("Напоминание отправлено в бот", "success");
            await reload();
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back={`${base}/admin/orders?tab=carts`} title="Корзина клиента" subtitle={data ? `изменена ${dateTime(data.updated_at)}` : undefined} />
                {!data && !error && <ScreenLoader />}
                {error && (
                    <div className="screen-pad">
                        <Banner tone="danger">{error}</Banner>
                    </div>
                )}
                {data && (
                    <div className="screen-pad">
                        <ClientCard client={data.client} />
                        {data.reminded_at && <Banner>Последнее напоминание: {dateTime(data.reminded_at)}</Banner>}
                        <div className="order-items">
                            {data.cart.groups.map((g) =>
                                g.lines.map((l) => (
                                    <div key={l.variant_id} className="order-item">
                                        <div className="order-item-main">
                                            <span className="order-item-name">{g.product_name}</span>
                                            {l.variant_name && <span className="muted">{l.variant_name}</span>}
                                            <span className="order-item-price">
                                                <span className="mono">{l.qty}</span> × <span className="mono">{money(l.unit_price)}</span>
                                            </span>
                                            {l.problem === "unavailable" && <Tag tone="danger">Нет в наличии</Tag>}
                                        </div>
                                        <span className="mono order-item-sum">{money(l.amount)}</span>
                                    </div>
                                )),
                            )}
                            <div className="order-items-total">
                                <span>{positions(data.positions)}</span>
                                <span className="mono">{money(data.total)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {data && (
                <MainAction
                    text={data.can_remind ? "Напомнить клиенту" : "Уже напоминали сегодня"}
                    onClick={remind}
                    disabled={!data.can_remind}
                    loading={busy}
                />
            )}
        </div>
    );
}
