import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api/auth';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import type{ User} from '../types'; // Import the updated type

interface AuthContextType {
    user: User | null;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUser = async () => {
        try {
            const res = await authAPI.getMe();
            // Ensure we merge existing structure if needed, but res.data should be the source of truth
            setUser(res.data); 
        } catch (error) {
            console.error("Failed to fetch user", error);
            logout();
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
                    // 1. Initial hydration from token (fast)
                    setUser({
                        user_id: decoded.user_id,
                        username: decoded.username,
                        email: "", // Token doesn't have email usually
                        role: decoded.role,
                        employee_id: "Loading..." 
                    });
                    // 2. Fetch full details (slow but accurate)
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
        await fetchUser();
        navigate('/dashboard');
    };

    const register = async (formData: any) => {
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