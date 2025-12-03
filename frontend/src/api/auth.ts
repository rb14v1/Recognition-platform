import api from './axiosInstance';
// FIX: Added 'type' keyword
import type { LoginResponse } from '../types'; 

interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    employee_id: string; 
}

interface LoginPayload {
    username: string; 
    password: string;
}

interface PromotePayload {
    user_id_to_promote: number;
    new_role: string;
}

export const authAPI = {
    register: async (data: RegisterPayload) => {
        return await api.post('register/', data);
    },
    login: async (data: LoginPayload) => {
        return await api.post<LoginResponse>('login/', data);
    },
    promote: async (data: PromotePayload) => {
        return await api.post('promote/', data);
    },
};