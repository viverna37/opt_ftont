import { Link, useNavigate } from "react-router-dom";
import { getCategories, listProducts } from "../../shared/api/endpoints";
import { useSession } from "../../shared/session/SessionProvider";
import { useLoad } from "../../shared/hooks/useLoad";
import { isToday, positions, shortDate } from "../../shared/format/format";
import { Logo } from "../../shared/ui/Logo/Logo";
import { IconButton } from "../../shared/ui/Button/Button";
import { IconChat, IconSearch, IconSettings, IconGrid, IconStore } from "../../shared/ui/icons/Icon";
import { ProductRow } from "../../shared/ui/ProductRow/ProductRow";
import { ListSkeleton } from "../../shared/ui/Spinner/Spinner";
import { Banner } from "../../shared/ui/Banner/Banner";
import { Empty } from "../../shared/ui/Empty/Empty";
import { ClientTabs } from "../../shared/ui/Tabs/Tabs";
import { openLink } from "../../shared/platform/telegram";
import { setStaffMode } from "../../shared/local/storage";
import { PLATFORM_FROM_KEY } from "../Platform/PlatformRoot";
import "./catalog_home.css";

export function CatalogHome() {
    const { api, me, base, slug } = useSession();
    const navigate = useNavigate();
    const { tenant } = me;
    const categories = useLoad(() => getCategories(api), [api]);
    const fresh = useLoad(() => listProducts(api, { sort: "new", limit: 5 }), [api]);

    const total = (categories.data ?? []).reduce((sum, c) => sum + c.product_count, 0);
    const updated = isToday(tenant.catalog_updated_at) ? "сегодня" : shortDate(tenant.catalog_updated_at);

    return (
        <div className="screen">
            <div className="screen-scroll with-tabbar">
                <header className="home-head">
                    <Logo name={tenant.name} url={tenant.logo_url} />
                    <div className="home-head-text">
                        <span className="home-title">{tenant.name}</span>
                        <span className="muted">
                            Прайс от {shortDate(tenant.catalog_updated_at)}
                            {categories.data ? ` · ${positions(total)}` : ""}
                        </span>
                    </div>
                    {me.is_platform_admin && !me.is_staff && (
                        <IconButton
                            label="Платформа"
                            onClick={() => {
                                window.sessionStorage.setItem(PLATFORM_FROM_KEY, slug);
                                navigate("/platform");
                            }}
                        >
                            <IconStore size={20} />
                        </IconButton>
                    )}
                    {me.is_staff && (
                        <IconButton
                            label="Админка"
                            onClick={() => {
                                setStaffMode(slug, "admin");
                                navigate(`${base}/admin/orders`);
                            }}
                        >
                            <IconSettings size={20} />
                        </IconButton>
                    )}
                    {tenant.manager_username && (
                        <IconButton label="Написать менеджеру" onClick={() => openLink(`https://t.me/${tenant.manager_username}`)}>
                            <IconChat size={20} />
                        </IconButton>
                    )}
                </header>

                <div className="home-search-wrap">
                    <button type="button" className="home-search" onClick={() => navigate(`${base}/catalog/search`)}>
                        <IconSearch size={18} strokeWidth={2} />
                        <span>Бренд, вкус, артикул</span>
                    </button>
                </div>

                <div className="screen-pad home-body">
                    {tenant.welcome_text && total === 0 && !categories.loading && <Banner>{tenant.welcome_text}</Banner>}

                    <h2 className="section-title">Категории</h2>
                    {categories.error && <Banner tone="danger">{categories.error}</Banner>}
                    <div className="home-cats">
                        {categories.loading && !categories.data
                            ? Array.from({ length: 6 }, (_, i) => <span key={i} className="skeleton home-cat-skeleton" />)
                            : categories.data?.map((c) => (
                                  <Link key={c.id} to={`${base}/catalog/c/${c.id}`} className="home-cat">
                                      <span className="home-cat-name">{c.name}</span>
                                      <span className="muted">{positions(c.product_count)}</span>
                                  </Link>
                              ))}
                    </div>
                    {categories.data?.length === 0 && (
                        <Empty icon={<IconGrid size={32} />} title="Каталог пока пуст">
                            Оптовик ещё не добавил товары. Загляните позже.
                        </Empty>
                    )}

                    {(fresh.data?.items.length ?? 0) > 0 && (
                        <>
                            <div className="section-head home-fresh-head">
                                <h2 className="section-title">Обновлено {updated}</h2>
                                <Link to={`${base}/catalog/search?sort=new`} className="link-btn">
                                    Все
                                </Link>
                            </div>
                            <div className="row-list">
                                {fresh.data!.items.map((p) => (
                                    <ProductRow key={p.id} product={p} to={`${base}/catalog/p/${p.id}`} />
                                ))}
                            </div>
                        </>
                    )}
                    {fresh.loading && !fresh.data && <ListSkeleton rows={3} />}
                </div>
            </div>
            <ClientTabs />
        </div>
    );
}
