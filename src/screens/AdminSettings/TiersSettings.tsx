import { useCallback, useEffect, useState } from "react";
import { adminCreateTier, adminDeleteTier, adminTiers, adminUpdateTier } from "../../shared/api/endpoints";
import type { PriceTier } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconChevronRight, IconLayers, IconPlus } from "../../shared/ui/icons/Icon";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "../../shared/ui/MainAction/main_action.css";
import "./settings.css";

export function TiersSettings() {
    const { api, base } = useSession();
    const toast = useToast();
    useBackButton(`${base}/admin/settings`);
    const [items, setItems] = useState<PriceTier[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<PriceTier | "new" | null>(null);
    const [label, setLabel] = useState("");
    const [minQty, setMinQty] = useState("");
    const [labelTouched, setLabelTouched] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setItems(await adminTiers(api));
        } catch (e) {
            setError(errorText(e));
        }
    }, [api]);

    useEffect(() => {
        void load();
    }, [load]);

    const open = (t: PriceTier | "new") => {
        setEditing(t);
        setLabel(t === "new" ? "" : t.label);
        setMinQty(t === "new" ? "" : String(t.min_qty));
        setLabelTouched(t !== "new");
    };

    const tier = editing && editing !== "new" ? editing : null;

    const save = async () => {
        const qty = Number(minQty);
        if (!qty || qty < 1) {
            toast.show("Порог — целое число от 1", "danger");
            return;
        }
        setBusy(true);
        try {
            const body = { label: label.trim() || `от ${qty} шт`, min_qty: qty };
            if (tier) await adminUpdateTier(api, tier.id, body);
            else await adminCreateTier(api, { ...body, sort_order: items?.length ?? 0 });
            setEditing(null);
            await load();
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!tier || !(await confirmDialog(`Удалить уровень «${tier.label}»? Все цены на этом уровне удалятся.`))) return;
        try {
            await adminDeleteTier(api, tier.id);
            setEditing(null);
            await load();
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back={`${base}/admin/settings`} title="Уровни цен" />
                <div className="screen-pad">
                    <Banner>
                        Уровень определяется суммарным количеством всех вариантов товара в корзине: 6 шт манго + 4 шт колы = цена «от 10 шт» на оба вкуса.
                    </Banner>
                    {error && <Banner tone="danger">{error}</Banner>}
                    {!items && !error && <ListSkeleton rows={3} />}
                    {items?.length === 0 && (
                        <Empty icon={<IconLayers size={32} />} title="Уровней пока нет">
                            Можно один — «от 1 шт», если цена одна
                        </Empty>
                    )}
                    <div className="row-list">
                        {items?.map((t) => (
                            <button key={t.id} type="button" className="ref-row" onClick={() => open(t)}>
                                <span className="ref-row-text">
                                    <span className="ref-row-title">{t.label}</span>
                                    <span className="muted">от {t.min_qty} шт одного товара</span>
                                </span>
                                <IconChevronRight size={18} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="main-action">
                <Button icon={<IconPlus size={20} />} onClick={() => open("new")}>
                    Уровень
                </Button>
            </div>
            <Sheet
                open={!!editing}
                onClose={() => setEditing(null)}
                title={tier ? tier.label : "Новый уровень"}
                footer={
                    <>
                        {tier && (
                            <Button variant="danger" size="md" style={{ width: "auto" }} onClick={remove}>
                                Удалить
                            </Button>
                        )}
                        <Button size="md" onClick={save} loading={busy}>
                            Сохранить
                        </Button>
                    </>
                }
            >
                <div className="grid-2">
                    <div className="field">
                        <label htmlFor="tq">От, шт</label>
                        <input
                            id="tq"
                            className="mono"
                            inputMode="numeric"
                            value={minQty}
                            onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "");
                                setMinQty(v);
                                if (!labelTouched) setLabel(v ? `от ${v} шт` : "");
                            }}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="tl">Подпись</label>
                        <input
                            id="tl"
                            value={label}
                            maxLength={50}
                            onChange={(e) => {
                                setLabelTouched(true);
                                setLabel(e.target.value);
                            }}
                        />
                    </div>
                </div>
            </Sheet>
        </div>
    );
}
