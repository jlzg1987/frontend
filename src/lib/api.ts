

const API_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000'
    : 'process.env.NEXT_PUBLIC_API_URL';

export const API_BASE = `${API_URL}/api`;
export function saveToken(token: string) {
    localStorage.setItem('isp_token', token);
}

export function getToken() {
    return localStorage.getItem('isp_token');
}

export function removeToken() {
    localStorage.removeItem('isp_token');
}