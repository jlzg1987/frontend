


export function getToken() {
    if (typeof window === 'undefined') return '';

    return localStorage.getItem('isp_token') || '';
}

export function authHeaders() {
    const token = getToken();

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}