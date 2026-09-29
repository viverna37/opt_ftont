import { useCallback, useEffect, useState, type DependencyList } from "react";
import { ApiError, errorText } from "../api/client";
import { useSession } from "../session/SessionProvider";

type State<T> = { data: T | null; error: string | null; loading: boolean };

// Загрузка данных экрана на mount (тот же подход, что в такси — без
// внешнего кэша). 403 значит, что доступ поменялся (заблокировали и т.п.) —
// перечитываем /v1/me, гейт сам покажет нужный экран.
export function useLoad<T>(loader: () => Promise<T>, deps: DependencyList) {
    const { reloadMe } = useSession();
    const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const load = useCallback(loader, deps);

    const reload = useCallback(async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const data = await load();
            setState({ data, error: null, loading: false });
        } catch (e) {
            if (e instanceof ApiError && e.status === 403) void reloadMe();
            setState((s) => ({ ...s, error: errorText(e), loading: false }));
        }
    }, [load, reloadMe]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const set = useCallback((data: T) => setState({ data, error: null, loading: false }), []);

    return { ...state, reload, set };
}
