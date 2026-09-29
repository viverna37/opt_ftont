import { createContext, useContext, type ReactNode } from "react";
import { usePlatformInit } from "./usePlatformInit";
import { ErrorScreen } from "../../screens/ErrorScreen/ErrorScreen";

type PlatformContextValue = {
    initData: string;
    devUserId: string | null;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
    const init = usePlatformInit();

    if (init.status === "loading") {
        return null;
    }

    if (init.status === "error") {
        return (
            <ErrorScreen
                title="Откройте каталог через Telegram"
                description="Это мини-приложение работает внутри бота оптовика"
            />
        );
    }

    return (
        <PlatformContext.Provider value={{ initData: init.initData, devUserId: init.devUserId }}>
            {children}
        </PlatformContext.Provider>
    );
}

export function usePlatform(): PlatformContextValue {
    const ctx = useContext(PlatformContext);
    if (!ctx) {
        throw new Error("usePlatform() must be used within <PlatformProvider>");
    }
    return ctx;
}
