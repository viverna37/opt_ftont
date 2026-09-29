import { useEffect, useState } from "react";
import { paintChrome, tg } from "./telegram";

export type PlatformInit =
    | { status: "loading" }
    | { status: "ready"; initData: string; devUserId: string | null }
    | { status: "error" };

// window.Telegram.WebApp приходит синхронно из <script> в index.html.
// Вне Telegram работаем только в dev: VITE_DEV_TG_USER_ID уходит в
// X-Tg-User-Id (бэкенд должен быть запущен с DEV_AUTH=true).
export function usePlatformInit(): PlatformInit {
    const [state, setState] = useState<PlatformInit>({ status: "loading" });

    useEffect(() => {
        const app = tg();
        if (app) {
            app.ready();
            app.expand();
            app.disableVerticalSwipes?.();
            paintChrome("#111316");
            setState({ status: "ready", initData: app.initData, devUserId: null });
            return;
        }
        // ?dev_user=42 — посмотреть каталог другим пользователем (клиент/сотрудник), только в dev
        const fromUrl = new URLSearchParams(window.location.search).get("dev_user");
        if (fromUrl) {
            window.sessionStorage.setItem("dev_user", fromUrl);
            const url = new URL(window.location.href);
            url.searchParams.delete("dev_user");
            window.history.replaceState(null, "", url);
        }
        const devUserId = window.sessionStorage.getItem("dev_user") ?? (import.meta.env.VITE_DEV_TG_USER_ID as string | undefined) ?? "";
        if (import.meta.env.DEV && devUserId) {
            setState({ status: "ready", initData: "", devUserId });
            return;
        }
        setState({ status: "error" });
    }, []);

    return state;
}
