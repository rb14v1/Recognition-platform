import api from "./axiosInstance";
import type { LoginResponse } from "../types";

/* ================================
   INTERFACES
================================ */
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
    nominee: number;
    reason: string;
    selected_metrics: { category: string; metric: string }[];
}

/* ================================
   HELPERS
================================ */
const buildQueryParams = (params: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
    });
    return query.toString();
};

/* ================================
   API METHODS
================================ */
export const authAPI = {
    // AUTH
    register: (data: RegisterPayload) => api.post("/register/", data),

    login: async (data: LoginPayload) => {
        const res = await api.post<LoginResponse>("/login/", data);

        // STORE TOKENS (used by axiosInstance)
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);

        return res;
    },

    // USER
    getMe: () => api.get("/me/"),
    updateProfile: (data: { location?: string }) => api.patch("/me/", data),

    // PROMOTION
    promote: (data: PromotePayload) => api.post("/promote/", data),
    getPromotableUsers: (search = "") =>
        api.get(`/coordinator/promote-list/?search=${search}`),

    // NOMINATIONS
    getNominationOptions: (filters?: {
        page?: number;       // 🔥 Added page
        search?: string;
        dept?: string;
        role?: string;
        location?: string;
    }) => {
        // Automatically builds ?page=1&search=...&dept=...
        const queryString = buildQueryParams({
            ...filters,
            page: filters?.page?.toString() || "1"
        });
        return api.get(`/nominate/list/?${queryString}`);
    },

    getNominationFilterOptions: () => api.get("/nominate/filter-options/"),
    getNominationCriteria: () => api.get("/nominate/options-data/"),

    submitNomination: (data: NominationPayload) =>
        api.post("/nominate/action/", data),

    updateNomination: (data: NominationPayload) =>
        api.put("/nominate/action/", data),

    withdrawNomination: () => api.delete("/nominate/action/"),
    getNominationStatus: () => api.get("/nominate/status/"),

    // NOTIFICATIONS
    getNotifications: () => api.get("/notifications/"),
    markNotificationRead: (id: number) =>
        api.post(`/notifications/${id}/read/`),

    // TEAM
    // APPROVALS
    getCoordinatorNominations: (
        filter: "pending" | "history" = "pending"
    ) => api.get(`/coordinator/nominations/?filter=${filter}`),

    reviewNomination: (data: {
        nomination_id: number;
        action: "APPROVE" | "REJECT" | "UNDO";
    }) => api.post("/coordinator/nominations/", data),

    // VOTING
    getVotingOptions: () => api.get("/voting/finalists/"),
    castVote: (nomination_id: number) =>
        api.post("/voting/finalists/", { nomination_id }),

    // RESULTS
    getVoteResults: () => api.get("/admin/results/"),

    // TIMELINE
    getTimeline: () => api.get("/admin/timeline/"),
    setTimeline: (data: any) => api.post("/admin/timeline/", data),
    getAllWinners: () => api.get("/admin/winners/"),
    // ✅ ANALYTICS (DASHBOARD)
    getAdminAnalytics: () => api.get("/admin/analytics/"),

    // ✅ REPORT EXPORT (FIXED)
    getAdminReport: () =>
        api.get("/admin/report/", { responseType: "blob" }),


};
