import { Outlet, useParams } from "react-router-dom";
import { SessionProvider, useSession } from "../shared/session/SessionProvider";
import { CartProvider } from "../shared/cart/CartProvider";
import { AgeGate } from "../screens/Access/AgeGate";
import { AccessWait } from "../screens/Access/AccessWait";

// Гейт доступа тенанта: 18+ / ожидание одобрения / блокировка — по
// me.access с бэкенда. Сотрудники всегда проходят (access = ok).
function Gate() {
    const { me } = useSession();
    if (me.access === "age_required") return <AgeGate />;
    if (me.access === "pending") return <AccessWait kind="pending" />;
    if (me.access === "blocked") return <AccessWait kind="blocked" />;
    return (
        <CartProvider>
            <Outlet />
        </CartProvider>
    );
}

export function TenantRoot() {
    const { slug = "" } = useParams();
    return (
        <SessionProvider key={slug} slug={slug}>
            <Gate />
        </SessionProvider>
    );
}
