// Тонкие обёртки над Telegram.WebApp, чтобы экраны не проверяли наличие SDK
// сами. В обычном браузере (dev-режим) всё молча ничего не делает, а
// MainButton/BackButton подменяются на экранные кнопки (см. useMainButton).

export function tg() {
    const app = window.Telegram?.WebApp;
    // telegram-web-app.js создаёт объект и вне Telegram — отличаем по initData
    return app && app.initData ? app : undefined;
}

export function haptic(kind: "light" | "medium" | "success" | "warning" | "error" | "select" = "light") {
    const h = tg()?.HapticFeedback;
    if (!h) return;
    if (kind === "light" || kind === "medium") h.impactOccurred(kind);
    else if (kind === "select") h.selectionChanged();
    else h.notificationOccurred(kind);
}

export function showBackButton(onClick: () => void) {
    const app = tg();
    if (!app) return () => {};
    app.BackButton.onClick(onClick);
    app.BackButton.show();
    return () => {
        app.BackButton.hide();
        app.BackButton.offClick(onClick);
    };
}

// Ссылки t.me внутри Telegram открываем через openTelegramLink — иначе
// WebView пытается открыть их как обычную страницу.
export function openLink(url: string) {
    const app = tg();
    if (app && url.startsWith("https://t.me/")) {
        app.openTelegramLink(url);
    } else if (app && url.startsWith("tg://")) {
        app.openLink(url);
    } else {
        window.open(url, "_blank", "noopener");
    }
}

export function confirmDialog(message: string): Promise<boolean> {
    const app = tg();
    if (app && app.isVersionAtLeast("6.2")) {
        return new Promise((resolve) => app.showConfirm(message, resolve));
    }
    return Promise.resolve(window.confirm(message));
}

export function paintChrome(color: string) {
    const app = tg();
    if (!app || !app.isVersionAtLeast("6.1")) return;
    try {
        app.setHeaderColor(color);
        app.setBackgroundColor(color);
        app.setBottomBarColor?.("#15181B");
    } catch {
        // старые клиенты не принимают hex — не критично
    }
}
