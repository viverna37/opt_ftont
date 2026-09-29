import { useNavigate } from "react-router-dom";
import { useSession } from "../../shared/session/SessionProvider";
import { setStaffMode } from "../../shared/local/storage";
import { displayName, ROLE_LABEL } from "../../shared/format/format";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { MenuRow } from "../../shared/ui/MenuRow/MenuRow";
import { Avatar } from "../../shared/ui/Avatar/Avatar";
import { IconClock, IconEye, IconGrid, IconLayers, IconPalette, IconSliders, IconTag } from "../../shared/ui/icons/Icon";
import { AdminTabs } from "../../shared/ui/Tabs/Tabs";
import "./settings.css";

export function AdminSettings() {
    const { me, base, slug } = useSession();
    const navigate = useNavigate();
    const isAdmin = me.role === "owner" || me.role === "admin";
    const name = displayName(me.user);

    return (
        <div className="screen">
            <div className="screen-scroll with-tabbar">
                <TopBar title="Настройки" size="lg" />
                <div className="screen-pad">
                    <div className="settings-me">
                        <Avatar name={name} photo={me.user.photo_url} size={48} />
                        <div className="settings-me-text">
                            <span className="settings-me-name">{name}</span>
                            <span className="muted">
                                {ROLE_LABEL[me.role]} · {me.tenant.name}
                            </span>
                        </div>
                    </div>

                    {isAdmin ? (
                        <>
                            <h2 className="section-title">Каталог</h2>
                            <div className="menu-list">
                                <MenuRow to={`${base}/admin/settings/categories`} icon={<IconGrid size={20} />} title="Категории" subtitle="Дерево и характеристики категорий" />
                                <MenuRow to={`${base}/admin/settings/attributes`} icon={<IconSliders size={20} />} title="Характеристики" subtitle="Объём, крепость, цвет… и фильтры" />
                                <MenuRow to={`${base}/admin/settings/tiers`} icon={<IconLayers size={20} />} title="Уровни цен" subtitle="«от 1 шт», «от 10 шт»…" />
                                <MenuRow to={`${base}/admin/settings/brands`} icon={<IconTag size={20} />} title="Бренды" />
                            </div>
                            <h2 className="section-title">Витрина</h2>
                            <div className="menu-list">
                                <MenuRow
                                    to={`${base}/admin/settings/store`}
                                    icon={<IconPalette size={20} />}
                                    title="Оформление и доступ"
                                    subtitle={`${me.tenant.access_mode === "approval" ? "По одобрению" : "Открытый доступ"}${me.tenant.age_gate ? " · 18+" : ""}`}
                                />
                                <MenuRow to={`${base}/admin/settings/audit`} icon={<IconClock size={20} />} title="Журнал изменений" />
                            </div>
                        </>
                    ) : (
                        <p className="muted">Справочники и настройки витрины меняют владелец и администраторы.</p>
                    )}

                    <div className="menu-list">
                        <MenuRow
                            icon={<IconEye size={20} />}
                            title="Открыть витрину"
                            subtitle="Каталог глазами клиента"
                            onClick={() => {
                                setStaffMode(slug, "catalog");
                                navigate(`${base}/catalog`);
                            }}
                        />
                    </div>
                </div>
            </div>
            <AdminTabs />
        </div>
    );
}
