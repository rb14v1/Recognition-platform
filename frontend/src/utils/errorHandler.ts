import { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError && error.response) {
        // Django usually returns { detail: "..." } or { field: ["error"] }
        const data = error.response.data;
        
        if (data.detail) return data.detail;
        
        // If it's an object with field errors (e.g. { username: ["Exists"] })
        if (typeof data === 'object') {
            const firstValue = Object.values(data)[0];
            if (Array.isArray(firstValue)) return String(firstValue[0]);
            return String(firstValue);
        }
    }
    return (error as Error).message || "An unexpected error occurred.";
};