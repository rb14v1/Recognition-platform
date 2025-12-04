import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api/auth';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

interface DecodedToken {
    user_id: number;
    username: string;
    role?: string;
    exp: number;
}

interface User {
    user_id: number;
    username: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>; // Added Register
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean; // Added global loading state
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Helper to fetch user data from Backend
    const fetchUser = async () => {
        try {
            const res = await authAPI.getMe();
            setUser(res.data); // This sets the REAL DB data
        } catch (error) {
            console.error("Failed to fetch user", error);
            logout(); // Token is likely invalid
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    // 1. Set basic info from token immediately (fast UI)
                    setUser({
                        user_id: decoded.user_id,
                        username: decoded.username,
                        role: decoded.role
                    });
                    // 2. Then fetch full details from DB (accurate UI)
                    fetchUser();
                }
            } catch (e) {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (formData: any) => {
        const res = await authAPI.login(formData);
        const { access, refresh } = res.data;

        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);

        // Fetch real user details immediately after login
        await fetchUser();

        navigate('/dashboard');
    };
    const register = async (formData: any) => {
        // Just pass through to API, let component handle redirect/toast on success
        await authAPI.register(formData);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext)!;