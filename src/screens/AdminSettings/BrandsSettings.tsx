import { useCallback, useEffect, useState } from "react";
import { adminBrands, adminCreateBrand, adminDeleteBrand, adminUpdateBrand } from "../../shared/api/endpoints";
import type { Brand } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { IconChevronRight, IconPlus, IconTag } from "../../shared/ui/icons/Icon";
import { Sheet } from "../../shared/ui/Sheet/Sheet";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "../../shared/ui/MainAction/main_action.css";
import "./settings.css";

export function BrandsSettings() {
    const { api, base } = useSession();
    const toast = useToast();
    useBackButton(`${base}/admin/settings`);
    const [items, setItems] = useState<Brand[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Brand | "new" | null>(null);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setItems(await adminBrands(api));
        } catch (e) {
            setError(errorText(e));
        }
    }, [api]);

    useEffect(() => {
        void load();
    }, [load]);

    const brand = editing && editing !== "new" ? editing : null;

    const save = async () => {
        if (!name.trim()) return;
        setBusy(true);
        try {
            if (brand) await adminUpdateBrand(api, brand.id, { name: name.trim(), sort_order: brand.sort_order });
            else await adminCreateBrand(api, { name: name.trim(), sort_order: 0 });
            setEditing(null);
            await load();
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!brand || !(await confirmDialog(`Удалить бренд «${brand.name}»?`))) return;
        try {
            await adminDeleteBrand(api, brand.id);
            setEditing(null);
            await load();
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back={`${base}/admin/settings`} title="Бренды" />
                <div className="screen-pad">
                    {error && <Banner tone="danger">{error}</Banner>}
                    {!items && !error && <ListSkeleton rows={4} />}
                    {items?.length === 0 && <Empty icon={<IconTag size={32} />} title="Брендов пока нет" />}
                    <div className="row-list">
                        {items?.map((b) => (
                            <button
                                key={b.id}
                                type="button"
                                className="ref-row"
                                onClick={() => {
                                    setEditing(b);
                                    setName(b.name);
                                }}
                            >
                                <span className="ref-row-text">
                                    <span className="ref-row-title">{b.name}</span>
                                </span>
                                <IconChevronRight size={18} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="main-action">
                <Button
                    icon={<IconPlus size={20} />}
                    onClick={() => {
                        setEditing("new");
                        setName("");
                    }}
                >
                    Бренд
                </Button>
            </div>
            <Sheet
                open={!!editing}
                onClose={() => setEditing(null)}
                title={brand ? brand.name : "Новый бренд"}
                footer={
                    <>
                        {brand && (
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
                    <label htmlFor="bn">Название</label>
                    <input id="bn" value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
                </div>
            </Sheet>
        </div>
    );
}
