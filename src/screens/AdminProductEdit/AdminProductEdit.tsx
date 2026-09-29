import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    adminAttributes,
    adminBrands,
    adminCategories,
    adminCategoryAttributes,
    adminCreateProduct,
    adminDeletePhoto,
    adminDeleteProduct,
    adminGetProduct,
    adminReorderPhotos,
    adminReplacePrices,
    adminTiers,
    adminUpdateProduct,
    adminUpdateVariant,
    adminUploadPhoto,
    type ProductFields,
} from "../../shared/api/endpoints";
import type { AdminProduct, AdminVariant, AttributeDefinition, Brand, CategoryNode, PriceTier } from "../../shared/api/types";
import { errorText, fileUrl } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { moneyInput, parseMoney } from "../../shared/format/format";
import { categoryOptionLabel, flattenCategories } from "../../shared/catalog/categories";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconCamera, IconPlus, IconTrash } from "../../shared/ui/icons/Icon";
import { Switch } from "../../shared/ui/Switch/Switch";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { ScreenLoader, Spinner } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { MainAction } from "../../shared/ui/MainAction/MainAction";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog, haptic } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import { AttributeInput } from "./AttributeInput";
import { VariantSheet } from "./VariantSheet";
import "./admin_edit.css";

const MAX_PHOTOS = 5;

type Form = {
    name: string;
    category_id: string;
    brand_id: string;
    sku: string;
    description: string;
    is_visible: boolean;
    attributes: Record<string, unknown>;
    prices: Record<number, string>; // tier_id -> «320» в рублях
};

const emptyForm: Form = { name: "", category_id: "", brand_id: "", sku: "", description: "", is_visible: true, attributes: {}, prices: {} };

function formFromProduct(p: AdminProduct): Form {
    const prices: Record<number, string> = {};
    p.prices.filter((r) => r.variant_id == null).forEach((r) => (prices[r.tier_id] = moneyInput(r.amount)));
    return {
        name: p.name,
        category_id: p.category_id ? String(p.category_id) : "",
        brand_id: p.brand_id ? String(p.brand_id) : "",
        sku: p.sku ?? "",
        description: p.description ?? "",
        is_visible: p.is_visible,
        attributes: { ...p.attributes },
        prices,
    };
}

export function AdminProductEdit() {
    const { productId } = useParams();
    const isNew = !productId;
    const { api, base } = useSession();
    const navigate = useNavigate();
    const toast = useToast();
    useBackButton(`${base}/admin/products`);

    const [product, setProduct] = useState<AdminProduct | null>(null);
    const [form, setForm] = useState<Form>(emptyForm);
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [tiers, setTiers] = useState<PriceTier[]>([]);
    const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
    const [categoryAttrIds, setCategoryAttrIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [variantSheet, setVariantSheet] = useState<AdminVariant | "new" | null>(null);
    const [photoSheet, setPhotoSheet] = useState<number | null>(null);
    const fileInput = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            adminCategories(api),
            adminBrands(api),
            adminTiers(api),
            adminAttributes(api),
            isNew ? Promise.resolve(null) : adminGetProduct(api, Number(productId)),
        ])
            .then(([cats, brs, trs, attrs, p]) => {
                if (cancelled) return;
                setCategories(cats);
                setBrands(brs);
                setTiers(trs);
                setAttributes(attrs);
                if (p) {
                    setProduct(p);
                    setForm(formFromProduct(p));
                }
            })
            .catch((e) => !cancelled && setError(errorText(e)))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [api, productId, isNew]);

    // Поля характеристик — атрибуты категории вместе с унаследованными от родителей
    useEffect(() => {
        if (!form.category_id) {
            setCategoryAttrIds([]);
            return;
        }
        adminCategoryAttributes(api, Number(form.category_id), true)
            .then(setCategoryAttrIds)
            .catch(() => setCategoryAttrIds([]));
    }, [api, form.category_id]);

    const productAttrs = useMemo(() => {
        const ids = new Set(categoryAttrIds);
        // заполненные раньше значения не теряем, даже если атрибут отвязали от категории
        Object.keys(form.attributes).forEach((key) => {
            const def = attributes.find((a) => a.key === key);
            if (def) ids.add(def.id);
        });
        return attributes.filter((a) => a.scope === "product" && ids.has(a.id)).sort((a, b) => a.sort_order - b.sort_order);
    }, [attributes, categoryAttrIds, form.attributes]);

    const variantAttrs = useMemo(
        () => attributes.filter((a) => a.scope === "variant" && (categoryAttrIds.includes(a.id) || !form.category_id)),
        [attributes, categoryAttrIds, form.category_id],
    );

    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

    const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

    const save = async () => {
        if (!form.name.trim()) {
            toast.show("Укажите название", "danger");
            return;
        }
        const badPrice = tiers.find((t) => form.prices[t.id]?.trim() && parseMoney(form.prices[t.id]) == null);
        if (badPrice) {
            toast.show(`Цена «${badPrice.label}» — не число`, "danger");
            return;
        }
        setSaving(true);
        const fields: ProductFields = {
            name: form.name.trim(),
            category_id: form.category_id ? Number(form.category_id) : null,
            brand_id: form.brand_id ? Number(form.brand_id) : null,
            sku: form.sku.trim() || null,
            description: form.description.trim() || null,
            is_visible: form.is_visible,
            attributes: Object.fromEntries(
                Object.entries(form.attributes).filter(([key]) => productAttrs.some((a) => a.key === key)),
            ),
        };
        try {
            let saved = isNew ? await adminCreateProduct(api, fields) : await adminUpdateProduct(api, product!.id, fields);
            // Цены товара из формы + переопределения вариантов как были
            const rows = [
                ...tiers
                    .map((t) => ({ tier_id: t.id, amount: parseMoney(form.prices[t.id] ?? "") }))
                    .filter((r): r is { tier_id: number; amount: number } => r.amount != null),
                ...saved.prices.filter((r) => r.variant_id != null),
            ];
            saved = await adminReplacePrices(api, saved.id, rows);
            setProduct(saved);
            setForm(formFromProduct(saved));
            haptic("success");
            toast.show(isNew ? "Товар создан — добавьте фото и варианты" : "Сохранено", "success");
            if (isNew) navigate(`${base}/admin/products/${saved.id}`, { replace: true });
        } catch (e) {
            haptic("error");
            toast.show(errorText(e), "danger");
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!product || !(await confirmDialog(`Удалить «${product.name}»? В корзинах клиентов позиция станет недоступной.`))) return;
        try {
            await adminDeleteProduct(api, product.id);
            toast.show("Товар удалён");
            navigate(`${base}/admin/products`, { replace: true });
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    const upload = async (files: FileList | null) => {
        if (!product || !files?.length) return;
        setUploading(true);
        try {
            let current = product;
            for (const file of Array.from(files).slice(0, MAX_PHOTOS - product.photos.length)) {
                current = await adminUploadPhoto(api, product.id, file);
            }
            setProduct(current);
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    const photoAction = async (action: "cover" | "delete") => {
        if (!product || photoSheet == null) return;
        try {
            if (action === "delete") {
                setProduct(await adminDeletePhoto(api, product.id, photoSheet));
            } else {
                const ids = [photoSheet, ...product.photos.map((p) => p.id).filter((id) => id !== photoSheet)];
                setProduct(await adminReorderPhotos(api, product.id, ids));
            }
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setPhotoSheet(null);
        }
    };

    // Остаток и тумблер наличия прямо в строке варианта — сохраняются сразу
    const updateVariantStock = async (v: AdminVariant, body: { stock_qty?: number | null; stock_status?: "in_stock" | "out" }) => {
        if (!product) return;
        try {
            setProduct(await adminUpdateVariant(api, product.id, v.id, body));
            haptic("select");
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    if (loading) {
        return (
            <div className="screen">
                <TopBar back={`${base}/admin/products`} title={isNew ? "Новый товар" : "Товар"} />
                <ScreenLoader />
            </div>
        );
    }

    const namedVariants = product?.variants.filter((v) => !v.is_default && v.is_visible) ?? [];
    const defaultVariant = product?.variants.find((v) => v.is_default && v.is_visible) ?? null;
    const stockRows = namedVariants.length ? namedVariants : defaultVariant ? [defaultVariant] : [];

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar
                    back={`${base}/admin/products`}
                    title={isNew ? "Новый товар" : "Товар"}
                    right={
                        <label className="edit-visible">
                            Виден
                            <Switch checked={form.is_visible} onChange={(v) => set("is_visible", v)} label="Товар виден клиентам" />
                        </label>
                    }
                />
                <div className="screen-pad edit-body">
                    {error && <Banner tone="danger">{error}</Banner>}

                    <section className="edit-section">
                        <h2 className="section-title">Фото</h2>
                        {product ? (
                            <div className="edit-photos">
                                {product.photos.map((p, i) => (
                                    <button key={p.id} type="button" className="edit-photo" onClick={() => setPhotoSheet(p.id)} aria-label={`Фото ${i + 1}`}>
                                        <img src={fileUrl(p.url)!} alt="" />
                                        {i === 0 && <span className="edit-photo-badge">Обложка</span>}
                                    </button>
                                ))}
                                {product.photos.length < MAX_PHOTOS && (
                                    <button type="button" className="edit-photo-add" onClick={() => fileInput.current?.click()} disabled={uploading}>
                                        {uploading ? <Spinner size={22} /> : <IconCamera size={22} />}
                                        Добавить
                                    </button>
                                )}
                                <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
                            </div>
                        ) : (
                            <p className="muted">Сохраните товар — после этого можно добавить до {MAX_PHOTOS} фото.</p>
                        )}
                    </section>

                    <section className="edit-section">
                        <h2 className="section-title">Основное</h2>
                        <div className="field">
                            <label htmlFor="n">Название</label>
                            <input id="n" value={form.name} maxLength={255} onChange={(e) => set("name", e.target.value)} placeholder="Например, Жнец 30 мл" />
                        </div>
                        <div className="grid-2">
                            <div className="field">
                                <label htmlFor="cat">Категория</label>
                                <select id="cat" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                                    <option value="">Без категории</option>
                                    {flatCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {categoryOptionLabel(c.name, c.depth)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="br">Бренд</label>
                                <select id="br" value={form.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
                                    <option value="">Без бренда</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {productAttrs.map((a) => (
                                <AttributeInput key={a.id} def={a} value={form.attributes[a.key]} onChange={(v) => set("attributes", { ...form.attributes, [a.key]: v })} />
                            ))}
                        </div>
                        <div className="field">
                            <label htmlFor="sku">Артикул</label>
                            <input id="sku" className="mono" value={form.sku} maxLength={100} onChange={(e) => set("sku", e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="d">Описание</label>
                            <textarea id="d" value={form.description} placeholder="Коротко о товаре — видно в карточке" onChange={(e) => set("description", e.target.value)} />
                        </div>
                    </section>

                    <section className="edit-section">
                        <h2 className="section-title">Цены за штуку</h2>
                        {tiers.length === 0 ? (
                            <Banner tone="low">Сначала заведите уровни цен в Настройках — например «от 1 шт», «от 10 шт»</Banner>
                        ) : (
                            <div className={tiers.length >= 3 ? "grid-3" : "grid-2"}>
                                {tiers.map((t) => (
                                    <div key={t.id} className="field">
                                        <label htmlFor={`p${t.id}`}>{t.label}</label>
                                        <input
                                            id={`p${t.id}`}
                                            className="mono"
                                            inputMode="decimal"
                                            placeholder="—"
                                            value={form.prices[t.id] ?? ""}
                                            onChange={(e) => set("prices", { ...form.prices, [t.id]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <span className="field-hint">Пустое поле — берётся цена младшего уровня. Своя цена у отдельного варианта — в его настройках.</span>
                    </section>

                    <section className="edit-section">
                        <div className="section-head">
                            <h2 className="section-title">Варианты и остатки</h2>
                            <span className="muted">шт · в наличии</span>
                        </div>
                        {!product && <p className="muted">Вкусы, цвета и остатки добавляются после сохранения товара.</p>}
                        {stockRows.map((v) => (
                            <div key={v.id} className="edit-variant">
                                {v.is_default ? (
                                    <span className="edit-variant-name muted">Без вариантов</span>
                                ) : (
                                    <button type="button" className="edit-variant-name" onClick={() => setVariantSheet(v)}>
                                        {v.name}
                                        {product!.prices.some((r) => r.variant_id === v.id) && <span className="edit-variant-own">своя цена</span>}
                                    </button>
                                )}
                                <StockInput variant={v} onSave={(qty) => updateVariantStock(v, { stock_qty: qty })} />
                                <Switch
                                    checked={v.stock_status !== "out"}
                                    onChange={(on) => updateVariantStock(v, on ? (v.stock_qty === 0 ? { stock_qty: null, stock_status: "in_stock" } : { stock_status: "in_stock" }) : { stock_status: "out" })}
                                    label={`В наличии: ${v.name ?? product!.name}`}
                                />
                            </div>
                        ))}
                        {product && (
                            <Button variant="outline" size="md" icon={<IconPlus size={18} />} onClick={() => setVariantSheet("new")}>
                                Добавить вариант
                            </Button>
                        )}
                    </section>

                    {product && (
                        <Button variant="danger" size="md" icon={<IconTrash size={18} />} onClick={remove}>
                            Удалить товар
                        </Button>
                    )}
                </div>
            </div>

            <MainAction text={isNew ? "Создать товар" : "Сохранить"} onClick={save} loading={saving} />

            {product && (
                <VariantSheet
                    open={variantSheet !== null}
                    variant={variantSheet === "new" ? null : variantSheet}
                    product={product}
                    tiers={tiers}
                    attributes={variantAttrs}
                    onClose={() => setVariantSheet(null)}
                    onSaved={(p) => {
                        setProduct(p);
                        setVariantSheet(null);
                    }}
                />
            )}

            <Sheet open={photoSheet !== null} onClose={() => setPhotoSheet(null)} title="Фото">
                <Button variant="surface" onClick={() => photoAction("cover")}>
                    Сделать обложкой
                </Button>
                <Button variant="danger" onClick={() => photoAction("delete")}>
                    Удалить фото
                </Button>
            </Sheet>
        </div>
    );
}

// Остаток числом: пусто — остаток не ведётся (статус вручную тумблером)
function StockInput({ variant, onSave }: { variant: AdminVariant; onSave: (qty: number | null) => void }) {
    const [value, setValue] = useState(variant.stock_qty == null ? "" : String(variant.stock_qty));
    useEffect(() => setValue(variant.stock_qty == null ? "" : String(variant.stock_qty)), [variant.stock_qty]);
    return (
        <input
            className="edit-stock mono"
            inputMode="numeric"
            aria-label="Остаток, шт"
            placeholder="—"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 7))}
            onBlur={() => {
                const next = value === "" ? null : Number(value);
                if (next !== variant.stock_qty) onSave(next);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
    );
}
