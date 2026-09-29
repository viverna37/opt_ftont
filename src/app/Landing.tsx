import { Navigate } from "react-router-dom";
import { tg } from "../shared/platform/telegram";
import { ErrorScreen } from "../screens/ErrorScreen/ErrorScreen";

// Корень без slug: бот может открыть мини-апп по t.me/bot?startapp={slug} —
// тогда slug приходит в start_param. В dev можно задать VITE_DEV_TENANT.
export function Landing() {
    const slug = tg()?.initDataUnsafe.start_param || (import.meta.env.DEV ? (import.meta.env.VITE_DEV_TENANT as string | undefined) : undefined);
    if (slug && /^[a-z0-9_-]+$/i.test(slug)) {
        return <Navigate to={`/t/${slug}`} replace />;
    }
    return <ErrorScreen title="Каталог не выбран" description="Откройте каталог по кнопке в боте вашего оптовика" />;
}
