import { useEffect, useRef, type ReactNode } from "react";
import { tg } from "../../platform/telegram";
import { Button } from "../Button/Button";
import "./main_action.css";

type Props = {
    text: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    secondary?: ReactNode; // кнопка слева от основной (только в экранной версии)
    aboveTabbar?: boolean; // экранная версия над таб-баром (корзина)
};

function cssVar(name: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Главное действие экрана («Отправить менеджеру», «Сохранить»). В Telegram —
// нативная MainButton внизу, в браузере — такая же панель на странице.
export function MainAction({ text, onClick, disabled, loading, secondary, aboveTabbar }: Props) {
    const app = tg();
    const handler = useRef(onClick);
    useEffect(() => {
        handler.current = onClick;
    }, [onClick]);

    useEffect(() => {
        if (!app) return;
        const click = () => handler.current();
        app.MainButton.onClick(click);
        return () => {
            app.MainButton.offClick(click);
            app.MainButton.hideProgress();
            app.MainButton.hide();
        };
    }, [app]);

    useEffect(() => {
        if (!app) return;
        app.MainButton.setParams({
            text,
            color: disabled ? cssVar("--surface-alt") : cssVar("--accent"),
            text_color: disabled ? cssVar("--ink-soft") : cssVar("--on-accent"),
            is_active: !disabled && !loading,
            is_visible: true,
        });
        if (loading) app.MainButton.showProgress(false);
        else app.MainButton.hideProgress();
    }, [app, text, disabled, loading]);

    if (app && !secondary) return null;

    return (
        <div className={`main-action ${aboveTabbar ? "above-tabbar" : ""}`}>
            {secondary}
            {!app && (
                <Button onClick={onClick} disabled={disabled} loading={loading}>
                    {text}
                </Button>
            )}
        </div>
    );
}
