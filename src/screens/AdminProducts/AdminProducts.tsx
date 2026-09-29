import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminCategories, adminListProducts, adminSetProductStock } from "../../shared/api/endpoints";
import type { AdminProductListItem, CategoryNode } from "../../shared/api/types";
import { errorText, fileUrl } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { money, positions } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconPlus, IconSearch, IconBox, IconEyeOff, IconPhoto } from "../../shared/ui/icons/Icon";
import { Chip, ChipRow } from "../../shared/ui/Chips/Chips";
import { Switch } from "../../shared/ui/Switch/Switch";
import { Tag } from "../../shared/ui/Tag/Tag";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { AdminTabs } from "../../shared/ui/Tabs/Tabs";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic } from "../../shared/platform/telegram";
import "./admin_products.css";

const PAGE = 50;

export function AdminProducts() {
    const { api, base } = useSession();
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const [query, setQuery] = useState(params.get("q") ?? "");
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [items, setItems] = useState<AdminProductListItem[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const req = useRef(0);

    const categoryId = params.get("category_id");
    const stock = params.get("stock");

    useEffect(() => {
        adminCategories(api).then(setCategories).catch(() => undefined);
    }, [api]);

    useEffect(() => {
        const t = window.setTimeout(() => {
            const next = new URLSearchParams(params);
            if (query.trim()) next.set("q", query.trim());
            else next.delete("q");
            if (next.toString() !== params.toString()) setParams(next, { replace: true });
        }, 300);
        return () => window.clearTimeout(t);
    }, [query, params, setParams]);

    const load = useCallback(
        async (offset: number) => {
            const id = ++req.current;
            setLoading(true);
            setError(null);
            try {
                const page = await adminListProducts(api, {
                    q: params.get("q"),
                    category_id: categoryId,
                    stock_status: stock,
                    limit: PAGE,
                    offset,
                });
                if (id !== req.current) return;
                setItems((prev) => (offset ? [...prev, ...page.items] : page.items));
                setTotal(page.total);
            } catch (e) {
                if (id === req.current) setError(errorText(e));
            } finally {
                if (id === req.current) setLoading(false);
            }
        },
        [api, params, categoryId, stock],
    );

    useEffect(() => {
        void load(0);
    }, [load]);

    const setFilter = (key: string, value: string | null) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, { replace: true });
    };

    // Быстрый тумблер наличия: весь товар в наличии / нет
    const toggleStock = async (p: AdminProductListItem, inStock: boolean) => {
        setItems((list) => list.map((x) => (x.id === p.id ? { ...x, stock_status: inStock ? "in_stock" : "out" } : x)));
        haptic("select");
        try {
            await adminSetProductStock(api, p.id, inStock ? "in_stock" : "out");
        } catch (e) {
            setItems((list) => list.map((x) => (x.id === p.id ? p : x)));
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-tabbar">
                <TopBar title="Товары" size="lg" right={total != null ? <span className="muted">{positions(total)}</span> : undefined} />
                <div className="ap-controls">
                    <div className="ap-search">
                        <IconSearch size={18} strokeWidth={2} />
                        <label htmlFor="aq" className="sr-only">
                            Поиск товара
                        </label>
                        <input id="aq" placeholder="Название или артикул" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <ChipRow>
                        <Chip on={!categoryId && !stock} onClick={() => setParams(query ? { q: query } : {}, { replace: true })}>
                            Все
                        </Chip>
                        <Chip on={stock === "out"} onClick={() => setFilter("stock", stock === "out" ? null : "out")}>
                            Нет в наличии
                        </Chip>
                        {categories.map((c) => (
                            <Chip key={c.id} on={categoryId === String(c.id)} onClick={() => setFilter("category_id", categoryId === String(c.id) ? null : String(c.id))}>
                                {c.name}
                            </Chip>
                        ))}
                    </ChipRow>
                    <div className="ap-legend">
                        <span>Товар</span>
                        <span>В наличии</span>
                    </div>
                </div>

                <div className="ap-list">
                    {error && <Banner tone="danger">{error}</Banner>}
                    {loading && !items.length && <ListSkeleton />}
                    {!loading && total === 0 && (
                        <Empty
                            icon={<IconBox size={32} />}
                            title={params.toString() ? "Ничего не нашлось" : "Товаров пока нет"}
                            action={
                                !params.toString() && (
                                    <Link to={`${base}/admin/products/new`} className="link-btn">
                                        Добавить первый товар
                                    </Link>
                                )
                            }
                        />
                    )}
                    {items.map((p) => {
                        const cover = fileUrl(p.cover_url);
                        return (
                            <div key={p.id} className="ap-row">
                                <span className="ap-thumb">{cover ? <img src={cover} alt="" loading="lazy" /> : <IconPhoto size={18} />}</span>
                                <Link to={`${base}/admin/products/${p.id}`} className="ap-row-main">
                                    <span className="ap-row-name">{p.name}</span>
                                    <span className="muted">
                                        <span className="mono ap-price">{p.price_from != null ? money(p.price_from) : "без цены"}</span>
                                        {p.variants_count > 1 ? ` · ${p.variants_count} вар.` : ""}
                                        {p.stock_status === "low" ? " · мало" : ""}
                                    </span>
                                    {!p.is_visible && (
                                        <Tag tone="out">
                                            <IconEyeOff size={12} /> скрыт
                                        </Tag>
                                    )}
                                </Link>
                                <Switch checked={p.stock_status !== "out"} onChange={(v) => toggleStock(p, v)} label={`В наличии: ${p.name}`} />
                            </div>
                        );
                    })}
                    {total != null && items.length < total && (
                        <Button variant="surface" size="md" loading={loading} onClick={() => load(items.length)}>
                            Показать ещё
                        </Button>
                    )}
                </div>
            </div>

            <Link to={`${base}/admin/products/new`} className="ap-fab">
                <IconPlus size={20} strokeWidth={2.2} />
                Товар
            </Link>
            <AdminTabs />
        </div>
    );
}
