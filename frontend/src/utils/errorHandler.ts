import { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError && error.response) {
        const data = error.response.data;
        if (data.detail) return data.detail;
        if (typeof data === 'object') {
            const firstValue = Object.values(data)[0];
            if (Array.isArray(firstValue)) return String(firstValue[0]);
            return String(firstValue);
        }
    }
    return (error as Error).message || "An unexpected error occurred.";
};