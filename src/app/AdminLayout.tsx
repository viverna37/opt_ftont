import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../shared/session/SessionProvider";
import { setStaffMode } from "../shared/local/storage";
import { AnimatedOutlet } from "../shared/ui/AnimatedOutlet/AnimatedOutlet";

// Админка — только сотрудникам (owner/admin/manager). Бэкенд всё равно
// проверяет роль на каждой ручке, это только чтобы не показывать пустые экраны.
export function AdminLayout() {
    const { me, slug, base } = useSession();
    useEffect(() => {
        if (me.is_staff) setStaffMode(slug, "admin");
    }, [me.is_staff, slug]);
    if (!me.is_staff) return <Navigate to={`${base}/catalog`} replace />;
    return <AnimatedOutlet />;
}
