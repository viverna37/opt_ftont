import type { ReactNode } from "react";
import type { StockStatus } from "../../api/types";
import { STOCK } from "../../format/format";
import "./tag.css";

export type Tone = "ok" | "low" | "out" | "info" | "danger" | "accent";

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
    return <span className={`tag tag-${tone}`}>{children}</span>;
}

export function StockTag({ status }: { status: StockStatus }) {
    return <Tag tone={STOCK[status].tone}>{STOCK[status].label}</Tag>;
}

// Точка наличия в списке вариантов
export function StockDot({ status }: { status: StockStatus }) {
    return <span className={`dot dot-${STOCK[status].tone}`} aria-label={STOCK[status].label} />;
}
