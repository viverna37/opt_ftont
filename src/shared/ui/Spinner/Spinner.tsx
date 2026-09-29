import "./spinner.css";

export function Spinner({ size = 24 }: { size?: number }) {
    return <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Загрузка" />;
}

export function ScreenLoader() {
    return (
        <div className="screen-loader">
            <Spinner size={28} />
        </div>
    );
}

// Скелетон списка товаров — пока грузится первая страница
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="list-skeleton">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="list-skeleton-row">
                    <div className="list-skeleton-text">
                        <span className="skeleton" style={{ width: `${70 - (i % 3) * 12}%`, height: 16 }} />
                        <span className="skeleton" style={{ width: "45%", height: 12 }} />
                    </div>
                    <span className="skeleton" style={{ width: 64, height: 16 }} />
                </div>
            ))}
        </div>
    );
}
