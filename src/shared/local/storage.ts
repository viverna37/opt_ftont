// localStorage может бросать (приватный режим, отключённое хранилище) —
// всё здесь только удобства, без них приложение работает.

export function readLocal(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeLocal(key: string, value: string) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // не критично
    }
}

// Режим сотрудника (админка / витрина глазами клиента) — как «последний режим» в такси
export type StaffMode = "admin" | "catalog";
export const getStaffMode = (slug: string): StaffMode => (readLocal(`mode:${slug}`) === "catalog" ? "catalog" : "admin");
export const setStaffMode = (slug: string, mode: StaffMode) => writeLocal(`mode:${slug}`, mode);

// Черновик комментария к заявке — переживает закрытие мини-аппа
export const getCommentDraft = (slug: string) => readLocal(`comment:${slug}`) ?? "";
export const setCommentDraft = (slug: string, text: string) => writeLocal(`comment:${slug}`, text);
