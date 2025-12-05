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

export interface NominationPayload {
    nominee: number; // ID of the user being nominated
    reason: string;
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

    getMe: async () => {
        return await api.get('me/');
    },

    getNominationOptions: async (filters?: { search?: string, dept?: string, role?: string }) => {
        // Build query string dynamically
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.dept) params.append('dept', filters.dept);
        if (filters?.role) params.append('role', filters.role);
        
        return await api.get(`nominate/list/?${params.toString()}`);
    },

    // 1. Submit New
    submitNomination: async (data: NominationPayload) => {
        return await api.post('nominate/action/', data);
    },
    
    // 2. Update Existing
    updateNomination: async (data: NominationPayload) => {
        return await api.put('nominate/action/', data);
    },
    
    // 3. Delete Existing
    withdrawNomination: async () => {
        return await api.delete('nominate/action/');
    },

    getNominationStatus: async () => {
        return await api.get('nominate/status/');
    }
};