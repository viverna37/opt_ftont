import { useCart } from "../../cart/CartProvider";
import { useSession } from "../../session/SessionProvider";
import { TabBar } from "../TabBar/TabBar";
import { IconBox, IconCart, IconGrid, IconReceipt, IconSettings, IconUsers } from "../icons/Icon";

export function ClientTabs() {
    const { base } = useSession();
    const { totalQty } = useCart();
    return (
        <TabBar
            items={[
                { to: `${base}/catalog`, label: "Каталог", Icon: IconGrid },
                { to: `${base}/cart`, label: "Корзина", Icon: IconCart, badge: totalQty, end: true },
                { to: `${base}/orders`, label: "Заявки", Icon: IconReceipt },
            ]}
        />
    );
}

export function AdminTabs({ newOrders, pendingClients }: { newOrders?: number; pendingClients?: number }) {
    const { base } = useSession();
    return (
        <TabBar
            items={[
                { to: `${base}/admin/orders`, label: "Заявки", Icon: IconReceipt, badge: newOrders },
                { to: `${base}/admin/products`, label: "Товары", Icon: IconBox },
                { to: `${base}/admin/clients`, label: "Клиенты", Icon: IconUsers, badge: pendingClients },
                { to: `${base}/admin/settings`, label: "Настройки", Icon: IconSettings },
            ]}
        />
    );
}
