import { Navigate } from "react-router-dom";
import { useSession } from "../shared/session/SessionProvider";
import { getStaffMode } from "../shared/local/storage";

// Вход в /t/{slug}: сотрудник попадает в админку (или в витрину, если
// последний раз переключался на неё), клиент — в каталог.
export function StartRedirect() {
    const { me, slug, base } = useSession();
    if (me.is_staff && getStaffMode(slug) === "admin") return <Navigate to={`${base}/admin/orders`} replace />;
    return <Navigate to={`${base}/catalog`} replace />;
}
