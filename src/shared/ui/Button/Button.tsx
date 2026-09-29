import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "accent" | "surface" | "outline" | "ghost" | "danger";
    size?: "lg" | "md" | "sm";
    loading?: boolean;
    icon?: ReactNode;
};

export function Button({ variant = "accent", size = "lg", loading = false, icon, disabled, children, className, ...rest }: ButtonProps) {
    return (
        <button className={`btn btn-${variant} btn-${size} ${className ?? ""}`} disabled={disabled || loading} {...rest}>
            {loading ? <span className="btn-spinner" /> : icon}
            {children && <span>{children}</span>}
        </button>
    );
}

// Квадратная кнопка-иконка 44×44 из шапок макетов (назад, поиск, менеджер)
export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
    return (
        <button type="button" aria-label={label} className={`icon-btn ${className ?? ""}`} {...rest}>
            {children}
        </button>
    );
}
