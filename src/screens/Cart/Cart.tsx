import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCart, submitCart } from "../../shared/api/endpoints";
import type { CartBlocker, CartGroup } from "../../shared/api/types";
import { ApiError, errorText, fileUrl } from "../../shared/api/client";
import { useSession } from "../../shared/session/SessionProvider";
import { useCart } from "../../shared/cart/CartProvider";
import { getCommentDraft, setCommentDraft } from "../../shared/local/storage";
import { money, positions } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Button, IconButton } from "../../shared/ui/Button/Button";
import { IconCart, IconPhoto, IconTrash, IconAlert } from "../../shared/ui/icons/Icon";
import { Stepper } from "../../shared/ui/Stepper/Stepper";
import { Tag } from "../../shared/ui/Tag/Tag";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { ScreenLoader } from "../../shared/ui/Spinner/Spinner";
import { MainAction } from "../../shared/ui/MainAction/MainAction";
import { ClientTabs } from "../../shared/ui/Tabs/Tabs";
import { useToast } from "../../shared/ui/Toast/Toast";
import { confirmDialog, haptic } from "../../shared/platform/telegram";
import "./cart.css";

const BLOCKER_TEXT: Record<CartBlocker, string> = {
    empty: "Корзина пуста",
    unavailable_items: "Некоторых позиций больше нет в наличии — уберите их, чтобы отправить заявку",
    no_price_items: "У некоторых позиций нет цены — уточните у менеджера или уберите их",
    below_min_amount: "Сумма меньше минимальной для заявки",
};

export function CartScreen() {
    const { api, base, slug, me } = useSession();
    const cart = useCart();
    const toast = useToast();
    const navigate = useNavigate();
    const [comment, setComment] = useState(() => getCommentDraft(slug));
    const [sending, setSending] = useState(false);

    useEffect(() => {
        void cart.refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => setCommentDraft(slug, comment), [slug, comment]);

    const data = cart.cart;

    const submit = async () => {
        if (!data?.can_submit || cart.syncing) return;
        setSending(true);
        try {
            const order = await submitCart(api, comment.trim());
            haptic("success");
            setComment("");
            setCommentDraft(slug, "");
            await cart.refresh();
            navigate(`${base}/cart/sent/${order.id}`, { replace: true });
        } catch (e) {
            haptic("error");
            toast.show(e instanceof ApiError && e.code ? errorText(e) : "Не удалось отправить заявку", "danger");
            void cart.refresh();
        } finally {
            setSending(false);
        }
    };

    const clear = async () => {
        if (!(await confirmDialog("Очистить корзину?"))) return;
        try {
            cart.replace(await clearCart(api));
        } catch (e) {
            toast.show(errorText(e), "danger");
        }
    };

    if (!data && cart.loading) {
        return (
            <div className="screen">
                <TopBar title="Корзина" size="lg" />
                <ScreenLoader />
                <ClientTabs />
            </div>
        );
    }

    const empty = !data || data.groups.length === 0;
    const minLeft = data?.min_order_amount ? data.min_order_amount - data.total : 0;
    const blockers = (data?.blockers ?? []).filter((b) => b !== "empty");

    return (
        <div className="screen">
            <div className={`screen-scroll ${empty ? "with-tabbar" : "cart-scroll"}`}>
                <TopBar
                    title="Корзина"
                    size="lg"
                    subtitle={empty ? undefined : `${positions(data!.positions)} · ${data!.total_qty} шт`}
                    right={
                        !empty && (
                            <IconButton label="Очистить корзину" onClick={clear}>
                                <IconTrash size={20} />
                            </IconButton>
                        )
                    }
                />

                {empty ? (
                    <div className="screen-pad">
                        <Empty
                            icon={<IconCart size={36} />}
                            title="Корзина пуста"
                            action={
                                <Link to={`${base}/catalog`} className="link-btn">
                                    Перейти в каталог
                                </Link>
                            }
                        >
                            Отметьте количество на карточке товара — позиции соберутся здесь в заявку для менеджера
                        </Empty>
                    </div>
                ) : (
                    <div className="screen-pad">
                        {data!.price_basis === "amount" && data!.tier && (
                            <div className="cart-tier">
                                <span>
                                    Цены по уровню <b>«{data!.tier.label}»</b>
                                </span>
                                {data!.next_tier && data!.amount_to_next_tier != null && (
                                    <span className="cart-tier-next">
                                        Ещё <b className="mono">{money(data!.amount_to_next_tier)}</b> — и вся заявка по «{data!.next_tier.label}»
                                    </span>
                                )}
                            </div>
                        )}
                        {data!.groups.map((g) => (
                            <Group key={g.product_id} group={g} />
                        ))}

                        <div className="field">
                            <label htmlFor="comment">Комментарий к заявке</label>
                            <textarea
                                id="comment"
                                maxLength={1000}
                                placeholder="Например: доставка после обеда, замены согласовать"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <div className="cart-total">
                            <div className="cart-total-row">
                                <span>Позиций</span>
                                <span className="mono">{data!.positions}</span>
                            </div>
                            <div className="cart-total-row">
                                <span>Штук</span>
                                <span className="mono">{data!.total_qty}</span>
                            </div>
                            <div className="cart-total-row big">
                                <span>Итого</span>
                                <span className="mono">{money(data!.total)}</span>
                            </div>
                            {minLeft > 0 && (
                                <span className="cart-total-min">
                                    Минимальная заявка — {money(data!.min_order_amount)}, добавьте ещё на {money(minLeft)}
                                </span>
                            )}
                        </div>

                        {blockers.map((b) => (
                            <Banner key={b} tone="low" icon={<IconAlert size={18} />}>
                                {BLOCKER_TEXT[b]}
                            </Banner>
                        ))}

                        <p className="cart-note">
                            Это не покупка: заявка уйдёт менеджеру {me.tenant.name}, он свяжется с вами и подтвердит наличие и доставку.
                        </p>
                    </div>
                )}
            </div>

            {!empty && (
                <MainAction
                    aboveTabbar
                    text={cart.syncing ? "Обновляем корзину…" : `Отправить менеджеру · ${money(data!.total)}`}
                    onClick={submit}
                    disabled={!data!.can_submit || cart.syncing}
                    loading={sending}
                />
            )}
            <ClientTabs />
        </div>
    );
}

function Group({ group }: { group: CartGroup }) {
    const { base } = useSession();
    const cart = useCart();
    const cover = fileUrl(group.cover_url);
    return (
        <section className="cart-group">
            <Link to={`${base}/catalog/p/${group.product_id}`} className="cart-group-head">
                <span className="cart-thumb">{cover ? <img src={cover} alt="" /> : <IconPhoto size={18} />}</span>
                <span className="cart-group-text">
                    <span className="cart-group-name">{group.product_name}</span>
                    <span className="muted">
                        {group.total_qty} шт{group.tier ? ` · цена «${group.tier.label}»` : ""}
                    </span>
                </span>
                <span className="mono cart-group-sum">{money(group.subtotal)}</span>
            </Link>
            {group.next_tier && group.qty_to_next_tier != null && group.total_qty > 0 && (
                <div className="cart-hint">
                    Ещё <b>{group.qty_to_next_tier} шт</b> до цены «{group.next_tier.label}»
                </div>
            )}
            {group.lines.map((line) => {
                const label = line.variant_name ?? group.product_name;
                return (
                    <div key={line.variant_id} className={`cart-line ${line.problem ? "problem" : ""}`}>
                        <div className="cart-line-main">
                            <span className="cart-line-name">{line.variant_name ?? "Количество"}</span>
                            {line.problem === "unavailable" ? (
                                <Tag tone="danger">Нет в наличии</Tag>
                            ) : line.problem === "no_price" ? (
                                <Tag tone="low">Цена по запросу</Tag>
                            ) : (
                                <span className="cart-line-price">
                                    <span className="mono">{money(line.unit_price)}</span> × {line.qty}
                                    {line.sku && <span className="mono cart-line-sku"> · {line.sku}</span>}
                                </span>
                            )}
                        </div>
                        {line.problem === "unavailable" ? (
                            <Button variant="danger" size="sm" onClick={() => cart.setQty(line.variant_id, 0)}>
                                Убрать
                            </Button>
                        ) : (
                            <Stepper compact value={cart.qtyOf(line.variant_id)} onChange={(q) => cart.setQty(line.variant_id, q)} label={label} />
                        )}
                    </div>
                );
            })}
        </section>
    );
}
