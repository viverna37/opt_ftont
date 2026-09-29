import "./switch.css";

type Props = { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean };

// Тумблер из макетов (44×26)
export function Switch({ checked, onChange, label, disabled }: Props) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            className={`switch ${checked ? "on" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                onChange(!checked);
            }}
        >
            <span className="switch-knob" />
        </button>
    );
}

export function SwitchRow({ title, subtitle, checked, onChange }: { title: string; subtitle?: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="switch-row">
            <div className="switch-row-text">
                <span className="switch-row-title">{title}</span>
                {subtitle && <span className="switch-row-sub">{subtitle}</span>}
            </div>
            <Switch checked={checked} onChange={onChange} label={title} />
        </div>
    );
}
