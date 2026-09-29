import { useEffect, useState } from "react";
import { IconMinus, IconPlus } from "../icons/Icon";
import "./stepper.css";

type Props = {
    value: number;
    onChange: (value: number) => void;
    disabledPlus?: boolean;
    label: string; // для aria: название варианта
    compact?: boolean;
};

// Степпер количества: −/+ и ввод числа. Пока 0 — одна кнопка «+» (добавить).
export function Stepper({ value, onChange, disabledPlus, label, compact }: Props) {
    const [draft, setDraft] = useState(String(value));
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (!editing) setDraft(String(value));
    }, [value, editing]);

    if (value === 0 && !editing) {
        return (
            <button
                type="button"
                className={`stepper-add ${compact ? "compact" : ""}`}
                onClick={() => onChange(1)}
                disabled={disabledPlus}
                aria-label={`Добавить: ${label}`}
            >
                <IconPlus size={18} />
            </button>
        );
    }

    const commit = () => {
        setEditing(false);
        const next = Math.max(0, Math.floor(Number(draft.replace(/\D/g, "")) || 0));
        if (next !== value) onChange(next);
        else setDraft(String(value));
    };

    return (
        <div className={`stepper ${compact ? "compact" : ""}`}>
            <button type="button" onClick={() => onChange(value - 1)} aria-label={`Меньше: ${label}`}>
                <IconMinus size={16} />
            </button>
            <input
                inputMode="numeric"
                aria-label={`Количество: ${label}`}
                value={draft}
                onFocus={(e) => {
                    setEditing(true);
                    e.target.select();
                }}
                onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onBlur={commit}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            />
            <button type="button" onClick={() => onChange(value + 1)} disabled={disabledPlus} aria-label={`Больше: ${label}`}>
                <IconPlus size={16} />
            </button>
        </div>
    );
}
