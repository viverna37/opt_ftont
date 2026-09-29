import "./segmented.css";

type Option<T extends string> = { value: T; label: string };

// Сегментный переключатель из макета «Клиенты» (Заявки · 3 / С доступом · 28)
export function Segmented<T extends string>({ options, value, onChange }: { options: Option<T>[]; value: T; onChange: (v: T) => void }) {
    return (
        <div className="segmented" role="tablist">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    role="tab"
                    aria-selected={o.value === value}
                    className={`segmented-item ${o.value === value ? "on" : ""}`}
                    onClick={() => onChange(o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
