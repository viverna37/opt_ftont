import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient, ApiError, errorText, type ApiClient } from "../../shared/api/client";
import { platformMe } from "../../shared/api/endpoints";
import type { PlatformMe } from "../../shared/api/types";
import { usePlatform } from "../../shared/platform/PlatformProvider";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { AnimatedOutlet } from "../../shared/ui/AnimatedOutlet/AnimatedOutlet";
import { ErrorScreen } from "../ErrorScreen/ErrorScreen";

// Откуда открыли «Платформу»: из каталога оптовика — initData подписана его
// ботом, бэкенду нужен X-Tenant, чтобы выбрать токен для проверки. Из бота
// платформы — без X-Tenant (проверка токеном PLATFORM_BOT_TOKEN).
export const PLATFORM_FROM_KEY = "platform_from";

type PlatformSession = { api: ApiClient; me: PlatformMe; from: string | null };
const Ctx = createContext<PlatformSession | null>(null);

export function PlatformRoot() {
    const { initData, devUserId } = usePlatform();
    const from = window.sessionStorage.getItem(PLATFORM_FROM_KEY);
    const api = useMemo(() => createApiClient(from, initData, devUserId), [from, initData, devUserId]);
    const [me, setMe] = useState<PlatformMe | null>(null);
    const [error, setError] = useState<{ text: string; forbidden: boolean } | null>(null);

    useEffect(() => {
        platformMe(api)
            .then(setMe)
            .catch((e) => setError({ text: errorText(e), forbidden: e instanceof ApiError && e.status === 403 }));
    }, [api]);

    if (error) {
        return error.forbidden ? (
            <ErrorScreen title="Раздел для владельца платформы" description="Ваш Telegram-аккаунт не указан в PLATFORM_ADMIN_IDS сервиса" />
        ) : (
            <ErrorScreen title="Не удалось открыть платформу" description={error.text} actionText="Повторить" onAction={() => window.location.reload()} />
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
        <Ctx.Provider value={{ api, me, from }}>
            <AnimatedOutlet />
        </Ctx.Provider>
    );
}

export function usePlatformSession(): PlatformSession {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("usePlatformSession() must be used within <PlatformRoot>");
    return ctx;
}

