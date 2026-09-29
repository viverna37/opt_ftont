import type { AttributeDefinition } from "../../shared/api/types";
import { Switch } from "../../shared/ui/Switch/Switch";

type Props = { def: AttributeDefinition; value: unknown; onChange: (value: unknown) => void };

// Поле характеристики по её типу. Приведение типа и проверку делает бэкенд
// (number хранится числом, select — только из списка).
export function AttributeInput({ def, value, onChange }: Props) {
    const id = `attr-${def.key}`;
    const label = def.unit ? `${def.label}, ${def.unit}` : def.label;
    const text = value == null ? "" : String(value);

    if (def.type === "bool") {
        return (
            <div className="field attr-bool">
                <span className="field-label">{def.label}</span>
                <Switch checked={value === true} onChange={(v) => onChange(v)} label={def.label} />
            </div>
        );
    }
    if (def.type === "select") {
        return (
            <div className="field">
                <label htmlFor={id}>{label}</label>
                <select id={id} value={text} onChange={(e) => onChange(e.target.value || null)}>
                    <option value="">—</option>
                    {(def.options ?? []).map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
            </div>
        );
    }
    if (def.type === "color") {
        return (
            <div className="field">
                <label htmlFor={id}>{label}</label>
                <div className="attr-color">
                    <input type="color" aria-label={`${def.label}: палитра`} value={/^#[0-9a-f]{6}$/i.test(text) ? text : "#000000"} onChange={(e) => onChange(e.target.value)} />
                    <input id={id} value={text} placeholder="#RRGGBB или название" onChange={(e) => onChange(e.target.value || null)} />
                </div>
            </div>
        );
    }
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                className={def.type === "number" ? "mono" : undefined}
                inputMode={def.type === "number" ? "decimal" : undefined}
                value={text}
                onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
            />
        </div>
    );
}
