import { Link } from "react-router-dom";
import { listMyOrders } from "../../shared/api/endpoints";
import { useSession } from "../../shared/session/SessionProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { dateTime, money, positions } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { OrderStatusTag } from "../../shared/ui/OrderItems/OrderItems";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { IconReceipt } from "../../shared/ui/icons/Icon";
import { ClientTabs } from "../../shared/ui/Tabs/Tabs";
import "./my_orders.css";

export function MyOrders() {
    const { api, base } = useSession();
    const { data, error, loading } = useLoad(() => listMyOrders(api, { limit: 100 }), [api]);

    return (
        <div className="screen">
            <div className="screen-scroll with-tabbar">
                <TopBar title="Мои заявки" size="lg" />
                <div className="screen-pad">
                    {error && <Banner tone="danger">{error}</Banner>}
                    {loading && !data && <ListSkeleton rows={4} />}
                    {data?.items.length === 0 && (
                        <Empty icon={<IconReceipt size={36} />} title="Заявок пока нет">
                            Соберите корзину и отправьте её менеджеру — заявка появится здесь
                        </Empty>
                    )}
                    <div className="my-orders">
                        {data?.items.map((o) => (
                            <Link key={o.id} to={`${base}/orders/${o.id}`} className="my-order">
                                <div className="my-order-top">
                                    <span className="my-order-number">Заявка №{o.number}</span>
                                    <OrderStatusTag status={o.status} />
                                </div>
                                <span className="my-order-items">
                                    {o.items
                                        .slice(0, 3)
                                        .map((i) => (i.variant_name ? `${i.product_name} — ${i.variant_name}` : i.product_name))
                                        .join(", ")}
                                    {o.items.length > 3 ? ` и ещё ${o.items.length - 3}` : ""}
                                </span>
                                <div className="my-order-bottom">
                                    <span className="muted">
                                        {dateTime(o.created_at)} · {positions(o.items.length)}
                                    </span>
                                    <span className="mono">{money(o.total)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <ClientTabs />
        </div>
    );
}
