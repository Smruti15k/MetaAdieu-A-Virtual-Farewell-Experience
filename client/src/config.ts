export const API_base_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? '/' : 'http://localhost:5000');
