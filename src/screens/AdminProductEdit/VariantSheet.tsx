import { useEffect, useState } from "react";
import { adminCreateVariant, adminDeleteVariant, adminReplacePrices, adminUpdateVariant } from "../../shared/api/endpoints";
import type { AdminProduct, AdminVariant, AttributeDefinition, PriceTier } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { moneyInput, parseMoney } from "../../shared/format/format";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { Button } from "../../shared/ui/Button/Button";
import { SwitchRow } from "../../shared/ui/Switch/Switch";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog } from "../../shared/platform/telegram";
import { AttributeInput } from "./AttributeInput";
import { useSession } from "../../shared/session/SessionProvider";

type Props = {
    open: boolean;
    variant: AdminVariant | null; // null — новый
    product: AdminProduct;
    tiers: PriceTier[];
    attributes: AttributeDefinition[];
    onClose: () => void;
    onSaved: (product: AdminProduct) => void;
};

// Вариант товара (вкус/цвет/сопротивление): название, артикул, атрибуты
// варианта и — по желанию — своя цена, если она отличается от цены товара.
export function VariantSheet({ open, variant, product, tiers, attributes, onClose, onSaved }: Props) {
    const { api } = useSession();
    const toast = useToast();
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [attrs, setAttrs] = useState<Record<string, unknown>>({});
    const [ownPrice, setOwnPrice] = useState(false);
    const [prices, setPrices] = useState<Record<number, string>>({});
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(variant?.name ?? "");
        setSku(variant?.sku ?? "");
        setAttrs({ ...(variant?.attributes ?? {}) });
        const own = variant ? product.prices.filter((r) => r.variant_id === variant.id) : [];
        setOwnPrice(own.length > 0);
        setPrices(Object.fromEntries(own.map((r) => [r.tier_id, moneyInput(r.amount)])));
    }, [open, variant, product]);

    const save = async () => {
        if (!name.trim()) {
            toast.show("Укажите название варианта", "danger");
            return;
        }
        setBusy(true);
        try {
            const body = { name: name.trim(), sku: sku.trim() || null, attributes: attrs };
            let saved = variant ? await adminUpdateVariant(api, product.id, variant.id, body) : await adminCreateVariant(api, product.id, body);
            const variantId = variant?.id ?? Math.max(...saved.variants.map((v) => v.id));
            const others = saved.prices.filter((r) => r.variant_id !== variantId);
            const own = ownPrice
                ? tiers
                      .map((t) => ({ tier_id: t.id, variant_id: variantId, amount: parseMoney(prices[t.id] ?? "") }))
                      .filter((r): r is { tier_id: number; variant_id: number; amount: number } => r.amount != null)
                : [];
            const hadOwn = saved.prices.some((r) => r.variant_id === variantId);
            if (own.length || hadOwn) saved = await adminReplacePrices(api, product.id, [...others, ...own]);
            onSaved(saved);
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!variant || !(await confirmDialog(`Скрыть вариант «${variant.name}»? В корзинах он станет недоступен.`))) return;
        try {
            onSaved(await adminDeleteVariant(api, product.id, variant.id));
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={variant ? "Вариант" : "Новый вариант"}
            footer={
                <>
                    {variant && (
                        <Button variant="danger" size="md" onClick={remove} style={{ width: "auto" }}>
                            Удалить
                        </Button>
                    )}
                    <Button size="md" onClick={save} loading={busy}>
                        Сохранить
                    </Button>
                </>
            }
        >
            <div className="field">
                <label htmlFor="vn">Название</label>
                <input id="vn" value={name} maxLength={255} placeholder="Вкус, цвет, сопротивление" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
                <label htmlFor="vs">Артикул варианта</label>
                <input id="vs" className="mono" value={sku} maxLength={100} onChange={(e) => setSku(e.target.value)} />
            </div>
            {attributes.map((a) => (
                <AttributeInput key={a.id} def={a} value={attrs[a.key]} onChange={(v) => setAttrs({ ...attrs, [a.key]: v })} />
            ))}
            <SwitchRow title="Своя цена" subtitle="Если этот вариант стоит иначе, чем товар" checked={ownPrice} onChange={setOwnPrice} />
            {ownPrice && (
                <div className={tiers.length >= 3 ? "grid-3" : "grid-2"}>
                    {tiers.map((t) => (
                        <div key={t.id} className="field">
                            <label htmlFor={`vp${t.id}`}>{t.label}</label>
                            <input id={`vp${t.id}`} className="mono" inputMode="decimal" placeholder="—" value={prices[t.id] ?? ""} onChange={(e) => setPrices({ ...prices, [t.id]: e.target.value })} />
                        </div>
                    ))}
                </div>
            )}
        </Sheet>
    );
}
