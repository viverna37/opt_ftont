import { Button } from "../../shared/ui/Button/Button";
import { IconAlert } from "../../shared/ui/icons/Icon";
import "./error_screen.css";

type Props = { title: string; description?: string; actionText?: string; onAction?: () => void };

export function ErrorScreen({ title, description, actionText, onAction }: Props) {
    return (
        <div className="screen error-screen">
            <div className="error-screen-body">
                <span className="error-screen-icon">
                    <IconAlert size={28} />
                </span>
                <h1 className="error-screen-title">{title}</h1>
                {description && <p className="error-screen-text">{description}</p>}
            </div>
            {actionText && onAction && (
                <div className="error-screen-actions">
                    <Button onClick={onAction}>{actionText}</Button>
                </div>
            )}
        </div>
    );
}
