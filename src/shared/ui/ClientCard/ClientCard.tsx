import type { OrderClient } from "../../api/types";
import { displayName, ROLE_LABEL } from "../../format/format";
import { openLink } from "../../platform/telegram";
import { Avatar } from "../Avatar/Avatar";
import { IconChat } from "../icons/Icon";
import { Tag } from "../Tag/Tag";
import "./client_card.css";

// Кто прислал заявку / собирает корзину: аватар, имя, @username, заметка
// менеджера и кнопка «Написать» (t.me/{username}, без username — tg://user?id=)
export function ClientCard({ client }: { client: OrderClient }) {
    const name = displayName(client.user);
    return (
        <div className="client-card">
            <Avatar name={name} photo={client.user.photo_url} size={48} />
            <div className="client-card-text">
                <span className="client-card-name">{name}</span>
                <span className="muted">
                    {client.user.username ? `@${client.user.username}` : `id ${client.user.telegram_id}`}
                    {client.role !== "client" && ` · ${ROLE_LABEL[client.role]}`}
                </span>
                {client.note && <span className="client-card-note">{client.note}</span>}
                {client.status === "blocked" && <Tag tone="danger">Заблокирован</Tag>}
            </div>
            <button type="button" className="client-card-write" onClick={() => openLink(client.contact_url)}>
                <IconChat size={18} />
                Написать
            </button>
        </div>
    );
}
