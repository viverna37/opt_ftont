import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconChevronDown } from "../icons/Icon";
import "./chips.css";

// Горизонтальная лента чипов с прокруткой (фильтры, категории в админке)
export function ChipRow({ children }: { children: ReactNode }) {
    return <div className="chip-row">{children}</div>;
}

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean; dropdown?: boolean; count?: number };

export function Chip({ on, dropdown, count, children, className, ...rest }: ChipProps) {
    return (
        <button type="button" className={`chip ${on ? "on" : ""} ${className ?? ""}`} aria-pressed={on} {...rest}>
            {children}
            {!!count && <span className="chip-count">{count}</span>}
            {dropdown && <IconChevronDown size={14} strokeWidth={2.2} />}
        </button>
    );
}
