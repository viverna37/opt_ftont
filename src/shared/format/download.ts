// Скачивание файла из ответа API (Excel-выгрузки). Ручки требуют заголовки
// авторизации, поэтому качаем blob через fetch и отдаём браузеру через <a download>.
// На мобильных Telegram WebView может не дать сохранить файл — тогда
// лучше открыть админку в Telegram Desktop.
export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // запасной путь для WebView без Clipboard API
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        return ok;
    }
}
