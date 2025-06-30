// Create frontend/src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "../utils/api";

interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load token from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      setToken(savedToken);
      // Verify token and get user info
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("auth_token", tokenFromUrl);
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const userInfo = await api.getCurrentUser(tokenToVerify);
      setUser(userInfo);
      setLoading(false);
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    }
  };

  const login = async () => {
    try {
      // ALWAYS use Google OAuth (ignore development/production check)
      console.log("🚀 Using Google OAuth login...");
      const { auth_url } = await api.getGoogleAuthUrl();
      console.log("🔗 Redirecting to Google:", auth_url);
      window.location.href = auth_url;

      /* OLD CODE - Comment out or delete:
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Development login
      const response = await api.devLogin();
      localStorage.setItem('auth_token', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    } else {
      // Production OAuth2 flow
      const { auth_url } = await api.getGoogleAuthUrl();
      window.location.href = auth_url;
    }
    */
    } catch (error) {
      console.error("❌ Login failed:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
