import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, errorText } from "../api/client";
import { getCart, setCartQty } from "../api/endpoints";
import type { Cart } from "../api/types";
import { useSession } from "../session/SessionProvider";
import { haptic } from "../platform/telegram";
import { useToast } from "../ui/Toast/Toast";

const SYNC_DELAY_MS = 450;

type CartValue = {
    cart: Cart | null;
    loading: boolean;
    syncing: boolean;
    qtyOf: (variantId: number) => number;
    totalQty: number;
    setQty: (variantId: number, qty: number) => void;
    refresh: () => Promise<void>;
    replace: (cart: Cart) => void;
};

const CartContext = createContext<CartValue | null>(null);

// Серверная корзина с оптимистичным степпером: число меняется на экране
// сразу, а PUT уходит после паузы (debounce) с ИТОГОВЫМ количеством —
// ручка идемпотентная, поэтому порядок ответов не важен. Итоги и цены
// всегда берём из ответа сервера (фронт деньги не считает).
export function CartProvider({ children }: { children: ReactNode }) {
    const { api, me, reloadMe } = useSession();
    const toast = useToast();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState<Record<number, number>>({});
    const [inflight, setInflight] = useState(0);

    const pendingRef = useRef<Record<number, number>>({});
    const timers = useRef<Record<number, number>>({});
    const seq = useRef({ issued: 0, applied: 0 });
    const enabled = me.access === "ok";

    const refresh = useCallback(async () => {
        if (!enabled) return;
        try {
            setCart(await getCart(api));
            seq.current.applied = seq.current.issued;
        } catch (e) {
            if (e instanceof ApiError && e.status === 403) void reloadMe();
        } finally {
            setLoading(false);
        }
    }, [api, enabled, reloadMe]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const sync = useCallback(
        async (variantId: number) => {
            const qty = pendingRef.current[variantId];
            if (qty === undefined) return;
            const mySeq = ++seq.current.issued;
            setInflight((n) => n + 1);
            try {
                const next = await setCartQty(api, variantId, qty);
                if (mySeq > seq.current.applied) {
                    seq.current.applied = mySeq;
                    setCart(next);
                }
            } catch (e) {
                haptic("error");
                toast.show(errorText(e, "Не удалось обновить корзину"), "danger");
                if (e instanceof ApiError && e.status === 403) void reloadMe();
                void refresh();
            } finally {
                if (pendingRef.current[variantId] === qty) {
                    delete pendingRef.current[variantId];
                    setPending({ ...pendingRef.current });
                }
                setInflight((n) => n - 1);
            }
        },
        [api, refresh, reloadMe, toast],
    );

    // Все запросы долетели, но последний применённый ответ не самый свежий — перечитываем
    useEffect(() => {
        if (inflight === 0 && seq.current.applied < seq.current.issued) void refresh();
    }, [inflight, refresh]);

    const setQty = useCallback(
        (variantId: number, qty: number) => {
            const value = Math.max(0, Math.min(100000, Math.floor(qty) || 0));
            pendingRef.current[variantId] = value;
            setPending({ ...pendingRef.current });
            haptic("select");
            window.clearTimeout(timers.current[variantId]);
            timers.current[variantId] = window.setTimeout(() => void sync(variantId), SYNC_DELAY_MS);
        },
        [sync],
    );

    const serverQty = useMemo(() => {
        const map: Record<number, number> = {};
        cart?.groups.forEach((g) => g.lines.forEach((l) => (map[l.variant_id] = l.qty)));
        return map;
    }, [cart]);

    const qtyOf = useCallback((variantId: number) => pending[variantId] ?? serverQty[variantId] ?? 0, [pending, serverQty]);

    const totalQty = useMemo(() => {
        const ids = new Set([...Object.keys(serverQty), ...Object.keys(pending)].map(Number));
        let sum = 0;
        ids.forEach((id) => (sum += pending[id] ?? serverQty[id] ?? 0));
        return sum;
    }, [pending, serverQty]);

    const value: CartValue = {
        cart,
        loading,
        syncing: inflight > 0 || Object.keys(pending).length > 0,
        qtyOf,
        totalQty,
        setQty,
        refresh,
        replace: setCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart() must be used within <CartProvider>");
    return ctx;
}
