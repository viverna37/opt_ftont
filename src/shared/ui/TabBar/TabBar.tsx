import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import type { IconProps } from "../icons/Icon";
import "./tab_bar.css";

export type TabItem = { to: string; label: string; Icon: ComponentType<IconProps>; badge?: number; end?: boolean };

// Нижний таб-бар из макетов. Клиент: Каталог / Корзина / Заявки;
// админ: Заявки / Товары / Клиенты / Настройки.
export function TabBar({ items }: { items: TabItem[] }) {
    return (
        <nav className="tab-bar">
            {items.map(({ to, label, Icon, badge, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab-bar-item ${isActive ? "on" : ""}`}>
                    <span className="tab-bar-icon">
                        <Icon size={22} />
                        {!!badge && <span className="tab-bar-badge">{badge > 999 ? "999+" : badge}</span>}
                    </span>
                    {label}
                </NavLink>
            ))}
        </nav>
    );
}
