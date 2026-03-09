import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, restore session from localStorage
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 > Date.now()) {
                    authService.getMe()
                        .then(({ data }) => setUser(data))
                        .catch(() => { localStorage.clear(); setUser(null); })
                        .finally(() => setLoading(false));
                } else {
                    localStorage.clear();
                    setLoading(false);
                }
            } catch {
                localStorage.clear();
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        const { data } = await authService.login(email, password);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        const refresh = localStorage.getItem('refresh_token');
        try {
            if (refresh) await authService.logout(refresh);
        } catch { /* ignore */ }
        localStorage.clear();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
