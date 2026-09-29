import { useCallback, useEffect, useState } from "react";
import { adminAttributes, adminCreateAttribute, adminDeleteAttribute, adminUpdateAttribute } from "../../shared/api/endpoints";
import type { AttributeDefinition, AttributeScope, AttributeType } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconChevronRight, IconPlus, IconSliders } from "../../shared/ui/icons/Icon";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { SwitchRow } from "../../shared/ui/Switch/Switch";
import { Segmented } from "../../shared/ui/Segmented/Segmented";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { Tag } from "../../shared/ui/Tag/Tag";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "../../shared/ui/MainAction/main_action.css";
import "./settings.css";

const TYPES: { value: AttributeType; label: string }[] = [
    { value: "text", label: "Текст" },
    { value: "number", label: "Число" },
    { value: "select", label: "Список значений" },
    { value: "bool", label: "Да / нет" },
    { value: "color", label: "Цвет" },
];

// Латиница для ключа из русского названия: «Объём» -> «obem»
const TRANSLIT: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya" };
function toKey(label: string) {
    const key = label
        .toLowerCase()
        .split("")
        .map((ch) => TRANSLIT[ch] ?? ch)
        .join("")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return /^[a-z]/.test(key) ? key.slice(0, 64) : `a_${key}`.slice(0, 64);
}

export function AttributesSettings() {
    const { api, base } = useSession();
    const toast = useToast();
    useBackButton(`${base}/admin/settings`);
    const [items, setItems] = useState<AttributeDefinition[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<AttributeDefinition | "new" | null>(null);

    const load = useCallback(async () => {
        try {
            setItems(await adminAttributes(api));
        } catch (e) {
            setError(errorText(e));
        }
    }, [api]);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back={`${base}/admin/settings`} title="Характеристики" subtitle="Поля товаров, мета в списке и фильтры каталога" />
                <div className="screen-pad">
                    {error && <Banner tone="danger">{error}</Banner>}
                    {!items && !error && <ListSkeleton rows={4} />}
                    {items?.length === 0 && (
                        <Empty icon={<IconSliders size={32} />} title="Характеристик пока нет">
                            Например: Объём (мл), Никотин (мг), Затяжек, Цвет. Потом привяжите их к категориям.
                        </Empty>
                    )}
                    <div className="row-list">
                        {items?.map((a) => (
                            <button key={a.id} type="button" className="ref-row" onClick={() => setEditing(a)}>
                                <span className="ref-row-text">
                                    <span className="ref-row-title">
                                        {a.label}
                                        {a.unit ? `, ${a.unit}` : ""}
                                    </span>
                                    <span className="muted">
                                        {TYPES.find((t) => t.value === a.type)?.label} · {a.scope === "variant" ? "у варианта" : "у товара"} · <span className="mono">{a.key}</span>
                                    </span>
                                </span>
                                {a.filterable && <Tag tone="accent">фильтр</Tag>}
                                <IconChevronRight size={18} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="main-action">
                <Button icon={<IconPlus size={20} />} onClick={() => setEditing("new")}>
                    Характеристика
                </Button>
            </div>
            <AttributeSheet
                editing={editing}
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

function AttributeSheet({ editing, onClose, onDone }: { editing: AttributeDefinition | "new" | null; onClose: () => void; onDone: (m: string) => void }) {
    const { api } = useSession();
    const toast = useToast();
    const attr = editing && editing !== "new" ? editing : null;
    const [label, setLabel] = useState("");
    const [key, setKey] = useState("");
    const [keyTouched, setKeyTouched] = useState(false);
    const [type, setType] = useState<AttributeType>("text");
    const [unit, setUnit] = useState("");
    const [options, setOptions] = useState("");
    const [scope, setScope] = useState<AttributeScope>("product");
    const [filterable, setFilterable] = useState(false);
    const [showInList, setShowInList] = useState(false);
    const [sortOrder, setSortOrder] = useState("0");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!editing) return;
        setLabel(attr?.label ?? "");
        setKey(attr?.key ?? "");
        setKeyTouched(false);
        setType(attr?.type ?? "text");
        setUnit(attr?.unit ?? "");
        setOptions((attr?.options ?? []).join(", "));
        setScope(attr?.scope ?? "product");
        setFilterable(attr?.filterable ?? false);
        setShowInList(attr?.show_in_list ?? false);
        setSortOrder(String(attr?.sort_order ?? 0));
    }, [editing, attr]);

    const save = async () => {
        const opts = options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);
        const common = {
            label: label.trim(),
            unit: unit.trim() || null,
            options: type === "select" ? opts : null,
            filterable,
            show_in_list: showInList,
            sort_order: Number(sortOrder) || 0,
        };
        setBusy(true);
        try {
            if (attr) await adminUpdateAttribute(api, attr.id, common);
            else await adminCreateAttribute(api, { ...common, key: key || toKey(label), type, scope });
            onDone(attr ? "Сохранено" : "Характеристика добавлена");
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!attr || !(await confirmDialog(`Удалить «${attr.label}»? Значения у товаров перестанут показываться.`))) return;
        try {
            await adminDeleteAttribute(api, attr.id);
            onDone("Удалено");
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <Sheet
            open={!!editing}
            onClose={onClose}
            title={attr ? attr.label : "Новая характеристика"}
            footer={
                <>
                    {attr && (
                        <Button variant="danger" size="md" style={{ width: "auto" }} onClick={remove}>
                            Удалить
                        </Button>
                    )}
                    <Button size="md" onClick={save} loading={busy} disabled={!label.trim()}>
                        Сохранить
                    </Button>
                </>
            }
        >
            <div className="grid-2">
                <div className="field">
                    <label htmlFor="al">Название</label>
                    <input
                        id="al"
                        value={label}
                        maxLength={100}
                        placeholder="Объём"
                        onChange={(e) => {
                            setLabel(e.target.value);
                            if (!attr && !keyTouched) setKey(toKey(e.target.value));
                        }}
                    />
                </div>
                <div className="field">
                    <label htmlFor="au">Единица</label>
                    <input id="au" value={unit} maxLength={20} placeholder="мл, мг, Ом" onChange={(e) => setUnit(e.target.value)} />
                </div>
            </div>
            {!attr && (
                <>
                    <div className="grid-2">
                        <div className="field">
                            <label htmlFor="at">Тип</label>
                            <select id="at" value={type} onChange={(e) => setType(e.target.value as AttributeType)}>
                                {TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="ak">Ключ</label>
                            <input
                                id="ak"
                                className="mono"
                                value={key}
                                maxLength={64}
                                onChange={(e) => {
                                    setKeyTouched(true);
                                    setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                                }}
                            />
                        </div>
                    </div>
                    <span className="field-label">Задаётся</span>
                    <Segmented
                        options={[
                            { value: "product", label: "У товара" },
                            { value: "variant", label: "У варианта" },
                        ]}
                        value={scope}
                        onChange={setScope}
                    />
                    <span className="field-hint">«У варианта» — когда значение разное у вкусов/цветов (цвет, сопротивление). Тип и ключ потом не меняются.</span>
                </>
            )}
            {type === "select" && (
                <div className="field">
                    <label htmlFor="ao">Значения через запятую</label>
                    <input id="ao" value={options} placeholder="20, 50" onChange={(e) => setOptions(e.target.value)} />
                </div>
            )}
            <SwitchRow title="Фильтр в каталоге" subtitle="Чип-фильтр на экране категории" checked={filterable} onChange={setFilterable} />
            <SwitchRow title="Показывать в списке" subtitle="В строке товара рядом с брендом" checked={showInList} onChange={setShowInList} />
            <div className="field">
                <label htmlFor="as">Порядок</label>
                <input id="as" className="mono" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^\d-]/g, ""))} />
            </div>
        </Sheet>
    );
}
