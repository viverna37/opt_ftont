import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createApiClient, errorText, type ApiClient } from "../api/client";
import { getMe } from "../api/endpoints";
import type { Me } from "../api/types";
import { usePlatform } from "../platform/PlatformProvider";
import { applyAccent } from "../format/branding";
import { setCurrency } from "../format/format";
import { ScreenLoader } from "../ui/Spinner/Spinner";
import { ErrorScreen } from "../../screens/ErrorScreen/ErrorScreen";

type SessionValue = {
    slug: string;
    api: ApiClient;
    me: Me;
    setMe: (me: Me) => void;
    reloadMe: () => Promise<void>;
    base: string; // префикс маршрутов тенанта: /t/{slug}
};

const SessionContext = createContext<SessionValue | null>(null);

// Сессия внутри одного тенанта (/t/:slug): API-клиент с X-Tenant и текущий
// участник (/v1/me). Регистрации нет — первый же /v1/me заводит пользователя.
export function SessionProvider({ slug, children }: { slug: string; children: ReactNode }) {
    const { initData, devUserId } = usePlatform();
    const api = useMemo(() => createApiClient(slug, initData, devUserId), [slug, initData, devUserId]);
    const [me, setMeState] = useState<Me | null>(null);
    const [error, setError] = useState<{ text: string; notFound: boolean } | null>(null);

    const setMe = useCallback((next: Me) => {
        setMeState(next);
        setCurrency(next.tenant.currency);
        applyAccent(next.tenant.accent_color);
    }, []);

    const reloadMe = useCallback(async () => {
        try {
            setMe(await getMe(api));
            setError(null);
        } catch (e) {
            const notFound = typeof e === "object" && e !== null && "status" in e && (e as { status: number }).status === 404;
            setError({ text: errorText(e, "Не удалось загрузить каталог"), notFound });
        }
    }, [api, setMe]);

    useEffect(() => {
        void reloadMe();
    }, [reloadMe]);

    if (error && !me) {
        return error.notFound ? (
            <ErrorScreen title="Каталог не найден" description="Проверьте ссылку или откройте каталог из бота оптовика" />
        ) : (
            <ErrorScreen title="Не удалось открыть каталог" description={error.text} actionText="Повторить" onAction={reloadMe} />
        );
    }
    if (!me) {
        return (
            <div className="screen">
                <ScreenLoader />
            </div>
        );
    }

    return (
        <SessionContext.Provider value={{ slug, api, me, setMe, reloadMe, base: `/t/${slug}` }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession(): SessionValue {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession() must be used within <SessionProvider>");
    return ctx;
}
