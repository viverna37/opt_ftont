import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconChevronRight } from "../icons/Icon";
import "./menu_row.css";

type Props = { to?: string; onClick?: () => void; icon?: ReactNode; title: string; subtitle?: ReactNode; right?: ReactNode };

// Строка меню настроек (плитка из «Быстрых действий» макета)
export function MenuRow({ to, onClick, icon, title, subtitle, right }: Props) {
    const body = (
        <>
            {icon && <span className="menu-row-icon">{icon}</span>}
            <span className="menu-row-text">
                <span className="menu-row-title">{title}</span>
                {subtitle && <span className="menu-row-sub">{subtitle}</span>}
            </span>
            {right ?? <IconChevronRight size={18} />}
        </>
    );
    return to ? (
        <Link to={to} className="menu-row">
            {body}
        </Link>
    ) : (
        <button type="button" className="menu-row" onClick={onClick}>
            {body}
        </button>
    );
}
