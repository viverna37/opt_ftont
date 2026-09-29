const BASE_URL = (import.meta.env.VITE_API_URL as string).replace(/\/$/, "");

export class ApiError extends Error {
    status: number;
    // Машинный код ошибки бэкенда: pending / age_required / blocked /
    // unavailable_items / below_min_amount ... — по нему экраны решают, что показать
    code: string | null;
    detail: unknown;

    constructor(status: number, detail: unknown, message: string) {
        super(message);
        this.status = status;
        this.detail = detail;
        this.code = isCodeDetail(detail) ? detail.code : null;
    }
}

export type ApiClient = {
    get: <T>(path: string, params?: QueryParams) => Promise<T>;
    getBlob: (path: string, params?: QueryParams) => Promise<Blob>;
    getText: (path: string) => Promise<string>;
    post: <T>(path: string, body?: unknown) => Promise<T>;
    postForm: <T>(path: string, formData: FormData) => Promise<T>;
    put: <T>(path: string, body?: unknown) => Promise<T>;
    patch: <T>(path: string, body?: unknown) => Promise<T>;
    del: <T = void>(path: string) => Promise<T>;
};

export type QueryParams = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

export function fileUrl(path: string | null | undefined): string | null {
    // Бэкенд отдаёт картинки относительным путём /v1/files/... — <img> ходит без заголовков, так можно
    return path ? `${BASE_URL}${path}` : null;
}

export function buildQuery(params?: QueryParams): string {
    if (!params) return "";
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "" || value === false) continue;
        if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
        else search.append(key, String(value));
    }
    const text = search.toString();
    return text ? `?${text}` : "";
}

export function createApiClient(slug: string, initData: string, devUserId: string | null): ApiClient {
    function headers(isFormData: boolean): Record<string, string> {
        return {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            "X-Tenant": slug,
            ...(initData ? { "X-Init-Data": initData } : {}),
            ...(devUserId ? { "X-Tg-User-Id": devUserId } : {}),
        };
    }

    async function raw(path: string, init?: RequestInit): Promise<Response> {
        // FormData — без ручного Content-Type, браузер сам ставит boundary
        const isFormData = init?.body instanceof FormData;
        let res: Response;
        try {
            res = await fetch(`${BASE_URL}${path}`, { ...init, headers: { ...headers(isFormData), ...(init?.headers ?? {}) } });
        } catch {
            throw new ApiError(0, null, "Нет соединения с сервером");
        }
        if (!res.ok) {
            const isJson = res.headers.get("content-type")?.includes("application/json") ?? false;
            const data: unknown = isJson ? await res.json() : undefined;
            const detail = isDetailBody(data) ? data.detail : undefined;
            throw new ApiError(res.status, detail, formatDetail(detail) ?? res.statusText);
        }
        return res;
    }

    async function request<T>(path: string, init?: RequestInit): Promise<T> {
        const res = await raw(path, init);
        if (res.status === 204) return undefined as T;
        const isJson = res.headers.get("content-type")?.includes("application/json") ?? false;
        return (isJson ? await res.json() : undefined) as T;
    }

    const json = (body: unknown) => (body !== undefined ? JSON.stringify(body) : undefined);

    return {
        get: (path, params) => request(`${path}${buildQuery(params)}`, { method: "GET" }),
        getBlob: async (path, params) => (await raw(`${path}${buildQuery(params)}`)).blob(),
        getText: async (path) => (await raw(path)).text(),
        post: (path, body) => request(path, { method: "POST", body: json(body) }),
        postForm: (path, formData) => request(path, { method: "POST", body: formData }),
        put: (path, body) => request(path, { method: "PUT", body: json(body) }),
        patch: (path, body) => request(path, { method: "PATCH", body: json(body ?? {}) }),
        del: (path) => request(path, { method: "DELETE" }),
    };
}

export async function fetchPublic<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new ApiError(res.status, null, res.statusText);
    return res.json() as Promise<T>;
}

function isDetailBody(data: unknown): data is { detail: unknown } {
    return typeof data === "object" && data !== null && "detail" in data;
}

function isCodeDetail(detail: unknown): detail is { code: string; message: string } {
    return typeof detail === "object" && detail !== null && "code" in detail;
}

function formatDetail(detail: unknown): string | undefined {
    if (detail == null) return undefined;
    if (typeof detail === "string") return detail;
    if (isCodeDetail(detail)) return detail.message;
    if (Array.isArray(detail)) {
        return detail
            .map((d) => (typeof d === "object" && d !== null && "msg" in d ? String((d as { msg: unknown }).msg) : JSON.stringify(d)))
            .join("; ");
    }
    return "Ошибка запроса";
}

export function errorText(e: unknown, fallback = "Что-то пошло не так"): string {
    return e instanceof Error && e.message ? e.message : fallback;
}
