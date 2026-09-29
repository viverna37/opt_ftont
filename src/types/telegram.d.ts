export {};

interface TelegramWebAppUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

interface TelegramBottomButton {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    setText: (text: string) => TelegramBottomButton;
    setParams: (params: {
        text?: string;
        color?: string;
        text_color?: string;
        is_active?: boolean;
        is_visible?: boolean;
    }) => TelegramBottomButton;
    onClick: (cb: () => void) => TelegramBottomButton;
    offClick: (cb: () => void) => TelegramBottomButton;
    show: () => TelegramBottomButton;
    hide: () => TelegramBottomButton;
    enable: () => TelegramBottomButton;
    disable: () => TelegramBottomButton;
    showProgress: (leaveActive?: boolean) => TelegramBottomButton;
    hideProgress: () => TelegramBottomButton;
}

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramWebAppUser;
        start_param?: string;
        auth_date?: number;
        hash?: string;
    };
    platform: string;
    version: string;
    ready: () => void;
    expand: () => void;
    close: () => void;
    isVersionAtLeast: (version: string) => boolean;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setBottomBarColor?: (color: string) => void;
    disableVerticalSwipes?: () => void;
    openTelegramLink: (url: string) => void;
    openLink: (url: string) => void;
    showConfirm: (message: string, cb: (ok: boolean) => void) => void;
    MainButton: TelegramBottomButton;
    BackButton: {
        show: () => void;
        hide: () => void;
        onClick: (cb: () => void) => void;
        offClick: (cb: () => void) => void;
    };
    HapticFeedback?: {
        impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
        notificationOccurred: (type: "error" | "success" | "warning") => void;
        selectionChanged: () => void;
    };
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}
