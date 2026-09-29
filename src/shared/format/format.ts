import type { OrderStatus, Role, StockStatus } from "../api/types";

const SIGNS: Record<string, string> = { RUB: "₽", USD: "$", EUR: "€", KZT: "₸", BYN: "Br", UZS: "сум" };

let currentCurrency = "RUB";

// Валюта одна на тенанта — выставляется при входе, чтобы не таскать её в каждый вызов
export function setCurrency(code: string) {
    currentCurrency = code;
}

// 145000 копеек -> «1 450 ₽», 145050 -> «1 450,50 ₽»
export function money(kopecks: number | null | undefined): string {
    if (kopecks == null) return "—";
    const rub = Math.floor(Math.abs(kopecks) / 100);
    const rest = Math.abs(kopecks) % 100;
    // разряды обычным пробелом: toLocaleString даёт неразрывные, в моноширинном шрифте они шире
    const whole = String(rub).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const text = rest ? `${whole},${String(rest).padStart(2, "0")}` : whole;
    return `${kopecks < 0 ? "-" : ""}${text} ${SIGNS[currentCurrency] ?? currentCurrency}`;
}

// «320» / «320,5» из поля ввода -> копейки; пусто/мусор -> null
export function parseMoney(input: string): number | null {
    const normalized = input.replace(/\s/g, "").replace(",", ".");
    if (!normalized) return null;
    const value = Number(normalized);
    return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}

export function moneyInput(kopecks: number | null | undefined): string {
    if (kopecks == null) return "";
    return kopecks % 100 ? (kopecks / 100).toFixed(2).replace(".", ",") : String(kopecks / 100);
}

export function plural(n: number, one: string, few: string, many: string): string {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
}

export const positions = (n: number) => `${n} ${plural(n, "позиция", "позиции", "позиций")}`;

const pad = (n: number) => String(n).padStart(2, "0");

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// «сегодня, 14:20» / «вчера, 19:02» / «12.09, 10:15»
export function dateTime(iso: string): string {
    const d = new Date(iso);
    const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (days === 0) return `сегодня, ${time}`;
    if (days === 1) return `вчера, ${time}`;
    const year = d.getFullYear() === new Date().getFullYear() ? "" : `.${d.getFullYear()}`;
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}${year}, ${time}`;
}

export function shortDate(iso: string): string {
    const d = new Date(iso);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

// «заходил сегодня / вчера / 3 дня назад / неделю назад»
export function seenAgo(iso: string): string {
    const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000);
    if (days <= 0) return "сегодня";
    if (days === 1) return "вчера";
    if (days < 7) return `${days} ${plural(days, "день", "дня", "дней")} назад`;
    if (days < 14) return "неделю назад";
    if (days < 31) return `${Math.floor(days / 7)} нед. назад`;
    return shortDate(iso);
}

export function isToday(iso: string): boolean {
    return startOfDay(new Date(iso)) === startOfDay(new Date());
}

export const STOCK: Record<StockStatus, { label: string; tone: "ok" | "low" | "out" }> = {
    in_stock: { label: "В наличии", tone: "ok" },
    low: { label: "Мало", tone: "low" },
    out: { label: "Нет", tone: "out" },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "info" | "low" | "ok" | "out" }> = {
    new: { label: "Новая", tone: "low" },
    in_progress: { label: "В работе", tone: "info" },
    done: { label: "Выполнена", tone: "ok" },
    cancelled: { label: "Отменена", tone: "out" },
};

export const ROLE_LABEL: Record<Role, string> = {
    owner: "Владелец",
    admin: "Админ",
    manager: "Менеджер",
    client: "Клиент",
};

export function displayName(user: { first_name: string | null; last_name: string | null; username: string | null; telegram_id: number }) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    return name || (user.username ? `@${user.username}` : `id ${user.telegram_id}`);
}

export function initials(text: string): string {
    const letters = text.replace(/[«»"@]/g, "").trim().split(/\s+/).map((w) => w[0]);
    return (letters.slice(0, 2).join("") || "?").toUpperCase();
}

export function attrText(value: { value: string | number | boolean; unit: string | null; type: string; label: string }): string {
    if (value.type === "bool") return value.value ? value.label : `Без: ${value.label.toLowerCase()}`;
    const text = typeof value.value === "number" ? String(value.value).replace(".", ",") : String(value.value);
    return value.unit ? `${text} ${value.unit}` : text;
}
