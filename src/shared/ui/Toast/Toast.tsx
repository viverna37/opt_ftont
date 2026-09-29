import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import "./toast.css";

type Tone = "default" | "danger" | "success";
type ToastValue = { show: (text: string, tone?: Tone) => void };

const ToastContext = createContext<ToastValue | null>(null);

// Короткие сообщения поверх экрана: «Скопировано», ошибки синхронизации корзины и т.п.
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<{ text: string; tone: Tone; id: number } | null>(null);
    const timer = useRef<number | undefined>(undefined);

    const show = useCallback((text: string, tone: Tone = "default") => {
        window.clearTimeout(timer.current);
        setToast({ text, tone, id: Date.now() });
        timer.current = window.setTimeout(() => setToast(null), 2600);
    }, []);

    const value = useMemo(() => ({ show }), [show]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-host" aria-live="polite">
                {toast && (
                    <div key={toast.id} className={`toast toast-${toast.tone}`}>
                        {toast.text}
                    </div>
                )}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast() must be used within <ToastProvider>");
    return ctx;
}
