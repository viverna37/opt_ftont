import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconX } from "../icons/Icon";
import "./sheet.css";

type SheetProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
};

// Нижняя шторка: фильтры, сортировка, формы справочников, действия с клиентом
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    return createPortal(
        <div className={`sheet-overlay ${open ? "open" : ""}`} onClick={onClose} aria-hidden={!open}>
            <div className={`sheet-panel ${open ? "open" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
                <div className="sheet-head">
                    <div className="sheet-grabber" />
                    {title && <div className="sheet-title">{title}</div>}
                    <button type="button" className="sheet-close" onClick={onClose} aria-label="Закрыть">
                        <IconX size={20} />
                    </button>
                </div>
                <div className="sheet-body">{open && children}</div>
                {footer && open && <div className="sheet-footer">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
}
