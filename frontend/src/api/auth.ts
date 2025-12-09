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

const buildQueryParams = (params: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
    });
    return query.toString();
};

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
    getPromotableUsers: async (search: string = "") => {
        return await api.get(`coordinator/promote-list/?search=${search}`);
    },
 
    getMe: async () => {
        return await api.get('me/');
    },

    updateProfile: async (data: { location?: string }) => {
        // We use PATCH because we are only updating one field
        return await api.patch('me/', data);
    },
 
    getNominationOptions: async (filters?: { search?: string, dept?: string, role?: string, location?: string }) => {
        const queryString = buildQueryParams({
            search: filters?.search,
            dept: filters?.dept,
            role: filters?.role,
            location: filters?.location
        });
        
        return await api.get(`nominate/list/?${queryString}`);
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
    },
    getMyTeam: async () => {
        return await api.get('coordinator/team/');
    },
   
    // Search unassigned employees to add to team
    searchUnassigned: async (query: string, filters?: { dept?: string, role?: string, location?: string }) => {
        const queryString = buildQueryParams({
            search: query,
            dept: filters?.dept,
            role: filters?.role,
            location: filters?.location
        });

        return await api.get(`coordinator/team/add/?${queryString}`);
    },
 
    // Link selected employees to the current coordinator
    linkEmployeesToTeam: async (userIds: number[]) => {
        return await api.post('coordinator/team/add/', { user_ids: userIds });
    },
 
    // Update member details or promote
    updateTeamMember: async (id: number, data: any) => {
        return await api.put(`coordinator/team/${id}/`, data);
    },
   
    // Approvals
    getPendingNominations: async () => {
        return await api.get('coordinator/nominations/');
    },
   
    reviewNomination: async (data: { nomination_id: number, action: 'APPROVE' | 'REJECT' }) => {
        return await api.post('coordinator/nominations/', data);
    },
    getCoordinatorNominations: async (filter: 'pending' | 'history' = 'pending') => {
        return await api.get(`coordinator/nominations/?filter=${filter}`);
    },
    getVotingOptions: async () => {
        return await api.get('voting/finalists/');
    },
    castVote: async (nomination_id: number) => {
        return await api.post('voting/finalists/', { nomination_id });
    },
   
    // Admin Only
    getVoteResults: async () => {
        return await api.get('admin/results/');
    }
};
 