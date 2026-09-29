import type { ReactNode } from "react";

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
    return (
        <div className="empty">
            {icon && <span style={{ color: "var(--ink-faint)" }}>{icon}</span>}
            <span className="empty-title">{title}</span>
            {children && <span>{children}</span>}
            {action}
        </div>
    );
}
