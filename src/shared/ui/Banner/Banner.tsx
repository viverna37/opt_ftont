import type { ReactNode } from "react";
import "./banner.css";

export function Banner({ tone = "info", children, icon }: { tone?: "info" | "low" | "danger" | "ok"; children: ReactNode; icon?: ReactNode }) {
    return (
        <div className={`banner banner-${tone}`}>
            {icon}
            <div className="banner-text">{children}</div>
        </div>
    );
}
