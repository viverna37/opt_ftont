// Все вызовы API в одном месте — экраны не собирают пути руками.
import type { ApiClient, QueryParams } from "./client";
import type {
    AdminOrder,
    AdminProduct,
    AdminProductListItem,
    AdminSummary,
    AttributeDefinition,
    AuditEntry,
    Brand,
    Cart,
    CategoryDetail,
    CategoryNode,
    Client,
    LiveCart,
    LiveCartDetail,
    Me,
    Order,
    OrderStatus,
    Page,
    PriceRow,
    PlatformMe,
    PlatformTenant,
    PriceTier,
    ProductCard,
    ProductListItem,
    StockStatus,
    TenantSettings,
} from "./types";

// ---------- Клиент ----------

export const getMe = (api: ApiClient) => api.get<Me>("/v1/me");
export const confirmAge = (api: ApiClient) => api.post<Me>("/v1/me/age-confirm");

export const getCategories = (api: ApiClient) => api.get<CategoryNode[]>("/v1/catalog/categories");
export const getCategory = (api: ApiClient, id: number) => api.get<CategoryDetail>(`/v1/catalog/categories/${id}`);
export const listProducts = (api: ApiClient, params: QueryParams) =>
    api.get<Page<ProductListItem>>("/v1/catalog/products", params);
export const getProduct = (api: ApiClient, id: number) => api.get<ProductCard>(`/v1/catalog/products/${id}`);

export const getCart = (api: ApiClient) => api.get<Cart>("/v1/cart");
export const setCartQty = (api: ApiClient, variantId: number, qty: number) =>
    api.put<Cart>(`/v1/cart/items/${variantId}`, { qty });
export const clearCart = (api: ApiClient) => api.del<Cart>("/v1/cart");
export const submitCart = (api: ApiClient, comment: string) => api.post<Order>("/v1/cart/submit", { comment });

export const listMyOrders = (api: ApiClient, params: QueryParams) => api.get<Page<Order>>("/v1/orders", params);
export const getMyOrder = (api: ApiClient, id: number) => api.get<Order>(`/v1/orders/${id}`);
export const repeatOrder = (api: ApiClient, id: number) =>
    api.post<{ added: number; skipped: string[] }>(`/v1/orders/${id}/repeat`);

// ---------- Админка: заявки и корзины ----------

export const getSummary = (api: ApiClient) => api.get<AdminSummary>("/v1/admin/summary");
export const listOrders = (api: ApiClient, params: QueryParams) => api.get<Page<AdminOrder>>("/v1/admin/orders", params);
export const getOrder = (api: ApiClient, id: number) => api.get<AdminOrder>(`/v1/admin/orders/${id}`);
export const setOrderStatus = (api: ApiClient, id: number, status: OrderStatus) =>
    api.patch<AdminOrder>(`/v1/admin/orders/${id}/status`, { status });
export const setOrderNote = (api: ApiClient, id: number, manager_note: string) =>
    api.patch<AdminOrder>(`/v1/admin/orders/${id}/note`, { manager_note });
export const getOrderText = (api: ApiClient, id: number) => api.getText(`/v1/admin/orders/${id}/text`);
export const getOrderXlsx = (api: ApiClient, id: number) => api.getBlob(`/v1/admin/orders/${id}/export.xlsx`);
export const getOrdersXlsx = (api: ApiClient, params: QueryParams) => api.getBlob("/v1/admin/orders/export.xlsx", params);

export const listLiveCarts = (api: ApiClient) => api.get<LiveCart[]>("/v1/admin/carts");
export const getLiveCart = (api: ApiClient, id: number) => api.get<LiveCartDetail>(`/v1/admin/carts/${id}`);
export const remindCart = (api: ApiClient, id: number) => api.post<LiveCart>(`/v1/admin/carts/${id}/remind`);

// ---------- Админка: клиенты ----------

export const listClients = (api: ApiClient, params: QueryParams) => api.get<Page<Client>>("/v1/admin/clients", params);
export const updateClient = (api: ApiClient, id: number, body: Partial<Pick<Client, "note" | "status" | "role">>) =>
    api.patch<Client>(`/v1/admin/clients/${id}`, body);

// ---------- Админка: товары ----------

export const adminListProducts = (api: ApiClient, params: QueryParams) =>
    api.get<Page<AdminProductListItem>>("/v1/admin/products", params);
export const adminGetProduct = (api: ApiClient, id: number) => api.get<AdminProduct>(`/v1/admin/products/${id}`);
export type ProductFields = {
    name: string;
    category_id: number | null;
    brand_id: number | null;
    sku: string | null;
    description: string | null;
    attributes: Record<string, unknown>;
    is_visible: boolean;
};
export const adminCreateProduct = (api: ApiClient, body: ProductFields) => api.post<AdminProduct>("/v1/admin/products", body);
export const adminUpdateProduct = (api: ApiClient, id: number, body: Partial<ProductFields>) =>
    api.patch<AdminProduct>(`/v1/admin/products/${id}`, body);
export const adminDeleteProduct = (api: ApiClient, id: number) => api.del(`/v1/admin/products/${id}`);
export const adminSetProductStock = (api: ApiClient, id: number, stock_status: StockStatus) =>
    api.post<AdminProduct>(`/v1/admin/products/${id}/stock`, { stock_status });
export const adminReplacePrices = (api: ApiClient, id: number, prices: PriceRow[]) =>
    api.put<AdminProduct>(`/v1/admin/products/${id}/prices`, { prices });
export type VariantFields = {
    name: string;
    sku: string | null;
    attributes: Record<string, unknown>;
    stock_qty: number | null;
    stock_status: StockStatus;
    is_visible: boolean;
};
export const adminCreateVariant = (api: ApiClient, productId: number, body: Partial<VariantFields>) =>
    api.post<AdminProduct>(`/v1/admin/products/${productId}/variants`, body);
export const adminUpdateVariant = (api: ApiClient, productId: number, variantId: number, body: Partial<VariantFields>) =>
    api.patch<AdminProduct>(`/v1/admin/products/${productId}/variants/${variantId}`, body);
export const adminDeleteVariant = (api: ApiClient, productId: number, variantId: number) =>
    api.del<AdminProduct>(`/v1/admin/products/${productId}/variants/${variantId}`);
export const adminUploadPhoto = (api: ApiClient, productId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.postForm<AdminProduct>(`/v1/admin/products/${productId}/photos`, form);
};
export const adminDeletePhoto = (api: ApiClient, productId: number, photoId: number) =>
    api.del<AdminProduct>(`/v1/admin/products/${productId}/photos/${photoId}`);
export const adminReorderPhotos = (api: ApiClient, productId: number, ids: number[]) =>
    api.put<AdminProduct>(`/v1/admin/products/${productId}/photos/order`, ids);

// ---------- Админка: справочники и настройки ----------

export const adminCategories = (api: ApiClient) => api.get<CategoryNode[]>("/v1/admin/categories");
export const adminCategoryAttributes = (api: ApiClient, id: number, inherited = false) =>
    api.get<number[]>(`/v1/admin/categories/${id}/attributes`, { inherited });
export const adminSetCategoryAttributes = (api: ApiClient, id: number, attribute_ids: number[]) =>
    api.put<number[]>(`/v1/admin/categories/${id}/attributes`, { attribute_ids });
export type CategoryFields = { name: string; parent_id: number | null; sort_order: number; is_visible: boolean };
export const adminCreateCategory = (api: ApiClient, body: CategoryFields) => api.post<CategoryNode>("/v1/admin/categories", body);
export const adminUpdateCategory = (api: ApiClient, id: number, body: Partial<CategoryFields>) =>
    api.patch<CategoryNode>(`/v1/admin/categories/${id}`, body);
export const adminDeleteCategory = (api: ApiClient, id: number) => api.del(`/v1/admin/categories/${id}`);

export const adminAttributes = (api: ApiClient) => api.get<AttributeDefinition[]>("/v1/admin/attributes");
export const adminCreateAttribute = (api: ApiClient, body: Omit<AttributeDefinition, "id">) =>
    api.post<AttributeDefinition>("/v1/admin/attributes", body);
export const adminUpdateAttribute = (api: ApiClient, id: number, body: Partial<AttributeDefinition>) =>
    api.patch<AttributeDefinition>(`/v1/admin/attributes/${id}`, body);
export const adminDeleteAttribute = (api: ApiClient, id: number) => api.del(`/v1/admin/attributes/${id}`);

export const adminBrands = (api: ApiClient) => api.get<Brand[]>("/v1/admin/brands");
export const adminCreateBrand = (api: ApiClient, body: { name: string; sort_order: number }) =>
    api.post<Brand>("/v1/admin/brands", body);
export const adminUpdateBrand = (api: ApiClient, id: number, body: { name: string; sort_order: number }) =>
    api.patch<Brand>(`/v1/admin/brands/${id}`, body);
export const adminDeleteBrand = (api: ApiClient, id: number) => api.del(`/v1/admin/brands/${id}`);

export const adminTiers = (api: ApiClient) => api.get<PriceTier[]>("/v1/admin/price-tiers");
export const adminCreateTier = (api: ApiClient, body: { label: string; min_qty: number; sort_order: number }) =>
    api.post<PriceTier>("/v1/admin/price-tiers", body);
export const adminUpdateTier = (api: ApiClient, id: number, body: Partial<{ label: string; min_qty: number }>) =>
    api.patch<PriceTier>(`/v1/admin/price-tiers/${id}`, body);
export const adminDeleteTier = (api: ApiClient, id: number) => api.del(`/v1/admin/price-tiers/${id}`);

export const adminSettings = (api: ApiClient) => api.get<TenantSettings>("/v1/admin/settings");
export const adminUpdateSettings = (api: ApiClient, body: Partial<TenantSettings>) =>
    api.patch<TenantSettings>("/v1/admin/settings", body);
export const adminUploadLogo = (api: ApiClient, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.postForm<TenantSettings>("/v1/admin/settings/logo", form);
};
export const adminAudit = (api: ApiClient, params: QueryParams) => api.get<AuditEntry[]>("/v1/admin/audit", params);

// ---------- Платформа (владелец сервиса) ----------

export const platformMe = (api: ApiClient) => api.get<PlatformMe>("/v1/platform/me");
export const platformTenants = (api: ApiClient) => api.get<PlatformTenant[]>("/v1/platform/tenants");
export const platformTenant = (api: ApiClient, slug: string) => api.get<PlatformTenant>(`/v1/platform/tenants/${slug}`);
export type PlatformTenantFields = { slug: string; name: string; bot_token?: string | null; owner_telegram_id?: number | null };
export const platformCreateTenant = (api: ApiClient, body: PlatformTenantFields) =>
    api.post<PlatformTenant>("/v1/platform/tenants", body);
export const platformUpdateTenant = (
    api: ApiClient,
    slug: string,
    body: Partial<{ name: string; is_active: boolean; bot_token: string; owner_telegram_id: number }>,
) => api.patch<PlatformTenant>(`/v1/platform/tenants/${slug}`, body);
