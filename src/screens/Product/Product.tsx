import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../../shared/api/endpoints";
import type { TierPrice, VariantCard } from "../../shared/api/types";
import { fileUrl } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { useCart } from "../../shared/cart/CartProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { attrText, money, STOCK } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { IconButton } from "../../shared/ui/Button/Button";
import { IconCart, IconChat, IconCopy, IconPhoto } from "../../shared/ui/icons/Icon";
import { Stepper } from "../../shared/ui/Stepper/Stepper";
import { StockDot } from "../../shared/ui/Tag/Tag";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { ErrorScreen } from "../ErrorScreen/ErrorScreen";
import { useToast } from "../../shared/ui/Toast/Toast";
import { openLink } from "../../shared/platform/telegram";
import { useBackButton } from "../../shared/platform/useBackButton";
import "./product.css";

const COLLAPSE_AFTER = 8;

// Текущий уровень — только для подсветки плитки; цены в корзине и заявке
// считает бэкенд. Режим qty — по количеству ЭТОГО товара в корзине, режим
// amount — уровень всей заявки из ответа корзины.
function currentTier(tiers: TierPrice[], qty: number): TierPrice | null {
    let current: TierPrice | null = tiers[0] ?? null;
    for (const t of tiers) if ((t.min_qty ?? 0) <= qty) current = t;
    return current;
}

export function Product() {
    const { productId } = useParams();
    const { api, base, me } = useSession();
    const byAmount = me.tenant.price_basis === "amount";
    const cart = useCart();
    const toast = useToast();
    const [expanded, setExpanded] = useState(false);
    const [photo, setPhoto] = useState(0);
    useBackButton();

    const { data: card, error, loading, reload } = useLoad(() => getProduct(api, Number(productId)), [api, productId]);

    const variants = useMemo(() => card?.variants ?? [], [card]);
    const inCart = useMemo(() => variants.reduce((sum, v) => sum + cart.qtyOf(v.id), 0), [variants, cart]);

    if (loading && !card) {
        return (
            <div className="screen">
                <TopBar back />
                <ScreenLoader />
            </div>
        );
    }
    if (!card) {
        return <ErrorScreen title="Товар не найден" description={error ?? undefined} actionText="Повторить" onAction={reload} />;
    }

    const tiers = card.tiers;
    const cartTierId = cart.cart?.tier?.tier_id ?? card.current_tier_id;
    const tier = byAmount ? (tiers.find((t) => t.tier_id === cartTierId) ?? tiers[0] ?? null) : currentTier(tiers, inCart);
    const nextTier = byAmount ? null : (tiers.find((t) => (t.min_qty ?? 0) > inCart) ?? null);
    const amountNext = byAmount && cart.cart?.next_tier ? tiers.find((t) => t.tier_id === cart.cart!.next_tier!.tier_id) : null;
    const shown = expanded ? variants : variants.slice(0, COLLAPSE_AFTER);
    const priceAt = (v: VariantCard) => v.prices.find((p) => p.tier_id === tier?.tier_id)?.amount ?? null;
    const productPrice = tiers.find((t) => t.tier_id === tier?.tier_id)?.amount ?? null;

    const copy = async () => {
        const text = [card.name, card.sku && `арт. ${card.sku}`].filter(Boolean).join(", ");
        try {
            await navigator.clipboard.writeText(text);
            toast.show("Позиция скопирована");
        } catch {
            toast.show(text);
        }
    };

    return (
        <div className="screen">
            <div className="screen-scroll with-bottom-bar">
                <TopBar
                    back
                    right={
                        cart.totalQty > 0 ? (
                            <Link to={`${base}/cart`} className="product-cart-pill" aria-label="Корзина">
                                <IconCart size={18} />
                                <span className="mono">{cart.totalQty}</span>
                            </Link>
                        ) : undefined
                    }
                />

                {card.photos.length > 0 ? (
                    <div className="product-gallery">
                        <div
                            className="product-gallery-track"
                            onScroll={(e) => {
                                const el = e.currentTarget;
                                setPhoto(Math.round(el.scrollLeft / el.clientWidth));
                            }}
                        >
                            {card.photos.map((url, i) => (
                                <img key={url} src={fileUrl(url)!} alt={i === 0 ? card.name : ""} loading={i ? "lazy" : "eager"} />
                            ))}
                        </div>
                        {card.photos.length > 1 && (
                            <div className="product-gallery-dots">
                                {card.photos.map((url, i) => (
                                    <span key={url} className={i === photo ? "on" : ""} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="product-photo-empty">
                        <IconPhoto size={28} strokeWidth={1.6} />
                    </div>
                )}

                <div className="product-head">
                    {card.brand && <span className="product-eyebrow">{card.brand}</span>}
                    <h1 className="product-title">{card.name}</h1>
                    {(card.attributes.length > 0 || card.sku) && (
                        <div className="product-specs">
                            {card.attributes.map((a) => (
                                <span key={a.key} className="spec" title={a.label}>
                                    {attrText(a)}
                                </span>
                            ))}
                            {card.sku && <span className="spec mono">{card.sku}</span>}
                        </div>
                    )}
                    {card.description && <p className="product-desc">{card.description}</p>}
                </div>

                {tiers.length > 0 && (
                    <div className="product-section">
                        <span className="muted product-label">{byAmount ? "Цена за штуку — зависит от суммы всей заявки" : "Цена за штуку"}</span>
                        <div className={`product-tiers cols-${Math.min(tiers.length, 3)}`}>
                            {tiers.map((t) => (
                                <div key={t.tier_id} className={`tier ${t.tier_id === tier?.tier_id ? "on" : ""}`}>
                                    <span className="tier-label">{t.label}</span>
                                    <span className="tier-price mono">{money(t.amount)}</span>
                                </div>
                            ))}
                        </div>
                        {nextTier && inCart > 0 && (
                            <p className="product-hint">
                                Ещё <b>{(nextTier.min_qty ?? 0) - inCart} шт</b> этого товара — и цена станет{" "}
                                <b className="mono">{money(nextTier.amount)}</b>
                            </p>
                        )}
                        {!byAmount && !nextTier && inCart > 0 && tiers.length > 1 && <p className="product-hint">У вас лучшая цена</p>}
                        {amountNext && cart.cart?.amount_to_next_tier != null && (
                            <p className="product-hint">
                                Добавьте в заявку ещё на <b className="mono">{money(cart.cart.amount_to_next_tier)}</b> — и эта позиция будет по{" "}
                                <b className="mono">{money(amountNext.amount)}</b>
                            </p>
                        )}
                    </div>
                )}

                <div className="product-section">
                    <div className="section-head">
                        <h2 className="section-title">{card.has_variants ? `Варианты · ${variants.length}` : "Количество"}</h2>
                        {inCart > 0 && <span className="muted">в корзине {inCart} шт</span>}
                    </div>
                    <div className="row-list">
                        {shown.map((v) => {
                            const out = v.stock_status === "out";
                            const own = priceAt(v);
                            return (
                                <div key={v.id} className={`variant ${out ? "out" : ""}`}>
                                    <StockDot status={v.stock_status} />
                                    <div className="variant-main">
                                        <span className="variant-name">{v.is_default ? card.name : v.name}</span>
                                        <span className={`variant-stock tone-${STOCK[v.stock_status].tone}`}>
                                            {v.stock_qty != null && !out ? `${v.stock_qty} шт` : STOCK[v.stock_status].label}
                                            {own != null && own !== productPrice && <span className="mono"> · {money(own)}</span>}
                                        </span>
                                    </div>
                                    <Stepper
                                        value={cart.qtyOf(v.id)}
                                        onChange={(q) => cart.setQty(v.id, q)}
                                        disabledPlus={out}
                                        label={v.name ?? card.name}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    {variants.length > COLLAPSE_AFTER && !expanded && (
                        <button type="button" className="link-btn" onClick={() => setExpanded(true)}>
                            Показать все {variants.length}
                        </button>
                    )}
                </div>
            </div>

            <div className="product-bar">
                <IconButton label="Скопировать позицию" className="product-bar-icon" onClick={copy}>
                    <IconCopy size={20} />
                </IconButton>
                {inCart > 0 ? (
                    <Link to={`${base}/cart`} className="product-bar-main">
                        <IconCart size={20} />В корзине {inCart} шт
                    </Link>
                ) : card.ask_manager_url ? (
                    <button type="button" className="product-bar-main" onClick={() => openLink(card.ask_manager_url!)}>
                        <IconChat size={20} />
                        Спросить менеджера
                    </button>
                ) : (
                    <span className="product-bar-note">Выберите количество — позиции попадут в заявку</span>
                )}
                {inCart > 0 && card.ask_manager_url && (
                    <IconButton label="Спросить менеджера" className="product-bar-icon" onClick={() => openLink(card.ask_manager_url!)}>
                        <IconChat size={20} />
                    </IconButton>
                )}
            </div>
        </div>
    );
}
