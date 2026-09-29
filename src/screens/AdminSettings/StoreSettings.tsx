import { useEffect, useRef, useState } from "react";
import { adminSettings, adminUpdateSettings, adminUploadLogo } from "../../shared/api/endpoints";
import type { AccessMode, PriceBasis, TenantSettings } from "../../shared/api/types";
import { errorText } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { moneyInput, parseMoney } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button } from "../../shared/ui/Button/Button";
import { Logo } from "../../shared/ui/Logo/Logo";
import { Segmented } from "../../shared/ui/Segmented/Segmented";
import { SwitchRow } from "../../shared/ui/Switch/Switch";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { MainAction } from "../../shared/ui/MainAction/MainAction";
import { useToast } from "../../shared/ui/Toast/Toast";
import { haptic } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "./settings.css";

const ACCENTS = ["#8BE0B4", "#F2BE5C", "#8AB4F8", "#F2A58E", "#C9A7F5", "#6FD3E0"];
const CURRENCIES = ["RUB", "KZT", "BYN", "UZS", "USD", "EUR"];

type Draft = {
    name: string;
    accent_color: string;
    welcome_text: string;
    manager_username: string;
    currency: string;
    timezone: string;
    access_mode: AccessMode;
    age_gate: boolean;
    price_basis: PriceBasis;
    min_order_amount: string;
    low_stock_threshold: string;
};

function draftOf(s: TenantSettings): Draft {
    return {
        name: s.name,
        accent_color: s.accent_color,
        welcome_text: s.welcome_text ?? "",
        manager_username: s.manager_username ?? "",
        currency: s.currency,
        timezone: s.timezone,
        access_mode: s.access_mode,
        age_gate: s.age_gate,
        price_basis: s.price_basis,
        min_order_amount: moneyInput(s.min_order_amount),
        low_stock_threshold: String(s.low_stock_threshold),
    };
}

export function StoreSettings() {
    const { api, base, reloadMe } = useSession();
    const toast = useToast();
    useBackButton(`${base}/admin/settings`);
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const file = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        adminSettings(api)
            .then((s) => {
                setSettings(s);
                setDraft(draftOf(s));
            })
            .catch((e) => setError(errorText(e)));
    }, [api]);

    if (!draft || !settings) {
        return (
            <div className="screen">
                <TopBar back={`${base}/admin/settings`} title="Оформление и доступ" />
                {error ? <Banner tone="danger">{error}</Banner> : <ScreenLoader />}
            </div>
        );
    }

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });

    const save = async () => {
        if (!/^#[0-9a-f]{6}$/i.test(draft.accent_color)) {
            toast.show("Цвет — в формате #RRGGBB", "danger");
            return;
        }
        setSaving(true);
        try {
            const next = await adminUpdateSettings(api, {
                name: draft.name.trim(),
                accent_color: draft.accent_color,
                welcome_text: draft.welcome_text.trim() || null,
                manager_username: draft.manager_username.trim().replace(/^@/, "") || null,
                currency: draft.currency,
                timezone: draft.timezone.trim(),
                access_mode: draft.access_mode,
                age_gate: draft.age_gate,
                price_basis: draft.price_basis,
                min_order_amount: parseMoney(draft.min_order_amount),
                low_stock_threshold: Math.max(0, Number(draft.low_stock_threshold) || 0),
            });
            setSettings(next);
            setDraft(draftOf(next));
            await reloadMe();
            haptic("success");
            toast.show("Сохранено", "success");
        } catch (e) {
            toast.show(errorText(e), "danger");
        } finally {
            setSaving(false);
        }
    };

    const uploadLogo = async (f: File | undefined) => {
        if (!f) return;
        try {
            setSettings(await adminUploadLogo(api, f));
            await reloadMe();
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar back={`${base}/admin/settings`} title="Оформление и доступ" />
                <div className="screen-pad">
                    {!settings.bot_configured && <Banner tone="low">Бот не подключён — клиенты не смогут войти. Токен задаётся через CLI сервиса.</Banner>}

                    <h2 className="section-title">Витрина</h2>
                    <div className="logo-row">
                        <Logo name={draft.name} url={settings.logo_url} size={64} />
                        <Button variant="surface" size="sm" onClick={() => file.current?.click()}>
                            {settings.logo_url ? "Заменить логотип" : "Загрузить логотип"}
                        </Button>
                        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => uploadLogo(e.target.files?.[0])} />
                    </div>
                    <div className="field">
                        <label htmlFor="sn">Название</label>
                        <input id="sn" value={draft.name} maxLength={150} onChange={(e) => set("name", e.target.value)} />
                    </div>
                    <div className="field">
                        <span className="field-label">Акцентный цвет</span>
                        <div className="color-row">
                            {ACCENTS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    aria-label={`Цвет ${c}`}
                                    aria-pressed={draft.accent_color.toUpperCase() === c}
                                    className={`color-swatch ${draft.accent_color.toUpperCase() === c ? "on" : ""}`}
                                    style={{ background: c }}
                                    onClick={() => set("accent_color", c)}
                                />
                            ))}
                        </div>
                        <input className="input mono" aria-label="Свой цвет" value={draft.accent_color} maxLength={7} onChange={(e) => set("accent_color", e.target.value)} />
                    </div>
                    <div className="field">
                        <label htmlFor="sw">Текст приветствия</label>
                        <textarea id="sw" value={draft.welcome_text} maxLength={2000} placeholder="Показывается на экране входа и в боте" onChange={(e) => set("welcome_text", e.target.value)} />
                    </div>
                    <div className="grid-2">
                        <div className="field">
                            <label htmlFor="sm">Менеджер в Telegram</label>
                            <input id="sm" value={draft.manager_username} placeholder="@username" onChange={(e) => set("manager_username", e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="sc">Валюта</label>
                            <select id="sc" value={draft.currency} onChange={(e) => set("currency", e.target.value)}>
                                {CURRENCIES.map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <h2 className="section-title">Доступ</h2>
                    <Segmented
                        options={[
                            { value: "open", label: "Открытый" },
                            { value: "approval", label: "По одобрению" },
                        ]}
                        value={draft.access_mode}
                        onChange={(v) => set("access_mode", v)}
                    />
                    <span className="field-hint">
                        {draft.access_mode === "open"
                            ? "Каталог видит любой, кто открыл бота."
                            : "Новый клиент видит «Ожидайте подтверждения», вы открываете доступ в разделе Клиенты."}
                    </span>
                    <SwitchRow title="Подтверждение 18+" subtitle="Один раз при первом входе, одна кнопка" checked={draft.age_gate} onChange={(v) => set("age_gate", v)} />

                    <h2 className="section-title">Уровни цен</h2>
                    <Segmented
                        options={[
                            { value: "qty", label: "По кол-ву товара" },
                            { value: "amount", label: "По сумме заявки" },
                        ]}
                        value={draft.price_basis}
                        onChange={(v) => set("price_basis", v)}
                    />
                    <span className="field-hint">
                        {draft.price_basis === "qty"
                            ? "«от 10 шт»: цена товара зависит от того, сколько штук его в заявке."
                            : "«от 10 000 ₽»: цены всех позиций зависят от суммы всей заявки."}{" "}
                        Сменить режим можно, только когда уровни цен не заведены.
                    </span>

                    <h2 className="section-title">Заявки и наличие</h2>
                    <div className="grid-2">
                        <div className="field">
                            <label htmlFor="smin">Мин. сумма заявки</label>
                            <input id="smin" className="mono" inputMode="decimal" placeholder="нет" value={draft.min_order_amount} onChange={(e) => set("min_order_amount", e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="slow">«Мало» — от, шт</label>
                            <input id="slow" className="mono" inputMode="numeric" value={draft.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value.replace(/\D/g, ""))} />
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="stz">Часовой пояс</label>
                        <input id="stz" value={draft.timezone} placeholder="Europe/Moscow" onChange={(e) => set("timezone", e.target.value)} />
                        <span className="field-hint">Для дат в тексте заявки и выгрузках</span>
                    </div>
                </div>
            </div>
            <MainAction text="Сохранить" onClick={save} loading={saving} />
        </div>
    );
}
