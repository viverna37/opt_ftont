// Зеркало схем opt_catalog_db_service (app/models/*). Деньги — копейки (int).

export type Role = "owner" | "admin" | "manager" | "client";
export type MemberStatus = "active" | "pending" | "blocked";
export type AccessMode = "open" | "approval";
export type Access = "ok" | "age_required" | "pending" | "blocked";
export type StockStatus = "in_stock" | "low" | "out";
export type OrderStatus = "new" | "in_progress" | "done" | "cancelled";
export type AttributeType = "text" | "number" | "select" | "bool" | "color";
export type AttributeScope = "product" | "variant";
// От чего зависит уровень цены: количество штук товара или сумма всей заявки
export type PriceBasis = "qty" | "amount";

export type Page<T> = { items: T[]; total: number; limit: number; offset: number };

export type TgUser = {
    telegram_id: number;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    photo_url: string | null;
};

export type TenantPublic = {
    slug: string;
    name: string;
    logo_url: string | null;
    accent_color: string;
    currency: string;
    welcome_text: string | null;
    bot_username: string | null;
};

export type Tenant = TenantPublic & {
    manager_username: string | null;
    access_mode: AccessMode;
    age_gate: boolean;
    price_basis: PriceBasis;
    min_order_amount: number | null;
    low_stock_threshold: number;
    catalog_updated_at: string;
};

export type Me = {
    id: number;
    role: Role;
    status: MemberStatus;
    is_staff: boolean;
    is_platform_admin: boolean;
    access: Access;
    age_confirmed_at: string | null;
    user: TgUser;
    tenant: Tenant;
    cart_qty: number;
};

// ---------- Каталог ----------

export type AttributeDefinition = {
    id: number;
    key: string;
    label: string;
    type: AttributeType;
    unit: string | null;
    options: string[] | null;
    scope: AttributeScope;
    filterable: boolean;
    show_in_list: boolean;
    sort_order: number;
};

export type AttributeValue = {
    key: string;
    label: string;
    value: string | number | boolean;
    unit: string | null;
    type: AttributeType;
};

export type CategoryNode = {
    id: number;
    parent_id: number | null;
    name: string;
    image_url: string | null;
    sort_order: number;
    is_visible: boolean;
    product_count: number;
    children: CategoryNode[];
};

export type Brand = { id: number; name: string; sort_order: number };

export type FilterOption = { attribute: AttributeDefinition; values: (string | number | boolean)[] };

export type CategoryDetail = {
    id: number;
    parent_id: number | null;
    name: string;
    breadcrumbs: { id: number; name: string }[];
    children: CategoryNode[];
    attributes: AttributeDefinition[];
    filters: FilterOption[];
    brands: Brand[];
};

export type PriceTier = { id: number; label: string; min_qty: number | null; min_amount: number | null; sort_order: number };

export type TierPrice = { tier_id: number; label: string; min_qty: number | null; min_amount: number | null; amount: number | null };

export type ProductListItem = {
    id: number;
    name: string;
    brand: string | null;
    category_id: number | null;
    sku: string | null;
    cover_url: string | null;
    meta: AttributeValue[];
    price_from: number | null;
    stock_status: StockStatus;
    variants_count: number;
    in_cart_qty: number;
};

export type VariantCard = {
    id: number;
    name: string | null;
    sku: string | null;
    is_default: boolean;
    attributes: AttributeValue[];
    stock_status: StockStatus;
    stock_qty: number | null;
    prices: TierPrice[];
    in_cart_qty: number;
};

export type ProductCard = {
    id: number;
    name: string;
    brand: string | null;
    category_id: number | null;
    sku: string | null;
    description: string | null;
    photos: string[];
    attributes: AttributeValue[];
    tiers: TierPrice[];
    current_tier_id: number | null;
    next_tier: TierPrice | null;
    qty_to_next_tier: number | null;
    in_cart_qty: number;
    variants: VariantCard[];
    has_variants: boolean;
    ask_manager_url: string | null;
    updated_at: string;
};

// ---------- Корзина и заявки ----------

export type CartBlocker = "empty" | "unavailable_items" | "no_price_items" | "below_min_amount";

export type CartLine = {
    variant_id: number;
    variant_name: string | null;
    sku: string | null;
    qty: number;
    unit_price: number | null;
    amount: number | null;
    stock_status: StockStatus;
    stock_qty: number | null;
    problem: "unavailable" | "no_price" | null;
};

export type CartGroup = {
    product_id: number;
    product_name: string;
    cover_url: string | null;
    total_qty: number;
    tier: TierPrice | null;
    next_tier: TierPrice | null;
    qty_to_next_tier: number | null;
    subtotal: number;
    lines: CartLine[];
};

export type Cart = {
    price_basis: PriceBasis;
    // режим amount: уровень общий на заявку
    tier: TierPrice | null;
    next_tier: TierPrice | null;
    amount_to_next_tier: number | null;
    groups: CartGroup[];
    total: number;
    total_qty: number;
    positions: number;
    min_order_amount: number | null;
    can_submit: boolean;
    blockers: CartBlocker[];
    updated_at: string | null;
};

export type OrderItem = {
    id: number;
    product_id: number | null;
    variant_id: number | null;
    product_name: string;
    variant_name: string | null;
    sku: string | null;
    qty: number;
    price: number;
    tier_label: string | null;
    amount: number;
};

export type Order = {
    id: number;
    number: number;
    status: OrderStatus;
    comment: string | null;
    total: number;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
};

export type OrderClient = {
    tenant_user_id: number;
    role: Role;
    status: MemberStatus;
    note: string | null;
    user: TgUser;
    contact_url: string;
};

export type AdminOrder = Order & {
    manager_note: string | null;
    client: OrderClient;
    history: { from_status: OrderStatus | null; to_status: OrderStatus; tenant_user_id: number | null; created_at: string }[];
};

// ---------- Админка ----------

export type AdminSummary = {
    products_total: number;
    new_orders: number;
    in_progress_orders: number;
    live_carts: number;
    out_of_stock_products: number;
    pending_clients: number;
};

export type LiveCart = {
    cart_id: number;
    client: OrderClient;
    positions: number;
    total_qty: number;
    total: number;
    updated_at: string;
    reminded_at: string | null;
    can_remind: boolean;
};

export type LiveCartDetail = LiveCart & { cart: Cart };

export type Client = {
    tenant_user_id: number;
    role: Role;
    status: MemberStatus;
    note: string | null;
    user: TgUser;
    contact_url: string;
    first_seen: string;
    last_seen: string;
    age_confirmed_at: string | null;
    orders_count: number;
};

export type AdminProductListItem = ProductListItem & { is_visible: boolean };

export type AdminVariant = {
    id: number;
    name: string | null;
    sku: string | null;
    attributes: Record<string, string | number | boolean>;
    stock_qty: number | null;
    stock_status: StockStatus;
    is_default: boolean;
    is_visible: boolean;
    sort_order: number;
};

export type PriceRow = { tier_id: number; variant_id?: number | null; amount: number };

export type AdminProduct = {
    id: number;
    name: string;
    category_id: number | null;
    brand_id: number | null;
    sku: string | null;
    description: string | null;
    attributes: Record<string, string | number | boolean>;
    is_visible: boolean;
    sort_order: number;
    photos: { id: number; url: string }[];
    variants: AdminVariant[];
    prices: PriceRow[];
    created_at: string;
    updated_at: string;
};

export type TenantSettings = {
    slug: string;
    name: string;
    logo_url: string | null;
    accent_color: string;
    currency: string;
    timezone: string;
    manager_username: string | null;
    low_stock_threshold: number;
    access_mode: AccessMode;
    age_gate: boolean;
    price_basis: PriceBasis;
    min_order_amount: number | null;
    welcome_text: string | null;
    bot_username: string | null;
    bot_configured: boolean;
};

export type AuditEntry = {
    id: number;
    tenant_user_id: number | null;
    action: string;
    entity: string;
    entity_id: number | null;
    data: Record<string, unknown> | null;
    created_at: string;
};

// ---------- Платформа ----------

export type PlatformTenant = {
    id: number;
    slug: string;
    name: string;
    is_active: boolean;
    bot_username: string | null;
    bot_configured: boolean;
    owner: TgUser | null;
    products_count: number;
    clients_count: number;
    orders_count: number;
    last_order_at: string | null;
    created_at: string;
    catalog_url: string | null;
    bot_url: string | null;
    warnings?: string[];
};

export type PlatformMe = { telegram_id: number; webapp_configured: boolean; platform_bot_configured: boolean };
