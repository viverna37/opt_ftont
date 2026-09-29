import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getCategory, listProducts } from "../../shared/api/endpoints";
import type { CategoryDetail, ProductListItem } from "../../shared/api/types";
import { ApiError, errorText, type QueryParams } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { attrText, positions } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { IconButton } from "../../shared/ui/Button/Button";
import { IconCheck, IconSearch, IconSort, IconX } from "../../shared/ui/icons/Icon";
import { Chip, ChipRow } from "../../shared/ui/Chips/Chips";
import { Switch } from "../../shared/ui/Switch/Switch";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { Button } from "../../shared/ui/Button/Button";
import { ProductRow } from "../../shared/ui/ProductRow/ProductRow";
import { ListSkeleton, Spinner } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { ClientTabs } from "../../shared/ui/Tabs/Tabs";
import { useBackButton } from "../../shared/platform/useBackButton";
import "./product_list.css";

const PAGE = 30;
const SORTS: { value: string; label: string; short: string }[] = [
    { value: "default", label: "По порядку оптовика", short: "По порядку" },
    { value: "price_asc", label: "Сначала дешевле", short: "Цена ↑" },
    { value: "price_desc", label: "Сначала дороже", short: "Цена ↓" },
    { value: "name", label: "По названию", short: "А–Я" },
    { value: "new", label: "Сначала новые", short: "Новые" },
];

type SheetState = { kind: "sort" } | { kind: "brand" } | { kind: "attr"; key: string } | null;

// Категория и поиск — один экран: фильтры живут в query-строке, чтобы
// «назад» из карточки возвращал к тому же отфильтрованному списку.
export function ProductList() {
    const { categoryId } = useParams();
    const isSearch = !categoryId;
    const { api, base, reloadMe } = useSession();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    useBackButton();

    const [category, setCategory] = useState<CategoryDetail | null>(null);
    const [items, setItems] = useState<ProductListItem[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sheet, setSheet] = useState<SheetState>(null);
    const [query, setQuery] = useState(params.get("q") ?? "");
    const requestId = useRef(0);

    useEffect(() => {
        if (!categoryId) return;
        getCategory(api, Number(categoryId))
            .then(setCategory)
            .catch((e) => setError(errorText(e)));
    }, [api, categoryId]);

    // Поиск: пишем q в URL с задержкой, чтобы не дёргать API на каждую букву
    useEffect(() => {
        if (!isSearch) return;
        const t = window.setTimeout(() => {
            const next = new URLSearchParams(params);
            if (query.trim()) next.set("q", query.trim());
            else next.delete("q");
            if (next.toString() !== params.toString()) setParams(next, { replace: true });
        }, 300);
        return () => window.clearTimeout(t);
    }, [query, isSearch, params, setParams]);

    const filters: QueryParams = useMemo(() => {
        const q: QueryParams = {};
        params.forEach((value, key) => {
            if (key === "brand_id") return;
            q[key] = value;
        });
        const brands = params.getAll("brand_id");
        if (brands.length) q.brand_id = brands;
        if (categoryId) q.category_id = categoryId;
        return q;
    }, [params, categoryId]);

    const load = useCallback(
        async (offset: number) => {
            const id = ++requestId.current;
            setLoading(true);
            setError(null);
            try {
                const page = await listProducts(api, { ...filters, limit: PAGE, offset });
                if (id !== requestId.current) return;
                setItems((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
                setTotal(page.total);
            } catch (e) {
                if (id !== requestId.current) return;
                if (e instanceof ApiError && e.status === 403) void reloadMe();
                setError(errorText(e));
            } finally {
                if (id === requestId.current) setLoading(false);
            }
        },
        [api, filters, reloadMe],
    );

    useEffect(() => {
        if (isSearch && !params.get("q") && !params.get("sort")) {
            setItems([]);
            setTotal(null);
            setLoading(false);
            return;
        }
        void load(0);
    }, [load, isSearch, params]);

    // Подгрузка следующей страницы, когда низ списка появился на экране
    const sentinel = useRef<HTMLDivElement | null>(null);
    const hasMore = total != null && items.length < total;
    useEffect(() => {
        const node = sentinel.current;
        if (!node || !hasMore) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading) void load(items.length);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, loading, load, items.length]);

    const setParam = (key: string, values: string[]) => {
        const next = new URLSearchParams(params);
        next.delete(key);
        if (key === "brand_id") values.forEach((v) => next.append(key, v));
        else if (values.length) next.set(key, values.join(","));
        setParams(next, { replace: true });
    };
    const selected = (key: string) => (key === "brand_id" ? params.getAll(key) : (params.get(key)?.split(",").filter(Boolean) ?? []));
    const sort = params.get("sort") ?? "default";
    const inStock = params.get("in_stock") === "true";
    const activeCount = [...params.keys()].filter((k) => k !== "q" && k !== "sort").length;

    const subtitle = total != null ? positions(total) : " ";

    return (
        <div className="screen">
            <div className="screen-scroll with-tabbar">
                {isSearch ? (
                    <div className="list-search">
                        <div className="list-search-box">
                            <IconSearch size={18} strokeWidth={2} />
                            <label htmlFor="q" className="sr-only">
                                Поиск по прайсу
                            </label>
                            <input
                                id="q"
                                autoFocus={!params.get("q")}
                                placeholder="Бренд, вкус, артикул"
                                value={query}
                                enterKeyHint="search"
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                            />
                            {query && (
                                <button type="button" aria-label="Очистить" onClick={() => setQuery("")}>
                                    <IconX size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <TopBar
                        back={`${base}/catalog`}
                        title={category?.name ?? " "}
                        subtitle={subtitle}
                        right={
                            <IconButton label="Поиск" onClick={() => navigate(`${base}/catalog/search`)}>
                                <IconSearch size={18} strokeWidth={2} />
                            </IconButton>
                        }
                    />
                )}

                <div className="list-controls">
                    {category && category.children.length > 0 && (
                        <ChipRow>
                            {category.children.map((c) => (
                                <Chip key={c.id} onClick={() => navigate(`${base}/catalog/c/${c.id}`)}>
                                    {c.name}
                                </Chip>
                            ))}
                        </ChipRow>
                    )}
                    {(category?.brands.length || category?.filters.length || activeCount > 0) && (
                        <ChipRow>
                            {category && category.brands.length > 1 && (
                                <Chip dropdown on={selected("brand_id").length > 0} count={selected("brand_id").length} onClick={() => setSheet({ kind: "brand" })}>
                                    Бренд
                                </Chip>
                            )}
                            {category?.filters.map((f) => {
                                const key = `attr.${f.attribute.key}`;
                                return (
                                    <Chip key={key} dropdown on={selected(key).length > 0} count={selected(key).length} onClick={() => setSheet({ kind: "attr", key: f.attribute.key })}>
                                        {f.attribute.label}
                                    </Chip>
                                );
                            })}
                            {activeCount > 0 && (
                                <Chip
                                    onClick={() => {
                                        const next = new URLSearchParams();
                                        if (params.get("q")) next.set("q", params.get("q")!);
                                        if (params.get("sort")) next.set("sort", params.get("sort")!);
                                        setParams(next, { replace: true });
                                    }}
                                >
                                    Сбросить
                                </Chip>
                            )}
                        </ChipRow>
                    )}
                    <div className="list-toggles">
                        <label className="list-instock">
                            <Switch checked={inStock} onChange={(v) => setParam("in_stock", v ? ["true"] : [])} label="Только в наличии" />
                            Только в наличии
                        </label>
                        <button type="button" className="list-sort" onClick={() => setSheet({ kind: "sort" })}>
                            <IconSort size={16} strokeWidth={2} />
                            {SORTS.find((s) => s.value === sort)?.short}
                        </button>
                    </div>
                </div>

                <div className="list-body">
                    {error && <Banner tone="danger">{error}</Banner>}
                    {loading && items.length === 0 && <ListSkeleton />}
                    <div className="row-list">
                        {items.map((p) => (
                            <ProductRow key={p.id} product={p} to={`${base}/catalog/p/${p.id}`} />
                        ))}
                    </div>
                    {hasMore && (
                        <div ref={sentinel} className="list-more">
                            <Spinner size={22} />
                        </div>
                    )}
                    {!loading && !error && total === 0 && (
                        <Empty icon={<IconSearch size={32} />} title="Ничего не нашлось">
                            {activeCount > 0 ? "Попробуйте убрать часть фильтров" : "Проверьте написание или поищите по бренду"}
                        </Empty>
                    )}
                    {isSearch && total == null && !loading && (
                        <Empty title="Поиск по прайсу">Название, бренд, вкус или артикул — регистр и «ё» не важны</Empty>
                    )}
                </div>
            </div>
            <ClientTabs />

            <Sheet open={sheet?.kind === "sort"} onClose={() => setSheet(null)} title="Сортировка">
                {SORTS.map((s) => (
                    <button
                        key={s.value}
                        type="button"
                        className={`choice ${sort === s.value ? "on" : ""}`}
                        onClick={() => {
                            setParam("sort", s.value === "default" ? [] : [s.value]);
                            setSheet(null);
                        }}
                    >
                        <span className="choice-mark radio">{sort === s.value && <IconCheck size={14} strokeWidth={3} />}</span>
                        <span className="choice-label">{s.label}</span>
                    </button>
                ))}
            </Sheet>

            {category && (
                <ValuesSheet
                    open={sheet?.kind === "brand"}
                    title="Бренд"
                    options={category.brands.map((b) => ({ value: String(b.id), label: b.name }))}
                    selected={selected("brand_id")}
                    onApply={(v) => setParam("brand_id", v)}
                    onClose={() => setSheet(null)}
                />
            )}
            {category?.filters.map((f) => (
                <ValuesSheet
                    key={f.attribute.key}
                    open={sheet?.kind === "attr" && sheet.key === f.attribute.key}
                    title={f.attribute.label}
                    options={f.values.map((v) => ({
                        value: String(v),
                        label: attrText({ value: v, unit: f.attribute.unit, type: f.attribute.type, label: f.attribute.label }),
                    }))}
                    selected={selected(`attr.${f.attribute.key}`)}
                    onApply={(v) => setParam(`attr.${f.attribute.key}`, v)}
                    onClose={() => setSheet(null)}
                />
            ))}
        </div>
    );
}

type ValuesSheetProps = {
    open: boolean;
    title: string;
    options: { value: string; label: string }[];
    selected: string[];
    onApply: (values: string[]) => void;
    onClose: () => void;
};

// Мультивыбор значений фильтра (несколько значений — «или»)
function ValuesSheet({ open, title, options, selected, onApply, onClose }: ValuesSheetProps) {
    const [draft, setDraft] = useState<string[]>(selected);
    useEffect(() => {
        if (open) setDraft(selected);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const toggle = (v: string) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="surface" size="md" onClick={() => setDraft([])}>
                        Сбросить
                    </Button>
                    <Button
                        size="md"
                        onClick={() => {
                            onApply(draft);
                            onClose();
                        }}
                    >
                        Показать
                    </Button>
                </>
            }
        >
            {options.map((o) => {
                const on = draft.includes(o.value);
                return (
                    <button key={o.value} type="button" className={`choice ${on ? "on" : ""}`} onClick={() => toggle(o.value)} aria-pressed={on}>
                        <span className="choice-mark">{on && <IconCheck size={14} strokeWidth={3} />}</span>
                        <span className="choice-label">{o.label}</span>
                    </button>
                );
            })}
        </Sheet>
    );
}
