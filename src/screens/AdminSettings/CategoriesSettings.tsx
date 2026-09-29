import { useCallback, useEffect, useMemo, useState } from "react";
import {
    adminAttributes,
    adminCategories,
    adminCategoryAttributes,
    adminCreateCategory,
    adminDeleteCategory,
    adminSetCategoryAttributes,
    adminUpdateCategory,
} from "../../shared/api/endpoints";
import type { AttributeDefinition, CategoryNode } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { categoryOptionLabel, flattenCategories } from "../../shared/catalog/categories";
import { positions } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconCheck, IconChevronRight, IconEyeOff, IconGrid, IconPlus } from "../../shared/ui/icons/Icon";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { SwitchRow } from "../../shared/ui/Switch/Switch";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { Tag } from "../../shared/ui/Tag/Tag";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "../../shared/ui/Sheet/sheet.css";
import "../../shared/ui/MainAction/main_action.css";
import "./settings.css";

type Editing = { node: CategoryNode | null; parentId: number | null };

export function CategoriesSettings() {
    const { api, base } = useSession();
    const toast = useToast();
    useBackButton(`${base}/admin/settings`);
    const [tree, setTree] = useState<CategoryNode[] | null>(null);
    const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Editing | null>(null);

    const load = useCallback(async () => {
        try {
            const [cats, attrs] = await Promise.all([adminCategories(api), adminAttributes(api)]);
            setTree(cats);
            setAttributes(attrs);
        } catch (e) {
            setError(errorText(e));
        }
    }, [api]);

    useEffect(() => {
        void load();
    }, [load]);

    const flat = useMemo(() => flattenCategories(tree ?? []), [tree]);

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back={`${base}/admin/settings`} title="Категории" subtitle="Характеристики наследуются подкатегориями" />
                <div className="screen-pad">
                    {error && <Banner tone="danger">{error}</Banner>}
                    {!tree && !error && <ListSkeleton rows={5} />}
                    {tree?.length === 0 && (
                        <Empty icon={<IconGrid size={32} />} title="Категорий пока нет">
                            Например: Жидкости → Солевые, Одноразки, Под-системы
                        </Empty>
                    )}
                    <div className="row-list">
                        {flat.map(({ node, depth }) => (
                            <button key={node.id} type="button" className="ref-row" style={{ paddingLeft: depth * 18 }} onClick={() => setEditing({ node, parentId: node.parent_id })}>
                                <span className="ref-row-text">
                                    <span className="ref-row-title">
                                        {depth > 0 && <span className="muted">↳ </span>}
                                        {node.name}
                                    </span>
                                    <span className="muted">{positions(node.product_count)}</span>
                                </span>
                                {!node.is_visible && (
                                    <Tag tone="out">
                                        <IconEyeOff size={12} /> скрыта
                                    </Tag>
                                )}
                                <IconChevronRight size={18} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="main-action">
                <Button icon={<IconPlus size={20} />} onClick={() => setEditing({ node: null, parentId: null })}>
                    Категория
                </Button>
            </div>
            <CategorySheet
                editing={editing}
                flat={flat}
                attributes={attributes}
                onClose={() => setEditing(null)}
                onDone={async (message) => {
                    setEditing(null);
                    toast.show(message);
                    await load();
                }}
            />
        </div>
    );
}

type SheetProps = {
    editing: Editing | null;
    flat: ReturnType<typeof flattenCategories>;
    attributes: AttributeDefinition[];
    onClose: () => void;
    onDone: (message: string) => void;
};

function descendantsOf(node: CategoryNode): number[] {
    return [node.id, ...node.children.flatMap(descendantsOf)];
}

function CategorySheet({ editing, flat, attributes, onClose, onDone }: SheetProps) {
    const { api } = useSession();
    const toast = useToast();
    const node = editing?.node ?? null;
    const [name, setName] = useState("");
    const [parentId, setParentId] = useState("");
    const [visible, setVisible] = useState(true);
    const [sortOrder, setSortOrder] = useState("0");
    const [bound, setBound] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!editing) return;
        setName(node?.name ?? "");
        setParentId(editing.parentId ? String(editing.parentId) : "");
        setVisible(node?.is_visible ?? true);
        setSortOrder(String(node?.sort_order ?? 0));
        setBound([]);
        if (node) adminCategoryAttributes(api, node.id).then(setBound).catch(() => undefined);
    }, [editing, node, api]);

    const blocked = node ? descendantsOf(node) : [];

    const save = async () => {
        if (!name.trim()) return;
        setBusy(true);
        try {
            const body = { name: name.trim(), parent_id: parentId ? Number(parentId) : null, is_visible: visible, sort_order: Number(sortOrder) || 0 };
            const saved = node ? await adminUpdateCategory(api, node.id, body) : await adminCreateCategory(api, body);
            await adminSetCategoryAttributes(api, saved.id, bound);
            onDone(node ? "Категория сохранена" : "Категория добавлена");
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!node || !(await confirmDialog(`Удалить категорию «${node.name}»?`))) return;
        try {
            await adminDeleteCategory(api, node.id);
            onDone("Категория удалена");
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <Sheet
            open={!!editing}
            onClose={onClose}
            title={node ? node.name : "Новая категория"}
            footer={
                <>
                    {node && (
                        <Button variant="danger" size="md" style={{ width: "auto" }} onClick={remove}>
                            Удалить
                        </Button>
                    )}
                    <Button size="md" onClick={save} loading={busy} disabled={!name.trim()}>
                        Сохранить
                    </Button>
                </>
            }
        >
            <div className="field">
                <label htmlFor="cn">Название</label>
                <input id="cn" value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid-2">
                <div className="field">
                    <label htmlFor="cp">Родитель</label>
                    <select id="cp" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                        <option value="">— верхний уровень</option>
                        {flat
                            .filter((c) => !blocked.includes(c.id))
                            .map((c) => (
                                <option key={c.id} value={c.id}>
                                    {categoryOptionLabel(c.name, c.depth)}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="cs">Порядок</label>
                    <input id="cs" className="mono" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^\d-]/g, ""))} />
                </div>
            </div>
            <SwitchRow title="Видна клиентам" checked={visible} onChange={setVisible} />
            <span className="field-label">Характеристики категории</span>
            {attributes.length === 0 && <span className="field-hint">Сначала заведите характеристики в Настройках</span>}
            <div className="check-list">
                {attributes.map((a) => {
                    const on = bound.includes(a.id);
                    return (
                        <button key={a.id} type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => setBound(on ? bound.filter((x) => x !== a.id) : [...bound, a.id])}>
                            <span className="choice-mark">{on && <IconCheck size={14} strokeWidth={3} />}</span>
                            <span className="choice-label">
                                {a.label}
                                {a.unit ? `, ${a.unit}` : ""} <span className="muted">· {a.scope === "variant" ? "у варианта" : "у товара"}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </Sheet>
    );
}
