const API_URL = (
    process.env.NODE_ENV === "development"
        ? (
            process.env.NEXT_PUBLIC_LOCAL_API_URL ||
            "http://localhost:4000"
        )
        : (
            process.env.NEXT_PUBLIC_API_URL ||
            ""
        )
).replace(/\/+$/, "");

if (!API_URL) {
    throw new Error(
        "Falta configurar la URL del backend"
    );
}

export const API_BASE =
    API_URL.endsWith("/api")
        ? API_URL
        : `${API_URL}/api`;

export function saveToken(token: string) {
    if (typeof window === "undefined") return;

    localStorage.setItem("isp_token", token);
}

export function getToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("isp_token");
}

export function removeToken() {
    if (typeof window === "undefined") return;

    localStorage.removeItem("isp_token");
}