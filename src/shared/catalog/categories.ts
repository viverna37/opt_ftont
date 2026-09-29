import type { CategoryNode } from "../api/types";

// Дерево категорий -> плоский список с отступом для <select>
export function flattenCategories(nodes: CategoryNode[], depth = 0): { id: number; name: string; depth: number; node: CategoryNode }[] {
    return nodes.flatMap((n) => [{ id: n.id, name: n.name, depth, node: n }, ...flattenCategories(n.children, depth + 1)]);
}

export function categoryOptionLabel(name: string, depth: number) {
    return `${"\u00a0\u00a0\u00a0".repeat(depth)}${depth ? "— " : ""}${name}`;
}
