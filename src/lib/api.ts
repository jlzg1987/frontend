export const API_BASE =
    process.env.NEXT_PUBLIC_API_URL
        ? 'http://localhost:4000/api'
        : `${process.env.NEXT_PUBLIC_API_URL}/api`;

export function saveToken(token: string) {
    localStorage.setItem('isp_token', token);
}

export function getToken() {
    return localStorage.getItem('isp_token');
}

export function removeToken() {
    localStorage.removeItem('isp_token');
}