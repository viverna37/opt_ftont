import { Link } from "react-router-dom";
import type { ProductListItem } from "../../api/types";
import { attrText, money, plural } from "../../format/format";
import { StockTag } from "../Tag/Tag";
import "./product_row.css";

export function productMeta(p: ProductListItem): string {
    const parts = [p.brand, ...p.meta.map(attrText)];
    if (p.variants_count > 1) parts.push(`${p.variants_count} ${plural(p.variants_count, "вариант", "варианта", "вариантов")}`);
    return parts.filter(Boolean).join(" · ");
}

// Плотная строка товара из макетов: название, мета, цена «от», бейдж наличия
export function ProductRow({ product, to }: { product: ProductListItem; to: string }) {
    return (
        <Link to={to} className="product-row">
            <div className="product-row-main">
                <span className="product-row-name">{product.name}</span>
                <span className="product-row-meta">{productMeta(product) || " "}</span>
                {product.in_cart_qty > 0 && <span className="product-row-cart">в корзине: {product.in_cart_qty}</span>}
            </div>
            <div className="product-row-side">
                <span className="product-row-price mono">{product.price_from != null ? `от ${money(product.price_from)}` : "по запросу"}</span>
                <StockTag status={product.stock_status} />
            </div>
        </Link>
    );
}
