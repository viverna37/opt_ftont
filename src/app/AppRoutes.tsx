import { Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./Landing";
import { TenantRoot } from "./TenantRoot";
import { ClientLayout } from "./ClientLayout";
import { AdminLayout } from "./AdminLayout";
import { StartRedirect } from "./StartRedirect";
import { CatalogHome } from "../screens/CatalogHome/CatalogHome";
import { ProductList } from "../screens/ProductList/ProductList";
import { Product } from "../screens/Product/Product";
import { CartScreen } from "../screens/Cart/Cart";
import { OrderSent } from "../screens/OrderSent/OrderSent";
import { MyOrders } from "../screens/MyOrders/MyOrders";
import { MyOrderDetail } from "../screens/MyOrders/MyOrderDetail";
import { AdminOrders } from "../screens/AdminOrders/AdminOrders";
import { AdminOrderDetail } from "../screens/AdminOrders/AdminOrderDetail";
import { AdminCartDetail } from "../screens/AdminOrders/AdminCartDetail";
import { AdminProducts } from "../screens/AdminProducts/AdminProducts";
import { AdminProductEdit } from "../screens/AdminProductEdit/AdminProductEdit";
import { AdminClients } from "../screens/AdminClients/AdminClients";
import { AdminSettings } from "../screens/AdminSettings/AdminSettings";
import { StoreSettings } from "../screens/AdminSettings/StoreSettings";
import { CategoriesSettings } from "../screens/AdminSettings/CategoriesSettings";
import { AttributesSettings } from "../screens/AdminSettings/AttributesSettings";
import { TiersSettings } from "../screens/AdminSettings/TiersSettings";
import { BrandsSettings } from "../screens/AdminSettings/BrandsSettings";
import { AuditLog } from "../screens/AdminSettings/AuditLog";
import { PlatformRoot } from "../screens/Platform/PlatformRoot";
import { PlatformTenants } from "../screens/Platform/PlatformTenants";
import { PlatformTenantNew } from "../screens/Platform/PlatformTenantNew";
import { PlatformTenant } from "../screens/Platform/PlatformTenant";

// Мини-апп открывается ботом оптовика по /t/{slug} — всё внутри тенанта.
// Пути /t/{slug}/cart, /orders, /admin/orders/{id} — те же, что бэкенд
// кладёт в кнопки «Открыть» под уведомлениями (app/services/notify.py).
export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/t/:slug" element={<TenantRoot />}>
                <Route element={<ClientLayout />}>
                    <Route index element={<StartRedirect />} />
                    <Route path="catalog" element={<CatalogHome />} />
                    <Route path="catalog/c/:categoryId" element={<ProductList />} />
                    <Route path="catalog/search" element={<ProductList />} />
                    <Route path="catalog/p/:productId" element={<Product />} />
                    <Route path="cart" element={<CartScreen />} />
                    <Route path="cart/sent/:orderId" element={<OrderSent />} />
                    <Route path="orders" element={<MyOrders />} />
                    <Route path="orders/:orderId" element={<MyOrderDetail />} />
                </Route>
                <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="orders" replace />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                    <Route path="carts/:cartId" element={<AdminCartDetail />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductEdit />} />
                    <Route path="products/:productId" element={<AdminProductEdit />} />
                    <Route path="clients" element={<AdminClients />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="settings/store" element={<StoreSettings />} />
                    <Route path="settings/categories" element={<CategoriesSettings />} />
                    <Route path="settings/attributes" element={<AttributesSettings />} />
                    <Route path="settings/tiers" element={<TiersSettings />} />
                    <Route path="settings/brands" element={<BrandsSettings />} />
                    <Route path="settings/audit" element={<AuditLog />} />
                </Route>
            </Route>
            {/* Раздел владельца платформы — вне тенантов (PLATFORM_ADMIN_IDS на бэкенде) */}
            <Route path="/platform" element={<PlatformRoot />}>
                <Route index element={<PlatformTenants />} />
                <Route path="new" element={<PlatformTenantNew />} />
                <Route path="t/:slug" element={<PlatformTenant />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
