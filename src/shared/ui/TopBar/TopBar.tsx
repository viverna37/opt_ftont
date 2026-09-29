import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IconBack } from "../icons/Icon";
import { IconButton } from "../Button/Button";
import "./top_bar.css";

type TopBarProps = {
    title?: ReactNode;
    subtitle?: ReactNode;
    back?: string | true; // путь или true = history.back()
    right?: ReactNode;
    size?: "lg" | "md";
};

// Шапка экрана из макетов: квадратная «назад», заголовок Unbounded, подзаголовок
export function TopBar({ title, subtitle, back, right, size = "md" }: TopBarProps) {
    const navigate = useNavigate();
    return (
        <div className="top-bar">
            {back && (
                <IconButton label="Назад" onClick={() => (back === true ? navigate(-1) : navigate(back))}>
                    <IconBack size={20} />
                </IconButton>
            )}
            <div className="top-bar-text">
                {title && <h1 className={`top-bar-title ${size}`}>{title}</h1>}
                {subtitle && <span className="top-bar-subtitle">{subtitle}</span>}
            </div>
            {right}
        </div>
    );
}
