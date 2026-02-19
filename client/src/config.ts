const isProduction = import.meta.env.PROD;

export const API_base_URL = isProduction ? '' : 'http://localhost:5000';
export const SOCKET_URL = isProduction ? '/' : 'http://localhost:5000';
