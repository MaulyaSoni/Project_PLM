const defaultApiUrl = 'http://localhost:5000/api';

const removeTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = removeTrailingSlashes(import.meta.env.VITE_API_URL || defaultApiUrl);
